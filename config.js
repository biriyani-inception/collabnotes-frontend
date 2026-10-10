// Runtime config for the frontend. Loaded BEFORE api.js / app.js.
// In production (hosted on Vercel) we point at the Render backend;
// in local dev (file:// or localhost) we point at localhost:8080.
// Override at runtime by setting window.__CN_API_BASE__ / window.__CN_WS_BASE__
// in the browser console before the page scripts run.

(function () {
  var isProd = /\.vercel\.app$/.test(location.hostname)
            || /\.onrender\.com$/.test(location.hostname); // tolerate custom domains too
  var PROD_API = 'https://collabnotes-backend.onrender.com';
  window.__CN_API_BASE__ = isProd
    ? (window.__CN_API_BASE__ || PROD_API)
    : (window.__CN_API_BASE__ || 'http://localhost:8080');
  window.__CN_WS_BASE__ = isProd
    ? (window.__CN_WS_BASE__ || PROD_API + '/ws')
    : (window.__CN_WS_BASE__ || 'http://localhost:8080/ws');
})();