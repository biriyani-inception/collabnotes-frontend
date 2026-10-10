if (!Auth.isLoggedIn()) window.location.href = 'index.html';

const WS_BASE = window.__CN_WS_BASE__;
const me = Auth.getUser();
let workspaces = [], currentWorkspaceId = null, pages = [], currentPageId = null;
let stompClient = null, currentSubscription = null, suppressContentBroadcast = false;
let saveDebounce = null, titleDebounce = null, typingTimeout = null;
const activeUsers = new Map();
const BLOCK_TYPES = [
  ['paragraph','Text'], ['heading','Heading'], ['todo','Checklist'], ['bullet','Bullet'],
  ['quote','Quote'], ['code','Code'], ['divider','Divider']
];

document.getElementById('me-label').textContent = me ? me.name : '';
init();

async function init() { connectStomp(); await loadWorkspaces(); }

async function loadWorkspaces() {
  workspaces = await Api.listWorkspaces();
  const select = document.getElementById('workspace-select'); select.innerHTML = '';
  if (!workspaces.length) { select.innerHTML = '<option value="">No workspaces yet</option>'; return; }
  workspaces.forEach(w => { const opt=document.createElement('option'); opt.value=w.id; opt.textContent=`${w.name} (${w.myRole.toLowerCase()})`; select.appendChild(opt); });
  currentWorkspaceId=workspaces[0].id; select.value=currentWorkspaceId; await loadPages();
}

document.getElementById('workspace-select').addEventListener('change', async e => { currentWorkspaceId=Number(e.target.value); await loadPages(); showEmptyState(); });
document.getElementById('new-workspace-btn').addEventListener('click', async()=>{ const name=prompt('Workspace name:'); if(!name)return; await Api.createWorkspace(name); await loadWorkspaces(); });
document.getElementById('invite-btn').addEventListener('click', async()=>{ if(!currentWorkspaceId)return alert('Create a workspace first.'); const email=prompt('Collaborator email:'); if(!email)return; const role=(prompt('Role: editor or viewer','editor')||'editor').toUpperCase(); try{await Api.inviteMember(currentWorkspaceId,email,role);alert('Invited.');}catch(err){alert(err.message);} });

async function loadPages(){ if(!currentWorkspaceId){document.getElementById('page-tree').innerHTML='';return;} pages=await Api.listPages(currentWorkspaceId); renderPageTree(); }
function renderPageTree(){ const tree=document.getElementById('page-tree'); tree.innerHTML=''; const byParent={}; pages.forEach(p=>{const key=p.parentId||'root';(byParent[key]??=[]).push(p);}); function level(parent,depth){(byParent[parent]||[]).forEach(p=>{const item=document.createElement('div');item.className='page-item'+(p.id===currentPageId?' active':'');item.style.paddingLeft=(8+depth*14)+'px';const label=document.createElement('span');label.textContent=p.title||'Untitled';item.appendChild(label);const del=document.createElement('button');del.className='del-btn';del.textContent='✕';del.title='Delete page';del.onclick=async ev=>{ev.stopPropagation();if(!confirm(`Delete "${p.title||'Untitled'}"?`))return;await Api.deletePage(p.id);if(currentPageId===p.id)showEmptyState();await loadPages();};item.onclick=()=>openPage(p.id);tree.appendChild(item);level(p.id,depth+1);});} level('root',0);}

document.getElementById('new-page-btn').addEventListener('click', async()=>{if(!currentWorkspaceId)return alert('Create a workspace first.');const title=prompt('Page title:','Untitled')||'Untitled';const page=await Api.createPage(currentWorkspaceId,title,currentPageId);await loadPages();openPage(page.id);});

async function openPage(pageId){ leaveCurrentPageRoom(); currentPageId=pageId; const page=await Api.getPage(pageId); document.getElementById('empty-state').style.display='none';document.getElementById('editor-scroll').style.display='flex';document.getElementById('page-title').value=page.title; renderBlocks(page.blocks?.length?page.blocks:[{type:'paragraph',content:'',completed:false}]); renderPageTree();activeUsers.clear();renderPresence();joinCurrentPageRoom(); }
function showEmptyState(){leaveCurrentPageRoom();currentPageId=null;document.getElementById('editor-scroll').style.display='none';document.getElementById('empty-state').style.display='flex';renderPageTree();}

function renderBlocks(blocks){ const list=document.getElementById('block-list'); list.innerHTML=''; blocks.forEach((b,i)=>addBlockElement({...b,position:i},false)); }
function addBlockElement(block,focus){ const list=document.getElementById('block-list'); const row=document.createElement('div'); row.className='block-row'; row.dataset.type=block.type||'paragraph';
  const grip=document.createElement('div');grip.className='block-grip';grip.textContent='⋮⋮';
  const type=document.createElement('select');type.className='block-type';BLOCK_TYPES.forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;type.appendChild(o);});type.value=block.type||'paragraph';
  const body=document.createElement('div');body.className='block-body';
  let input;
  if(type.value==='divider'){input=document.createElement('div');input.className='block-divider';} else {input=document.createElement('textarea');input.className='block-input '+type.value;input.value=block.content||'';input.rows=type.value==='code'?3:1;input.placeholder=type.value==='heading'?'Heading…':type.value==='todo'?'Task…':'Start writing…';}
  let check=null;if(type.value==='todo'){check=document.createElement('input');check.type='checkbox';check.className='todo-check';check.checked=!!block.completed;body.appendChild(check);}
  body.appendChild(input); const del=document.createElement('button');del.className='block-delete';del.textContent='×';del.title='Remove block';
  type.onchange=()=>{const blocks=collectBlocks();blocks[rowIndex(row)]=Object.assign(blocks[rowIndex(row)],{type:type.value});renderBlocks(blocks);scheduleBlockSave();};
  if(input.tagName==='TEXTAREA') input.addEventListener('input',()=>{autoSize(input);scheduleBlockSave();sendTyping();});
  if(check) check.addEventListener('change',scheduleBlockSave);
  del.onclick=()=>{row.remove();if(!document.querySelector('.block-row'))addBlockElement({type:'paragraph',content:''},true);scheduleBlockSave();};
  row.append(grip,type,body,del);list.appendChild(row);if(focus&&input.focus)input.focus();autoSize(input);return row; }
function rowIndex(row){return [...document.querySelectorAll('.block-row')].indexOf(row);}
function autoSize(el){if(el&&el.tagName==='TEXTAREA'){el.style.height='auto';el.style.height=Math.max(32,el.scrollHeight)+'px';}}
function collectBlocks(){return [...document.querySelectorAll('.block-row')].map((row,i)=>{const type=row.querySelector('.block-type').value;const ta=row.querySelector('textarea');return {type,content:ta?ta.value:'',position:i,completed:!!row.querySelector('.todo-check')?.checked};});}
function scheduleBlockSave(){if(suppressContentBroadcast)return;setSaveState('Saving…');clearTimeout(saveDebounce);saveDebounce=setTimeout(()=>{const blocks=collectBlocks();sendEdit({type:'BLOCKS_UPDATE',blocks});setSaveState('Saved');},300);}
function sendTyping(){clearTimeout(typingTimeout);sendEdit({type:'TYPING'});}

document.getElementById('add-block-btn').addEventListener('click',()=>{addBlockElement({type:'paragraph',content:''},true);scheduleBlockSave();});
document.getElementById('page-title').addEventListener('input',e=>{clearTimeout(titleDebounce);const title=e.target.value;titleDebounce=setTimeout(async()=>{await Api.updatePage(currentPageId,title,null);const p=pages.find(p=>p.id===currentPageId);if(p){p.title=title;renderPageTree();}setSaveState('Saved');},500);setSaveState('Saving…');});

function connectStomp(){const socket=new SockJS(`${WS_BASE}?token=${encodeURIComponent(Auth.getToken())}`);stompClient=Stomp.over(socket);stompClient.debug=null;stompClient.connect({},()=>{if(currentPageId)joinCurrentPageRoom();},err=>{console.error('STOMP connection error, retrying in 3s',err);setTimeout(connectStomp,3000);});}
function joinCurrentPageRoom(){if(!stompClient?.connected||!currentPageId)return;currentSubscription=stompClient.subscribe(`/topic/page/${currentPageId}`,frame=>handleBroadcast(JSON.parse(frame.body)));sendEdit({type:'PRESENCE_JOIN'});}
function leaveCurrentPageRoom(){if(currentPageId)sendEdit({type:'PRESENCE_LEAVE'});if(currentSubscription){currentSubscription.unsubscribe();currentSubscription=null;}}
function sendEdit(payload){if(!stompClient?.connected||!currentPageId)return;stompClient.send(`/app/page/${currentPageId}/edit`,{},JSON.stringify(payload));}
function handleBroadcast(msg){if(msg.pageId!==currentPageId)return;switch(msg.type){case 'BLOCKS_UPDATE':if(msg.userId===me.id)return;suppressContentBroadcast=true;renderBlocks(msg.blocks||[]);suppressContentBroadcast=false;break;case 'CONTENT_UPDATE':break;case 'PRESENCE_JOIN':if(msg.userId)activeUsers.set(msg.userId,msg.userName);renderPresence();break;case 'PRESENCE_LEAVE':if(msg.userId)activeUsers.delete(msg.userId);renderPresence();break;case 'TYPING':if(msg.userId!==me.id)flashTyping(msg.userName);break;}}
function renderPresence(){const strip=document.getElementById('presence-strip');strip.innerHTML='';if(me)activeUsers.set(me.id,me.name+' (you)');[...activeUsers.entries()].forEach(([id,name])=>{const dot=document.createElement('div');dot.className='presence-dot';dot.title=name;dot.textContent=name.trim().charAt(0).toUpperCase();strip.appendChild(dot);});}
function flashTyping(name){setSaveState(name+' is typing…');clearTimeout(typingTimeout);typingTimeout=setTimeout(()=>setSaveState('Saved'),1500);}
function setSaveState(text){document.getElementById('save-state').textContent=text;}

document.getElementById('logout-btn').addEventListener('click',()=>{leaveCurrentPageRoom();Auth.clear();window.location.href='index.html';});
window.addEventListener('beforeunload',leaveCurrentPageRoom);
