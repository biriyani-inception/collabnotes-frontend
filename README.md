# CollabNotes React Frontend

React + Vite frontend for the CollabNotes Spring Boot API.

## Local development
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev`.

## Production build
`npm run build` creates the deployable `dist/` folder.

## Netlify deployment
- Import `biriyani-inception/collabnotes-frontend` from GitHub.
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable (optional): `VITE_API_BASE=https://YOUR-RENDER-SERVICE.onrender.com`
- Optional WebSocket override: `VITE_WS_BASE=https://YOUR-RENDER-SERVICE.onrender.com/ws`

The app defaults to `https://collabnotes-backend.onrender.com`. If Render gives your service a different URL, set the two Netlify environment variables above and redeploy.

The backend must be deployed and reachable for registration, login, pages, and live collaboration to work.
