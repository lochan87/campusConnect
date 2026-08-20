# 07 — Deployment

## Architecture Overview

```
Users
  │
  ├──[HTTPS]──→ Vercel                    (Frontend: React SPA)
  │               ↓ VITE_API_URL
  └──[HTTPS/WSS]─→ Render.com             (Backend: Express + Socket.io)
                    ↓
                    Firebase (Firestore + Auth)
                    Google Gemini API
                    Gmail SMTP
```

---

## Backend — Render.com

### Service type
**Web Service** (not a background worker) — Render manages the process lifecycle.

### Build & Start commands

```
Build command:  npm install
Start command:  node server.js
```

No build step is required for the backend (it's not transpiled).

### Environment Variables

Set all variables from `backend/.env.example` in the Render dashboard (Environment → Environment Variables). Key production values:

| Variable | Production value |
|----------|----------------|
| `NODE_ENV` | `production` |
| `PORT` | Render injects this automatically; leave unset or set to `5000` |
| `FRONTEND_URL` | Your Vercel URL, e.g. `https://campus-connect.vercel.app` (no trailing slash) |
| `FIREBASE_PRIVATE_KEY` | The full private key with literal `\n` characters |

> **Render private key gotcha:** When pasting `FIREBASE_PRIVATE_KEY` into Render's environment variable UI, paste the raw value (with actual newline characters in the textarea). Render does NOT interpret `\n` escape sequences from the dashboard — only from a `.env` file. Test your Firebase connection after deploying by checking the health endpoint.

### Render free tier limitations

1. **Cold starts:** The free tier spins down inactive services after 15 minutes. First request after idle can take 30–50 seconds.
2. **Gmail SMTP port 465 blocked:** Render blocks outbound port 465. This is why `emailService.js` uses `secure: false` + `requireTLS: true` (STARTTLS over port 587). This is already handled in the code.
3. **New transporter per email:** Render's free tier drops idle TCP connections to Gmail. Creating a new Nodemailer transporter per call (instead of a cached singleton) is the workaround. Already implemented.

### Socket.io on Render

Socket.io works on Render with the default configuration. The `transports: ['websocket', 'polling']` setting allows automatic fallback if WebSocket is not available.

### Health check

Configure Render's health check to `GET /health`. The endpoint returns `{ "status": "ok" }` with HTTP 200.

---

## Frontend — Vercel

### Deployment method

Connect the GitHub repository to Vercel. Vercel auto-detects Vite and uses the correct build settings.

### Build configuration

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Root Directory | `frontend/` |
| Build Command | `npm run build` |
| Output Directory | `build` (not `dist` — configured in `vite.config.mjs`) |
| Install Command | `npm install` |

### Environment Variables

Set these in Vercel Project Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-render-backend.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://your-render-backend.onrender.com` |
| `VITE_APP_NAME` | `CampusConnect` |
| `VITE_ENABLE_DEMO_MODE` | `true` or `false` |

> **Important:** `VITE_*` variables must be set in Vercel — they are embedded at build time, not runtime. Changing them requires a new deployment.

### SPA Routing

`vercel.json` contains a single rewrite rule:
```json
{"rewrites":[{"source":"/(.*)", "destination":"/index.html"}]}
```
This ensures that direct navigation to routes like `/post/abc123` or `/messages` returns `index.html` instead of a 404 — React Router handles the routing on the client side.

### Production build notes

`vite.config.mjs` strips all `console.*` calls and debugger statements in production builds (via Terser). The production bundle is split into:
- `vendor-react` — React + React DOM + React Router
- `vendor-motion` — Framer Motion
- `vendor-icons` — react-icons
- `vendor-firebase` — socket.io-client (mislabeled in config)
- `vendor-ui` — react-hot-toast + canvas-confetti

---

## CORS Configuration

The backend's CORS is configured with a single allowed origin:

```js
// server.js
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
})
```

In production, `FRONTEND_URL` must be exactly the Vercel deployment URL (e.g., `https://campusconnect.vercel.app`). If you have multiple Vercel preview deployments, each gets a different URL — you'd need to update `FRONTEND_URL` on Render or use a regex-based CORS config.

---

## Firestore Configuration

### Security Rules

The `.firestore.rules` file (if present) is not covered here — the backend uses the **Firebase Admin SDK**, which bypasses Firestore security rules. Security is enforced by the Express `requireAuth` middleware and route-level ownership checks, not by Firestore rules.

For a production deployment that also uses Firebase client libraries from the frontend (not currently the case), security rules would be important.

### Indexes

No `firestore.indexes.json` is checked in. The codebase intentionally avoids composite indexes. If you want to remove the client-side filtering workarounds for performance:

1. Create composite indexes in Firebase Console for the queries you need
2. Update the route handlers to use `where()` + `orderBy()` together

---

## Updating the Deployment

### Backend (Render)
Render auto-deploys on push to the connected branch. Manual deploy via Render dashboard.

### Frontend (Vercel)
Vercel auto-deploys on push. Preview deployments are created for non-main branches.

---

## Known Production Issues

| Issue | Root cause | Status |
|-------|-----------|--------|
| Cold start latency (free Render tier) | Render spins down idle services | By design; upgrade plan to eliminate |
| Password reset doesn't work if user not in Firebase Auth | App uses Firestore for users, not Firebase Auth | Known gap; see setup doc |
| Event poster update (`PUT /events/:id`) uses Firebase Storage | Inconsistency with create path (base64) | If Storage not configured, update poster will fail silently |
| No composite Firestore indexes | Dev workaround (JS filtering) | Will become a performance issue at scale |
