import { useEffect, useRef, useState } from 'react';
import { Api, Auth } from '../api/client';
import { navigate } from '../router';
import { useStomp } from '../hooks/useStomp';
import PageTree from '../components/PageTree';
import BlockRow from '../components/BlockRow';

const EMPTY_BLOCK = () => ({ type: 'paragraph', content: '', completed: false });

export default function Workspace() {
  const me = Auth.getUser();

  const [workspaces, setWorkspaces] = useState(null); // null = not loaded yet
  const [workspaceId, setWorkspaceId] = useState('');
  const [pages, setPages] = useState([]);
  const [pageId, setPageId] = useState(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [renderKey, setRenderKey] = useState(0); // bumps on full re-render (like the original renderBlocks)
  const [focusIdx, setFocusIdx] = useState(null);
  const [activeUsers, setActiveUsers] = useState({});
  const [saveState, setSaveState] = useState(' ');

  // Mutable mirrors, so STOMP callbacks / timers always see the latest values.
  const r = useRef({});
  r.current.pageId = pageId;
  r.current.blocks = blocks;
  r.current.pages = pages;
  const sub = useRef(null);
  const saveDebounce = useRef(null);
  const titleDebounce = useRef(null);
  const typingTimeout = useRef(null);

  const clientRef = useStomp(() => { if (r.current.pageId) joinRoom(r.current.pageId); });

  // ---------- STOMP helpers ----------
  const connected = () => !!(clientRef.current && clientRef.current.connected);

  function sendEdit(payload, id = r.current.pageId) {
    if (!connected() || !id) return;
    clientRef.current.publish({ destination: `/app/page/${id}/edit`, body: JSON.stringify(payload) });
  }

  function joinRoom(id) {
    if (!connected() || !id) return;
    if (sub.current) { sub.current.unsubscribe(); sub.current = null; }
    sub.current = clientRef.current.subscribe(`/topic/page/${id}`, (frame) => handleBroadcast(JSON.parse(frame.body)));
    sendEdit({ type: 'PRESENCE_JOIN' }, id);
  }

  function leaveRoom() {
    if (r.current.pageId) sendEdit({ type: 'PRESENCE_LEAVE' });
    if (sub.current) { try { sub.current.unsubscribe(); } catch (e) { /* closed */ } sub.current = null; }
  }

  function handleBroadcast(msg) {
    if (msg.pageId !== r.current.pageId) return;
    switch (msg.type) {
      case 'BLOCKS_UPDATE':
        if (me && msg.userId === me.id) return;
        // remote update: re-render only, never re-broadcast
        setBlocks((msg.blocks || []).map((b, i) => ({ ...b, position: i })));
        setRenderKey((k) => k + 1);
        setFocusIdx(null);
        break;
      case 'CONTENT_UPDATE':
        break;
      case 'PRESENCE_JOIN':
        if (msg.userId) setActiveUsers((u) => ({ ...u, [msg.userId]: msg.userName }));
        break;
      case 'PRESENCE_LEAVE':
        if (msg.userId) setActiveUsers((u) => { const n = { ...u }; delete n[msg.userId]; return n; });
        break;
      case 'TYPING':
        if (!me || msg.userId !== me.id) flashTyping(msg.userName);
        break;
      default:
    }
  }

  function flashTyping(name) {
    setSaveState(name + ' is typing…');
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setSaveState('Saved'), 1500);
  }

  // ---------- data loading ----------
  async function loadPages(wsId) {
    if (!wsId) { setPages([]); return; }
    setPages(await Api.listPages(wsId));
  }

  async function loadWorkspaces() {
    const list = await Api.listWorkspaces();
    if (!list) return;
    setWorkspaces(list);
    if (!list.length) return;
    setWorkspaceId(list[0].id);
    await loadPages(list[0].id);
  }

  useEffect(() => {
    loadWorkspaces();
    const onUnload = () => leaveRoom();
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      clearTimeout(saveDebounce.current);
      clearTimeout(titleDebounce.current);
      clearTimeout(typingTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- page open / close ----------
  function showEmptyState() {
    leaveRoom();
    r.current.pageId = null;
    setPageId(null);
  }

  async function openPage(id) {
    leaveRoom();
    r.current.pageId = id;
    setPageId(id);
    const page = await Api.getPage(id);
    if (!page) return;
    setTitle(page.title);
    setBlocks(page.blocks && page.blocks.length ? page.blocks.map((b, i) => ({ ...b, position: i })) : [EMPTY_BLOCK()]);
    setRenderKey((k) => k + 1);
    setFocusIdx(null);
    setActiveUsers({});
    joinRoom(id);
  }

  // ---------- sidebar actions ----------
  async function onWorkspaceChange(e) {
    const id = Number(e.target.value);
    setWorkspaceId(id);
    await loadPages(id);
    showEmptyState();
  }

  async function newWorkspace() {
    const name = prompt('Workspace name:');
    if (!name) return;
    await Api.createWorkspace(name);
    await loadWorkspaces();
  }

  async function invite() {
    if (!workspaceId) return alert('Create a workspace first.');
    const email = prompt('Collaborator email:');
    if (!email) return;
    const role = (prompt('Role: editor or viewer', 'editor') || 'editor').toUpperCase();
    try { await Api.inviteMember(workspaceId, email, role); alert('Invited.'); }
    catch (err) { alert(err.message); }
  }

  async function newPage() {
    if (!workspaceId) return alert('Create a workspace first.');
    const t = prompt('Page title:', 'Untitled') || 'Untitled';
    const page = await Api.createPage(workspaceId, t, pageId);
    await loadPages(workspaceId);
    openPage(page.id);
  }

  async function deletePage(p) {
    if (!confirm(`Delete "${p.title || 'Untitled'}"?`)) return;
    await Api.deletePage(p.id);
    if (r.current.pageId === p.id) showEmptyState();
    await loadPages(workspaceId);
  }

  function logout() {
    leaveRoom();
    Auth.clear();
    navigate('/');
  }

  // ---------- editing ----------
  function scheduleBlockSave() {
    setSaveState('Saving…');
    clearTimeout(saveDebounce.current);
    saveDebounce.current = setTimeout(() => {
      const payload = r.current.blocks.map((b, i) => ({
        type: b.type || 'paragraph',
        content: b.type === 'divider' ? '' : (b.content || ''),
        position: i,
        completed: !!b.completed,
      }));
      sendEdit({ type: 'BLOCKS_UPDATE', blocks: payload });
      setSaveState('Saved');
    }, 300);
  }

  function updateBlocks(next, { typing = false } = {}) {
    r.current.blocks = next;
    setBlocks(next);
    scheduleBlockSave();
    if (typing) { clearTimeout(typingTimeout.current); sendEdit({ type: 'TYPING' }); }
  }

  const changeBlock = (i, patch) =>
    updateBlocks(r.current.blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)), { typing: 'content' in patch });

  const changeType = (i, type) => {
    updateBlocks(r.current.blocks.map((b, j) => (j === i ? { ...b, type } : b)));
    setRenderKey((k) => k + 1);
    setFocusIdx(null);
  };

  const deleteBlock = (i) => {
    let next = r.current.blocks.filter((_, j) => j !== i);
    if (!next.length) { next = [{ type: 'paragraph', content: '' }]; setFocusIdx(0); }
    updateBlocks(next);
  };

  const addBlock = () => {
    const next = [...r.current.blocks, { type: 'paragraph', content: '' }];
    setFocusIdx(next.length - 1);
    updateBlocks(next);
  };

  function onTitleInput(e) {
    const t = e.target.value;
    setTitle(t);
    clearTimeout(titleDebounce.current);
    titleDebounce.current = setTimeout(async () => {
      const id = r.current.pageId;
      await Api.updatePage(id, t, null);
      setPages((ps) => ps.map((p) => (p.id === id ? { ...p, title: t } : p)));
      setSaveState('Saved');
    }, 500);
    setSaveState('Saving…');
  }

  // ---------- presence ----------
  const people = { ...activeUsers };
  if (me) people[me.id] = me.name + ' (you)';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">CollabNotes</div>
        <div className="sidebar-section-title">Workspace</div>
        <select className="workspace-select" value={workspaceId} onChange={onWorkspaceChange}>
          {workspaces && !workspaces.length && <option value="">No workspaces yet</option>}
          {(workspaces || []).map((w) => (
            <option key={w.id} value={w.id}>{`${w.name} (${w.myRole.toLowerCase()})`}</option>
          ))}
        </select>
        <div className="sidebar-section-title">Pages</div>
        <PageTree pages={pages} currentPageId={pageId} onOpen={openPage} onDelete={deletePage} />
        <div className="sidebar-actions">
          <button className="text-btn" onClick={newPage}>+ New page</button>
          <button className="text-btn" onClick={newWorkspace}>+ New workspace</button>
          <button className="text-btn" onClick={invite}>+ Invite collaborator</button>
        </div>
        <div className="sidebar-footer">
          <span>{me ? me.name : ''}</span>
          <button className="logout-link" onClick={logout}>Log out</button>
        </div>
      </aside>

      <main className="editor-area">
        <div className="editor-topbar">
          <div className="presence-strip">
            {pageId != null && Object.entries(people).map(([id, name]) => (
              <div key={id} className="presence-dot" title={name}>{name.trim().charAt(0).toUpperCase()}</div>
            ))}
          </div>
          <div className="save-state">{saveState}</div>
        </div>

        {pageId != null ? (
          <div className="editor-scroll" style={{ display: 'flex' }}>
            <div className="editor-page">
              <input className="page-title-input" placeholder="Untitled" value={title} onChange={onTitleInput} />
              <div className="editor-hint">Write freely. Use the block controls to shape your page.</div>
              <div className="block-list">
                {blocks.map((b, i) => (
                  <BlockRow
                    key={renderKey + '-' + i}
                    block={b}
                    autoFocus={focusIdx === i}
                    onChange={(patch) => changeBlock(i, patch)}
                    onTypeChange={(t) => changeType(i, t)}
                    onDelete={() => deleteBlock(i)}
                  />
                ))}
              </div>
              <button className="add-block-btn" onClick={addBlock}>＋ Add block</button>
            </div>
          </div>
        ) : (
          <div className="empty-state"><div>Select a page from the sidebar, or create a new one.</div></div>
        )}
      </main>
    </div>
  );
}
