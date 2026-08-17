# CampusConnect 🎓

> A real-time campus social platform - your college's own Reddit + Notice Board + Messenger in one.

CampusConnect is a full-stack web application built for college communities. Students can post updates, share memes, report lost items, create polls, organise events and chat with each other - all in real-time. Every post is AI-moderated using Gemini to keep the feed clean. Users build reputation by contributing, and the leaderboard tracks the most active members on your campus.

**🌐 Live Demo:** https://campusconnect-87.vercel.app

---

## ✨ Features

### 📰 Posts & Feed
- Campus-wide live feed with real-time updates via WebSockets
- Categories: Events, Lost & Found, Food, Memes, Announcements, Academic, General
- Location-based filtering (building / department / area)
- Anonymity toggle — post with your name or stay anonymous
- Image upload support (Base64 stored in Firestore)
- Upvote / downvote with live reputation system
- AI-powered content moderation via Gemini API on every post
- Report post functionality

### 📊 Polls
- Create multiple-choice polls with expiry timers
- Real-time live vote counting with progress bars
- Anonymous voting support
- Poll expiration auto-cleanup (runs every 6h in production)

### 🎉 Events
- Create campus events with poster image upload
- Like and comment on events
- Event expiration auto-cleanup
- Reputation bonus: +10 for organisers, +5 for volunteers

### 💬 Direct Messaging
- Real-time 1:1 direct messaging via WebSockets
- User search to start new conversations
- Conversation list with last message preview

### 👤 User System
- Registration with Student ID validation (YYCCCDDNNN format)
- Course and department auto-populated from Student ID
- Email availability check before registration
- Branded welcome email on registration (Nodemailer + Gmail SMTP)
- Login with JWT token authentication
- Profile page with avatar upload (Base64)
- Username change
- Account deletion (cleans all posts, polls, likes, comments)
- Reputation system with leaderboard (campus-scoped)

### 🔑 Password Reset
- Custom branded HTML password reset email
- Firebase-generated secure reset link

### 🏆 Leaderboard
- Top users by reputation and post activity
- Campus-scoped filtering (only your campus)
- Demo users excluded automatically

### 🔍 Search
- Cross-collection search across posts and events

### 🌙 Dark Mode
- Full dark/light mode toggle persisted across sessions

---

## 🏗 Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool |
| Vanilla CSS | Styling |
| Framer Motion | Animations |
| Socket.io Client | Real-time WebSocket |
| React Router v6 | Routing |
| Axios | HTTP API calls |
| React Hot Toast | Notifications |

### Backend
| Tool | Purpose |
|---|---|
| Node.js + Express | API server |
| Socket.io | WebSocket server |
| Firebase Admin SDK | Firestore + Auth |
| Gemini AI API | Content moderation |
| Nodemailer | Transactional emails |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |
| compression | Gzip responses |
| jsonwebtoken | JWT tokens |
| Joi | Validation |

### Infrastructure
| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Email | Gmail SMTP |

---

## 📁 Project Structure

```
campusConnect/
├── backend/
│   ├── config/firebase.js
│   ├── middleware/auth.js
│   ├── middleware/validation.js
│   ├── routes/
│   │   ├── users.js        # Auth, profile, account
│   │   ├── posts.js        # Posts, likes, comments
│   │   ├── polls.js        # Polls, voting
│   │   ├── events.js       # Events, likes, comments
│   │   ├── messages.js     # Direct messaging
│   │   ├── leaderboard.js  # Reputation leaderboard
│   │   ├── search.js       # Search
│   │   ├── stats.js        # Stats
│   │   └── forgot.js       # Password reset email
│   ├── services/
│   │   ├── geminiService.js
│   │   ├── websocket.js
│   │   ├── emailService.js
│   │   ├── imageService.js
│   │   ├── storageService.js
│   │   └── cleanupService.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── vercel.json         # SPA routing for Vercel
│   ├── vite.config.mjs
│   └── package.json
└── README.md
```

---

## 🚀 Local Development

### Prerequisites
- Node.js v18+
- Firebase project (Firestore + Auth enabled)
- Gemini AI API key
- Gmail App Password

### Setup

```bash
# Clone
git clone https://github.com/lochan87/campusConnect.git
cd campusConnect

# Backend
cd backend
npm install
cp .env.example .env   # fill in your values
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:5000 |
| Health | http://localhost:5000/health |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GEMINI_API_KEY=your-gemini-api-key
JWT_SECRET=your-long-random-secret
EMAIL_SERVICE=gmail
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-gmail-app-password
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your@gmail.com
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=CampusConnect
VITE_ENABLE_DEMO_MODE=true
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## 🔧 Key API Endpoints

### Auth & Users
| Method | Endpoint | Auth |
|---|---|---|
| POST | /api/users/register | — |
| POST | /api/users/login | — |
| DELETE | /api/users/delete-account | ✅ |
| PUT | /api/users/:id | ✅ |
| POST | /api/auth/forgot-password | — |

### Content
| Method | Endpoint | Auth |
|---|---|---|
| GET/POST | /api/posts | —/✅ |
| POST | /api/posts/:id/like | ✅ |
| GET/POST | /api/polls | —/✅ |
| POST | /api/polls/:id/vote | ✅ |
| GET/POST | /api/events | —/✅ |
| GET | /api/leaderboard | — |
| GET | /api/search | — |
| GET | /health | — |

---

## 🔒 Security

- HTTP security headers via Helmet
- CORS restricted to FRONTEND_URL only
- Rate limiting: 100 req / 15 min per IP (production)
- JWT authentication on all write endpoints
- Joi input validation on all creation routes
- AI content moderation on every post and event
- No admin/debug routes in production
- No PII in server logs
- All console.* stripped from production frontend bundle (Vite terser)

---

## 🎮 Demo Mode

Click **"Try Demo"** on the login page - no registration required. Demo users are excluded from the leaderboard and do not earn reputation.

---

## 🚀 Deployment

| Service | Platform | Config |
|---|---|---|
| Backend | Render | Root: `backend/`, Start: `node server.js` |
| Frontend | Vercel | Root: `frontend/`, Output: `build/` |

Auto-deploys active on every push to `main`.

> Render free tier sleeps after 15 min of inactivity — first request after sleep takes ~30s.

---

## 📝 License

MIT License

---

**CampusConnect** — Bringing your campus community together in real-time 🎓✨
