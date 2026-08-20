# 04 — Frontend Reference

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── App.jsx                  # Root — context tree, router, lazy-loaded pages
│   ├── App.css                  # Global styles
│   ├── main.jsx                 # ReactDOM.createRoot entry point
│   │
│   ├── pages/                   # One file per route (all lazy-loaded)
│   │   ├── Home.jsx             # Main feed (posts, polls, events tabs)
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── Profile.jsx          # /profile and /profile/:userId
│   │   ├── CreatePost.jsx
│   │   ├── CreatePoll.jsx
│   │   ├── CreateEvent.jsx      # Also handles /events/edit/:eventId
│   │   ├── PostDetail.jsx
│   │   ├── EventDetail.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── Settings.jsx
│   │   ├── Search.jsx
│   │   └── Messages.jsx         # DM UI
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   └── ui/
│   │       ├── BackToTop.jsx
│   │       └── CommandPalette.jsx
│   │
│   ├── context/
│   │   ├── AuthContext.jsx      # useAuth hook
│   │   ├── PostContext.jsx      # usePosts hook
│   │   ├── NotificationContext.jsx  # useNotifications hook
│   │   ├── ThemeContext.jsx     # useTheme hook
│   │   └── DMContext.jsx        # useDM hook
│   │
│   ├── services/
│   │   ├── api.js               # Axios instance + all API call functions
│   │   ├── auth.js              # AuthService class singleton
│   │   └── socket.js            # SocketService class singleton
│   │
│   └── utils/
│       └── soundEffects.js      # soundFx used by DMContext for notification sounds
│
├── vite.config.mjs              # Port 3000, proxy /api → localhost:5000, chunking
├── vercel.json                  # SPA rewrite: all routes → /index.html
└── .env.example
```

---

## Routing (`App.jsx`)

All pages are lazy-loaded using `React.lazy()` and wrapped in `<Suspense fallback={<PageLoader />}>`. Route protection is implicit: unauthenticated users see only `/login`, `/register`, `/forgot-password`; all other routes redirect to `/login`.

| Path | Component |
|------|-----------|
| `/` | `Home` |
| `/login` | `Login` |
| `/register` | `Register` |
| `/forgot-password` | `ForgotPassword` |
| `/profile` | `Profile` (own profile) |
| `/profile/:userId` | `Profile` (another user) |
| `/create-post` | `CreatePost` |
| `/create-poll` | `CreatePoll` |
| `/create-event` | `CreateEvent` |
| `/events/edit/:eventId` | `CreateEvent` (edit mode) |
| `/event/:eventId` | `EventDetail` |
| `/post/:postId` | `PostDetail` |
| `/leaderboard` | `Leaderboard` |
| `/settings` | `Settings` |
| `/search` | `Search` |
| `/messages` | `Messages` |
| `/messages/:conversationId` | `Messages` |

The `/messages` route is rendered **without the standard padding wrapper** — it handles its own scroll and layout because it is a full-height chat UI.

**Socket connection lifecycle** is managed in `App.jsx`:
```js
useEffect(() => {
  if (user) {
    socketService.connect();
    // on connect → joinCampus(user.campusId)
  }
  return () => socketService.disconnect(); // on user logout
}, [user]);
```

---

## Context API

All contexts are provided at the app root in this order (outer to inner):
```
ThemeProvider
  AuthProvider
    PostProvider
      NotificationProvider
        DMProvider
          AppContent
```

### `AuthContext` (`useAuth`)

State: `{ user, isAuthenticated, loading, error }`

Exposed actions:

| Function | Description |
|----------|-------------|
| `login(credentials)` | Calls `authService.login()`, dispatches `LOGIN_SUCCESS` |
| `register(userData)` | Calls `authService.register()`, dispatches `LOGIN_SUCCESS` |
| `demoLogin(campusId)` | Generates a random mock user (no backend call), stores in localStorage only |
| `logout()` | Clears localStorage + state |
| `updateUser(userData)` | Calls `authService.updateProfile()` |
| `updateAvatar(file)` | Uploads via `POST /api/users/profile/:id/avatar`, persists in localStorage |
| `removeAvatar()` | Calls `DELETE /api/users/profile/:id/avatar` |
| `refreshUserData()` | Re-fetches user from backend |
| `clearError()` | Clears `state.error` |
| `canPerformAction(action, resource)` | Permission check (create_post, vote, moderate, delete_post, etc.) |

Listens to `socketService.on('userUpdated', ...)` to update reputation/postCount in real time.

On startup: attempts to restore session from `localStorage['user']` + `localStorage['authToken']` and calls `authService.refreshUser()` to re-fetch latest data.

### `PostContext` (`usePosts`)

State: `{ posts, polls, events, loading, pollsLoading, eventsLoading, error, hasMore, filters }`

Key behaviour:
- `fetchPosts()` is called automatically when `state.filters` or `user.campusId` changes (useEffect dependency)
- All three lists are updated in real time via socket events
- `loadMorePosts()` calls `fetchPosts(true)` — appends to existing list, increments offset

Exposed actions:

| Function | Description |
|----------|-------------|
| `fetchPosts(loadMore?)` | Fetches posts with current filters + pagination |
| `fetchPolls()` | Fetches active polls for current campus |
| `fetchEvents()` | Fetches upcoming events for current campus |
| `createPost(postData)` | POST /api/posts — expects post to arrive via socket |
| `createPoll(pollData)` | POST /api/polls — expects poll to arrive via socket |
| `likePost(postId)` | POST /api/posts/:id/like |
| `likeEvent(eventId)` | POST /api/events/:id/like |
| `voteOnPoll(pollId, optionIndexes)` | POST /api/polls/:id/vote |
| `deletePost(postId)` | DELETE /api/posts/:id |
| `editPost(postId, postData)` | PUT /api/posts/:id (FormData or plain object) |
| `deleteEvent(eventId)` | DELETE /api/events/:id (also updates local state immediately) |
| `editEvent(eventId, eventData)` | PUT /api/events/:id |
| `updateFilters(newFilters)` | Merges into `state.filters`, triggers re-fetch |
| `refreshPosts()` | Manual re-fetch |
| `loadMorePosts()` | Infinite scroll load more |
| `updateCommentCount(postId, increment)` | Optimistic update |

### `NotificationContext` (`useNotifications`)

State: `{ notifications, unreadCount, isConnected, connectionStatus }`

Notifications are persisted in `localStorage` keyed by `cc_notifications_<uid>` — they survive page refresh.

Generates notifications from socket events:
- `newPost` → categorised message (announces, food, lost&found, etc.)
- `newPoll` → poll notification
- `eventUpdated` → event update notification
- `dmNewMessage` → DM notification (only if user is **not** currently on `/messages`)

Max 50 notifications kept in memory.

### `ThemeContext` (`useTheme`)

State: `{ isDarkMode, theme }`

- Reads from `localStorage['campusconnect-theme']` on mount; falls back to `window.matchMedia('(prefers-color-scheme: dark)')`
- Toggles `document.documentElement.classList` (`dark` class) — compatible with Tailwind dark mode
- Exposed: `{ isDarkMode, toggleTheme, theme }`

### `DMContext` (`useDM`)

The most complex context. Manages the full DM system state:

State: `{ conversations, messages, typingUsers, activeConversationId, totalUnread, loadingConversations, loadingMessages, hasMoreMessages }`

Key features:
- `messages` is keyed by `convId` — each entry is an array of message objects (chronological)
- Optimistic message sending: message is appended immediately, then confirmed or replaced when server responds
- Cursor-based pagination: older messages loaded on scroll-up via `?before=<messageId>`
- Typing indicator management: `typingUsers[convId][userId]` = username; cleared automatically
- Sound effects: `soundFx` utility is called on new DM messages
- `totalUnread` is computed by summing `unreadCount` across all conversations

---

## Services

### `services/api.js`

Axios instance with:
- `baseURL`: `VITE_API_URL` env var (default `http://localhost:5000/api`)
- `timeout`: 30 seconds (15 seconds for file uploads)
- **Request interceptor**: attaches `Authorization: Bearer <token>` and `X-User-ID: <uid>` from localStorage
- **Response interceptor**:
  - Shows `react-hot-toast` error on failure (except 401/403 and auth endpoints)
  - On 401 (non-auth endpoint): clears localStorage and redirects to `/login`

All API functions are on the `apiService` export object. See the full list in the [Backend Reference](./03-backend.md). Notable standalone exports at the bottom of `api.js`:
- `uploadImage()` — **throws** with an explanation: images go through `createPost()` FormData, not a standalone endpoint
- `validateImageFile(file)` — client-side validation before upload
- `formatError(error)` — extracts best error message from Axios error

### `services/auth.js`

`AuthService` singleton class. Responsible for all localStorage persistence.

| Method | Description |
|--------|-------------|
| `loadUserFromStorage()` | Called in constructor; restores `currentUser` from localStorage |
| `saveUserToStorage(user, token)` | Persists both; sets `this.currentUser` |
| `clearStorage()` | On logout |
| `register(userData)` | Calls `apiService.register()`, saves token |
| `login(loginData)` | Calls `apiService.login()`, saves token |
| `logout()` | Clears storage |
| `refreshUser()` | Calls `GET /api/users/:id` + `GET /api/users/profile/:id` for avatar; re-saves |
| `updateAvatarInStorage(url)` | Updates avatar in-place without full refresh |
| `canPerformAction(action, resource)` | Client-side permission check |
| `demoLogin(campusId)` | Generates mock user with `generateMockUser()`, no server call |

### `services/socket.js`

`SocketService` singleton class — a lightweight pub/sub wrapper around Socket.io-client.

Connect call: uses `import.meta.env.VITE_SOCKET_URL` (default `http://localhost:5000`). Passes JWT via `auth: { token: "Bearer <jwt>" }`.

The internal event system (`on`, `off`, `emit`) is **separate from the Socket.io socket** — it's a `Map`-based event bus used to decouple components from the socket directly. Socket.io events are received and re-emitted through this bus using camelCase names (e.g., socket event `post_liked` → internal event `postLiked`).

On server-initiated disconnect: reconnects after 2 seconds.

---

## Build Configuration

`vite.config.mjs`:
- Dev server: port 3000, proxies `/api` to `:5000` (avoids CORS in dev)
- Output directory: `build/` (not `dist/`)
- Terser minification: strips all `console.*` and debugger statements
- Manual chunks: `vendor-react`, `vendor-motion`, `vendor-icons`, `vendor-firebase` (actually socket.io-client), `vendor-ui`
- Chunk size warning threshold: 1MB

`vercel.json`: single rewrite rule `"/(.*)" → "/index.html"` to support React Router client-side navigation.
