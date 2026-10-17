// Runtime config — same behaviour as the original config.js.
// Local dev -> localhost:8080; any deployed site -> the Railway backend.
// Overrides: window.__CN_API_BASE__ / window.__CN_WS_BASE__ (runtime),
// or VITE_API_BASE / VITE_WS_BASE (build time).
const isLocal =
  location.protocol === 'file:' ||
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1';
const PROD_API = 'https://collabnotes-backend-production.up.railway.app';

export const API_BASE =
  window.__CN_API_BASE__ || import.meta.env.VITE_API_BASE || (isLocal ? 'http://localhost:8080' : PROD_API);
export const WS_BASE =
  window.__CN_WS_BASE__ || import.meta.env.VITE_WS_BASE || (isLocal ? 'http://localhost:8080/ws' : PROD_API + '/ws');
