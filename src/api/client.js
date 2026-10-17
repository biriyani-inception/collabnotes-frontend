import { API_BASE } from '../config';
import { navigate } from '../router';

export const Auth = {
  getToken: () => localStorage.getItem('cn_token'),
  getUser: () => JSON.parse(localStorage.getItem('cn_user') || 'null'),
  save(r) {
    localStorage.setItem('cn_token', r.token);
    localStorage.setItem('cn_user', JSON.stringify({ id: r.userId, name: r.name, email: r.email }));
  },
  clear() {
    localStorage.removeItem('cn_token');
    localStorage.removeItem('cn_user');
  },
  isLoggedIn: () => !!localStorage.getItem('cn_token'),
};

export async function apiFetch(path, options = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  const token = Auth.getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, Object.assign({}, options, { headers }));

  if ((res.status === 401 || res.status === 403) && path !== '/api/auth/login') {
    Auth.clear();
    navigate('/', true);
    return;
  }

  let body = null;
  try { body = await res.json(); } catch (e) { /* no body */ }

  if (!res.ok) {
    throw new Error(body && body.error ? body.error : 'Request failed (' + res.status + ')');
  }
  return body;
}

const json = (method, data) => ({ method, body: JSON.stringify(data) });

export const Api = {
  register: (name, email, password) => apiFetch('/api/auth/register', json('POST', { name, email, password })),
  login: (email, password) => apiFetch('/api/auth/login', json('POST', { email, password })),
  listWorkspaces: () => apiFetch('/api/workspaces'),
  createWorkspace: (name) => apiFetch('/api/workspaces', json('POST', { name })),
  inviteMember: (id, email, role) => apiFetch(`/api/workspaces/${id}/invite`, json('POST', { email, role })),
  listPages: (id) => apiFetch(`/api/workspaces/${id}/pages`),
  createPage: (id, title, parentId) =>
    apiFetch(`/api/workspaces/${id}/pages`, json('POST', { title, parentId: parentId || null })),
  getPage: (id) => apiFetch(`/api/pages/${id}`),
  updatePage: (id, title, content, blocks = null) => apiFetch(`/api/pages/${id}`, json('PUT', { title, content, blocks })),
  deletePage: (id) => apiFetch(`/api/pages/${id}`, { method: 'DELETE' }),
};
