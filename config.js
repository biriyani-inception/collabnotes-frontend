// Runtime config for the frontend. Loaded BEFORE api.js / app.js.
// Local development uses localhost:8080; any deployed site uses Railway.
// Override at runtime with window.__CN_API_BASE__ / window.__CN_WS_BASE__.

(function () {
  var isLocal = location.protocol === 'file:'
    || location.hostname === 'localhost'
    || location.hostname === '127.0.0.1';
  var PROD_API = 'https://collabnotes-backend-production.up.railway.app';
  window.__CN_API_BASE__ = window.__CN_API_BASE__ || (isLocal ? 'http://localhost:8080' : PROD_API);
  window.__CN_WS_BASE__ = window.__CN_WS_BASE__ || (isLocal ? 'http://localhost:8080/ws' : PROD_API + '/ws');
})();
