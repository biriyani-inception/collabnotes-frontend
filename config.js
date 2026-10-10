// Runtime config for the frontend. Loaded BEFORE api.js / app.js.
// On production hosts we point at the Railway backend; in local dev
// (file:// or localhost) we point at localhost:8080.
// Override at runtime by setting window.__CN_API_BASE__ / window.__CN_WS_BASE__
// in the browser console before the page scripts run.

(function () {
  var isProd = /\.vercel\.app$/.test(location.hostname)
            || /\.up\.railway\.app$/.test(location.hostname);
  var PROD_API = 'https://collabnotes-backend-production.up.railway.app';
  window.__CN_API_BASE__ = isProd
    ? (window.__CN_API_BASE__ || PROD_API)
    : (window.__CN_API_BASE__ || 'http://localhost:8080');
  window.__CN_WS_BASE__ = isProd
    ? (window.__CN_WS_BASE__ || PROD_API + '/ws')
    : (window.__CN_WS_BASE__ || 'http://localhost:8080/ws');
})();