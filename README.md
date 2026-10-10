# CollabNotes — Frontend

Vanilla HTML/CSS/JS client for the CollabNotes real-time collaborative notes
platform. Talks to the Spring Boot + STOMP backend
(`biriyani-inception/collabnotes-backend`) over REST and a SockJS WebSocket.

## Run locally

```bash
cd frontend
python3 -m http.server 5500
# open http://localhost:5500
```

`config.js` auto-detects the host: on `localhost` it points at
`http://localhost:8080`, on any other hostname it points at the production
backend URL baked into the file. Override at runtime by setting
`window.__CN_API_BASE__` / `window.__CN_WS_BASE__` in the browser console
before the page scripts run.

## Deploy

Static site — works on Vercel, Netlify, GitHub Pages, or any static host.
The SockJS WebSocket uses `wss://` automatically when the page is served
over `https://`, so the same deployed files work in dev and prod.