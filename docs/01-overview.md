# 01 — Overview

## What is CampusConnect?

CampusConnect is a **campus-scoped social bulletin board** for college students. It lets students within the same campus post content, vote in polls, discover events, and message each other — all in real time. The app is deliberately scoped per-campus: users only see posts, polls, and events from their own campus.

---

## Who is it for?

- **Students** — post anonymously or publicly, vote on polls, RSVP-style interaction with events, and direct-message classmates
- **Event organisers / faculty** — create events with poster images; the system awards reputation based on the organiser role (`organizer` = +10 rep, `volunteer` = +5 rep)
- **Admins / Moderators** — Gemini AI auto-flags content at upload time; admin role check exists in the comment-delete flow

---

## Core Features

| Feature | Where it lives |
|---------|---------------|
| Social posts with images, categories, tags | `backend/routes/posts.js` |
| Anonymous posting & commenting | posts.js, polls.js, events.js |
| Voting on polls (single or multi-option) | `backend/routes/polls.js` |
| Campus events with poster images | `backend/routes/events.js` |
| Direct messaging (1-on-1) with read receipts and soft-delete | `backend/routes/messages.js` |
| Real-time updates via Socket.io | `backend/services/websocket.js` |
| AI content moderation and category suggestion | `backend/services/geminiService.js` |
| AI-generated weekly event summary | `GET /api/posts/summary/events` |
| Leaderboard (reputation + activity) | `backend/routes/leaderboard.js` |
| Full-text search (posts, polls, events) | `backend/routes/search.js` |
| Password reset via branded email | `backend/routes/forgot.js` |
| Reputation system | Inline in posts, polls, events routes |
| Dark/light theme | `frontend/src/context/ThemeContext.jsx` |
| Command palette (Ctrl+K) | `frontend/src/components/ui/CommandPalette.jsx` |
| Persistent in-app notifications | `frontend/src/context/NotificationContext.jsx` |

---

## Tech Stack

### Backend

| Technology | Version / Notes |
|-----------|----------------|
| **Node.js** with **Express** | `backend/package.json` — entry point `server.js` |
| **Firebase Admin SDK** | Firestore for all data, Firebase Auth for password reset link generation |
| **Socket.io** | Real-time events; room-based (`campus_*`, `location_*`, `dm_*`) |
| **Google Gemini AI** (`@google/generative-ai`) | Content moderation, category suggestion, event summaries |
| **Multer** | In-memory file uploads; images stored as base64 in Firestore |
| **Nodemailer** | Gmail SMTP for password-reset emails |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | Per-IP rate limiting |
| **Joi** | Request body validation for posts and polls |
| **CORS** | Configured per `FRONTEND_URL` env var |
| **UUID** | Used to generate DM message IDs |
| **jsonwebtoken** | JWT generation; HMAC verification is also custom (`uid.hmac`) |

### Frontend

| Technology | Version / Notes |
|-----------|----------------|
| **React 18** with Vite | SPA; Vite dev server on port 3000 |
| **React Router v6** | All routes in `App.jsx`; lazy-loaded pages |
| **Framer Motion** | Page transitions, sidebar slide |
| **Axios** | All HTTP calls in `services/api.js` |
| **Socket.io-client** | Singleton `SocketService` class in `services/socket.js` |
| **TailwindCSS** | Utility classes throughout (inferred from class strings) |
| **react-hot-toast** | In-app toast messages |
| **canvas-confetti** | Referenced in vite config chunk |
| **react-icons** | Icon library |

---

## High-Level Architecture

```
Browser (React + Socket.io-client)
        │
        │  HTTP (REST) via Axios
        │  WebSocket via Socket.io
        ▼
Express Server (port 5000)
        │
        ├── Firebase Firestore  (all persistent data)
        ├── Firebase Auth       (password reset links only)
        ├── Gemini AI           (moderation + summaries)
        ├── Nodemailer/Gmail    (email delivery)
        └── CleanupService      (setInterval background job)
```

All data (users, posts, polls, events, conversations, messages) lives in **Firestore**. There is no separate SQL database. Images are stored as **base64 data URLs inside Firestore documents** (not in Cloud Storage, except in one legacy update-event code path that also uses `admin.storage().bucket()`).

---

## Deployment

| Part | Platform |
|------|---------|
| Backend | Render.com (free tier; needs workaround for Gmail SMTP: `secure: false` + fresh transporter per call) |
| Frontend | Vercel; `vercel.json` rewrites all routes to `/index.html` for SPA compatibility |
