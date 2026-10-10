const API_BASE = window.__CN_API_BASE__;

const Auth = {
  getToken: () => localStorage.getItem('cn_token'),
  getUser: () => JSON.parse(localStorage.getItem('cn_user') || 'null'),
  save(authResponse) {
    localStorage.setItem('cn_token', authResponse.token);
    localStorage.setItem('cn_user', JSON.stringify({
      id: authResponse.userId,
      name: authResponse.name,
      email: authResponse.email
    }));
  },
  clear() {
    localStorage.removeItem('cn_token');
    localStorage.removeItem('cn_user');
  },
  isLoggedIn() { return !!Auth.getToken(); }
};

async function apiFetch(path, options = {}) {
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    options.headers || {}
  );
  const token = Auth.getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, Object.assign({}, options, { headers }));

  if (res.status === 401 || res.status === 403) {
    if (path !== '/api/auth/login') {
      // token invalid/expired -> force re-login
      Auth.clear();
      window.location.href = 'index.html';
      return;
    }
  }

  let body = null;
  try { body = await res.json(); } catch (e) { /* no body */ }

  if (!res.ok) {
    const message = (body && body.error) ? body.error : ('Request failed (' + res.status + ')');
    throw new Error(message);
  }
  return body;
}

const Api = {
  register: (name, email, password) =>
    apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  login: (email, password) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  listWorkspaces: () => apiFetch('/api/workspaces'),

  createWorkspace: (name) =>
    apiFetch('/api/workspaces', { method: 'POST', body: JSON.stringify({ name }) }),

  inviteMember: (workspaceId, email, role) =>
    apiFetch(`/api/workspaces/${workspaceId}/invite`, {
      method: 'POST', body: JSON.stringify({ email, role })
    }),

  listPages: (workspaceId) => apiFetch(`/api/workspaces/${workspaceId}/pages`),

  createPage: (workspaceId, title, parentId) =>
    apiFetch(`/api/workspaces/${workspaceId}/pages`, {
      method: 'POST', body: JSON.stringify({ title, parentId: parentId || null })
    }),

  getPage: (pageId) => apiFetch(`/api/pages/${pageId}`),

  updatePage: (pageId, title, content, blocks = null) =>
    apiFetch(`/api/pages/${pageId}`, { method: 'PUT', body: JSON.stringify({ title, content, blocks }) }),

  deletePage: (pageId) => apiFetch(`/api/pages/${pageId}`, { method: 'DELETE' })
};
