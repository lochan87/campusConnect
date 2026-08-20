# 06 — Setup & Local Development

## Prerequisites

| Tool | Required Version | Purpose |
|------|-----------------|---------|
| Node.js | 18+ recommended | Both backend and frontend |
| npm | Comes with Node | Package management |
| A Firebase project | — | Firestore + Auth (password reset) |
| A Google Gemini API key | — | Content moderation + AI features |
| A Gmail account with App Password | — | Email delivery |

---

## 1. Clone the Repo

```bash
git clone <repository-url>
cd campusConnect
```

---

## 2. Backend Setup

### Install dependencies

```bash
cd backend
npm install
```

### Create `.env` file

Copy from `.env.example` and fill in all values:

```bash
cp .env.example .env
```

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Express server port |
| `NODE_ENV` | No | `development` | Set to `production` on Render |
| `FRONTEND_URL` | Yes | `http://localhost:3000` | CORS origin; must match frontend URL exactly (no trailing slash) |
| `FIREBASE_PROJECT_ID` | Yes | `campusconnect-547c5` | From Firebase Console → Project Settings |
| `FIREBASE_CLIENT_EMAIL` | Yes | `firebase-adminsdk-…@….iam.gserviceaccount.com` | From Firebase service account JSON |
| `FIREBASE_PRIVATE_KEY` | Yes | `"-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n"` | Must include literal `\n` for newlines; wrap in double-quotes in `.env` |
| `GEMINI_API_KEY` | Yes | `AIzaSy…` | From Google AI Studio (`aistudio.google.com`) |
| `JWT_SECRET` | Yes | 64-char random hex | Run: `openssl rand -hex 64` |
| `MAX_FILE_SIZE` | No | `5242880` | 5MB in bytes |
| `ALLOWED_FILE_TYPES` | No | `image/jpeg,image/png,image/gif,image/webp` | Comma-separated MIME types |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | No | `10000` | Max requests per window per IP |
| `EMAIL_SERVICE` | Yes (for password reset) | `gmail` | Nodemailer transport |
| `EMAIL_USER` | Yes (for password reset) | `you@gmail.com` | Gmail address |
| `EMAIL_PASS` | Yes (for password reset) | `xxxx xxxx xxxx xxxx` | Gmail **App Password** (not your account password) |
| `VAPID_PUBLIC_KEY` | Optional | `BJ8y…` | For future web push notifications |
| `VAPID_PRIVATE_KEY` | Optional | `ydFX…` | |
| `VAPID_SUBJECT` | Optional | `mailto:you@gmail.com` | |

### Firebase service account setup

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Copy `project_id` → `FIREBASE_PROJECT_ID`
5. Copy `client_email` → `FIREBASE_CLIENT_EMAIL`
6. Copy `private_key` → `FIREBASE_PRIVATE_KEY` (the entire string including `-----BEGIN/END PRIVATE KEY-----`)

> **Windows tip:** In `.env`, the private key must have literal `\n` escape sequences, not actual newlines. The `.env.example` shows the correct format: `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`

### Gmail App Password setup

1. Go to your Google Account → Security
2. Enable 2-Step Verification
3. Go to Security → App Passwords
4. Generate an app password for "Mail" on "Windows Computer"
5. Use the 16-character password as `EMAIL_PASS`

### Start the backend

```bash
# Development (with nodemon if installed, or node server.js)
npm start
# or
node server.js
```

The server starts on `http://localhost:5000`. Look for:
```
🚀 CampusConnect server running on port 5000
✅ Firebase initialized successfully
🧹 Cleanup service started
```

### Verify the backend

```bash
curl http://localhost:5000/health
# Expected: {"status":"ok"}
```

---

## 3. Frontend Setup

### Install dependencies

```bash
cd frontend
npm install
```

### Create `.env` file

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | `http://localhost:5000/api` | Backend REST API base URL |
| `VITE_SOCKET_URL` | Yes | `http://localhost:5000` | Backend Socket.io URL |
| `VITE_APP_NAME` | No | `CampusConnect` | Displayed in UI |
| `VITE_VERSION` | No | `1.0.0` | |
| `VITE_ENABLE_DEMO_MODE` | No | `true` | Show demo login button |
| `VITE_ENABLE_ANALYTICS` | No | `false` | Analytics (not implemented) |
| `VITE_FIREBASE_API_KEY` | No | — | Not used by backend; no Firebase client-side code |
| `VITE_DEBUG_MODE` | No | `true` | |
| `VITE_GENERATE_SOURCEMAP` | No | `true` | |

> **Note:** The frontend does NOT use the Firebase JS SDK. The `VITE_FIREBASE_*` variables are listed in `.env.example` but are not referenced in any source file. They can be left blank.

### Start the frontend

```bash
npm run dev
```

Opens at `http://localhost:3000`. The Vite dev server proxies `/api` requests to `http://localhost:5000`, so CORS is not an issue in development.

---

## 4. First Run Walkthrough

1. Navigate to `http://localhost:3000`
2. You'll be redirected to `/login`
3. Click **Demo Login** (if `VITE_ENABLE_DEMO_MODE=true`) to get a mock user — this lets you browse but does NOT persist posts to Firestore
4. Or click **Register** to create a real account:
   - Fill in name, email, password, student ID, campus ID (any string you define), department, and year
   - The `campusId` is a key concept — all content is scoped to this value. For local testing, use the same string when registering multiple test users
5. After login, you'll see the Home feed — empty until posts are created
6. Create a post at `/create-post`

---

## 5. Development Tips

### Running both services simultaneously

Use two terminal windows:
```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm run dev
```

Or use a tool like `concurrently`:
```bash
npm install -g concurrently
concurrently "cd backend && npm start" "cd frontend && npm run dev"
```

### Firestore indexes

This codebase intentionally avoids composite Firestore indexes (see the Architecture doc). All multi-field queries are done via JavaScript filtering after a single-field `orderBy`. If you see `FAILED_PRECONDITION` errors with a link to create an index, either:
- Create the suggested index in Firebase Console, or
- Leave as-is (the code already works around this with over-fetching)

### Demo users are not saved to Firestore

`demoLogin()` generates a user object that exists only in `localStorage`. If a demo user creates a post, the post is saved to Firestore with the demo UID — but the user document itself does not exist. This is intentional and the backend handles it gracefully (the `isDemoUser()` check prevents reputation updates, so no phantom document lookups fail).

### Socket.io in development

The Vite proxy (`/api`) does NOT proxy WebSocket connections. The `VITE_SOCKET_URL` variable points the socket directly to `http://localhost:5000`. This is the correct setup for local development.

### Images are stored in Firestore

Post images and event posters are stored as base64 data URLs directly in Firestore documents (not in Firebase Storage, except for the legacy `PUT /api/events/:id` update path). This means:
- Large images slow down Firestore reads
- The 800KB validation in `storageService.validateImage()` is specifically to prevent oversized documents
- If you see Firestore document size warnings, it's from base64 images

### Password reset (local testing)

The password reset email flow calls `admin.auth().generatePasswordResetLink()` and then sends it via Gmail. In local development, this only works if:
1. A Firebase project is configured (it needs Firebase Auth, not just Firestore)
2. The email user exists in Firebase Auth (registration creates Firestore documents, but NOT Firebase Auth accounts — Firebase Auth is not used for the login flow)

> **Clarification:** Firebase Auth and Firestore are separate. This app uses Firestore for everything (users, posts, etc.) but does NOT use Firebase Auth for login (that uses custom JWT + bcrypt). Firebase Auth is only accessed by `routes/forgot.js` to generate a reset link — so if a user registered normally, their account is NOT in Firebase Auth, and `admin.auth().getUserByEmail()` will return a 404. To test password reset, you'd need to also create the user in Firebase Auth.
