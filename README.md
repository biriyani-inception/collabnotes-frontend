# CollabNotes — Frontend (React)

React (Vite) frontend for CollabNotes. Look and behaviour are identical to the original
multi-page site; the backend is unchanged:
[collabnotes-backend](https://github.com/biriyani-inception/collabnotes-backend) (Spring Boot, JWT, STOMP over SockJS).

**Live:** https://collabnotes-frontend-eight.vercel.app

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173, talks to the backend on http://localhost:8080
npm run build    # production build in dist/
```

## Backend URL
Deployed sites default to the Railway backend (`https://collabnotes-backend-production.up.railway.app`);
localhost uses `http://localhost:8080`. Override at build time with `VITE_API_BASE` / `VITE_WS_BASE`,
or at runtime with `window.__CN_API_BASE__` / `window.__CN_WS_BASE__`.

## Structure
`src/App.jsx` (routes `/`, `/auth`, `/app`) · `src/pages/` (Landing, AuthPage, Workspace) ·
`src/components/` (PageTree, BlockRow) · `src/hooks/useStomp.js` · `src/api/client.js` · `src/styles.css` (original CSS).

Deploy: Vercel (`vercel.json`) or Netlify (`netlify.toml`) — both build with `npm run build` and serve `dist/` as an SPA.
The old vanilla files (`app.html`, `auth.html`, `js/`, `css/`, `config.js`) are left in the repo but are no longer used.
