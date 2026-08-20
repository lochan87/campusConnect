# 02 — Architecture

## Request Lifecycle

### HTTP (REST) Request

```
1. Browser calls axios → Authorization header + X-User-ID header added by api.js interceptor
2. Express receives request
3. express-rate-limit checks per-IP limits (configured via env, default 10,000/60s in dev)
4. Helmet adds HTTP security headers
5. CORS allows the origin in FRONTEND_URL env var
6. express.json() parses body
7. Route handler runs
   ├── requireAuth middleware verifies JWT if route is protected
   ├── Joi validation (validatePost / validatePoll) runs if defined
   └── Handler logic: Firestore read/write, Gemini call, Socket.io emit
8. HTTP response returned
```

### WebSocket (Socket.io)

```
1. Client calls socketService.connect() → auth: { token: "Bearer <jwt>" } in handshake
2. Server socket middleware (websocket.js) verifies the Bearer token
3. On success, socket.data.user is populated; on failure, socket is disconnected with an error event
4. Client calls socketService.joinCampus(campusId) → emits "join_campus" event
5. Server puts socket into room "campus_<campusId>"
6. On content creation (posts, polls, events), route handlers call io.to("campus_<id>").emit(...)
7. All connected clients in that room receive the event without polling
```

---

## Authentication Flow

Authentication is custom JWT — there is **no Firebase client-side auth** used for login. Firebase is used only for:

1. Firestore (database)
2. Password reset link generation (`admin.auth().generatePasswordResetLink(...)`) in `routes/forgot.js`

### Registration
```
POST /api/users/register
  → Validate fields with Joi
  → Hash password with bcrypt (saltRounds=10)
  → Check email uniqueness in Firestore users collection
  → Auto-generate a department slug (first word of department name, lowercased, spaces→underscores)
  → Write user document to Firestore
  → Sign JWT: payload = { uid: docId, email }, signed with JWT_SECRET, expires 7 days
  → Return { user, token }
```

### Login
```
POST /api/users/login
  → Look up user by email in Firestore
  → bcrypt.compare(plainPassword, storedHash)
  → Sign JWT with same secret
  → Return { user, token }
```

### Token Verification (requireAuth middleware)
The `requireAuth` middleware in `middleware/auth.js`:
```
Authorization: Bearer <token>
  → jwt.verify(token, JWT_SECRET)   // catches expiry, signature mismatch
  → Optionally verify uid.hmac      // if hmac field present in payload
  → Attach req.user = { uid, email, ... }
  → Call next()
```

The HMAC component uses `crypto.createHmac('sha256', JWT_SECRET).update(uid).digest('hex')` and stores `uid.hmac` in the JWT payload. The socket handshake middleware reuses the same token format.

### Client-Side Storage
- `localStorage['authToken']` — the raw JWT
- `localStorage['user']` — the full user object (JSON-stringified)
- The `authService` singleton in `services/auth.js` reads both on startup. `api.js` attaches the token to every Axios request via request interceptor.

---

## Real-Time Architecture (Socket.io Rooms)

All rooms are **server-managed** — the client never writes room names arbitrarily.

| Room name | Purpose | Joined by |
|-----------|---------|-----------|
| `campus_<campusId>` | Campus-wide posts, polls, events | Client emits `join_campus` after login |
| `location_<location>` | Location-scoped posts / polls | Client emits `join_location` |
| `post_<postId>` | Per-post comment room | Client emits `join_post` when opening a post |
| `dm_<convId>` | Private conversation room | Client emits `join_dm_room` when opening DMs |

### Socket Events — Server → Client

| Event | Payload | Trigger |
|-------|---------|---------|
| `post_created` | post object | POST /api/posts |
| `post_updated` | post object | PUT /api/posts/:id |
| `post_deleted` | `{ postId }` | DELETE /api/posts/:id |
| `post_liked` | `{ postId, likes, userHasLiked }` | POST /api/posts/:id/like |
| `poll_created` | poll object | POST /api/polls |
| `poll_updated` | poll result | POST /api/polls/:id/vote |
| `poll_closed` | `{ pollId }` | PUT /api/polls/:id/close |
| `poll_deleted` | `{ pollId }` | DELETE /api/polls/:id |
| `event_created` | event object | POST /api/events |
| `user_updated` | `{ userId, reputation, ... }` | Post/poll/event creation or like |
| `comment_added` | `{ postId, comment, commentCount }` | POST /api/posts/:id/comments |
| `comment_deleted` | `{ postId, commentId, commentCount }` | DELETE /api/posts/:id/comments/:id |
| `dm_new_message` | `{ conversationId, message }` | POST /api/messages/:convId/messages |
| `dm_read_receipt` | `{ conversationId, readBy }` | PUT /api/messages/:convId/read |
| `dm_message_deleted` | `{ conversationId, messageId, deletedForBoth }` | DELETE /api/messages/:convId/messages/:msgId |
| `dm_typing` | `{ conversationId, userId, username }` | client emits `dm_typing_start` |
| `notification` | `{ type, message, data }` | Server-initiated broadcast |

### Socket Events — Client → Server

| Event | Handler |
|-------|---------|
| `join_campus` | Socket joins `campus_<id>` room |
| `join_location` | Socket joins `location_<id>` room |
| `join_post` | Socket joins `post_<id>` room |
| `leave_post` | Socket leaves `post_<id>` room |
| `join_dm_room` | Socket joins `dm_<convId>` |
| `leave_dm_room` | Socket leaves `dm_<convId>` |
| `join_dm_rooms` | Batch join multiple DM rooms |
| `dm_typing_start` | Server broadcasts `dm_typing` to room |
| `dm_typing_stop` | Server broadcasts `dm_stop_typing` to room |
| `typing_start` | Server broadcasts `user_typing` |
| `typing_stop` | Server broadcasts `user_stopped_typing` |

---

## AI Moderation (Gemini)

Gemini (`geminiService.js`) is invoked synchronously on the request path in three places:

1. **POST /api/posts** — moderates `content` before saving
2. **PUT /api/posts/:id** — moderates updated `content` before saving
3. **POST /api/posts/:id/comments** — moderates comment `content`

### Moderation Logic
```
geminiService.moderateContent(content)
  → Returns { isAppropriate: bool, severity: 'low'|'medium'|'high', concerns: string[] }

If severity === 'high':
  → Request rejected with 400 "Content violates community guidelines"

If severity !== 'high':
  → Content saved with moderation.isReviewed = (severity === 'low')
  → Medium-severity content is stored but flagged for manual review
```

**Fail-closed behaviour:** If Gemini returns an unparseable JSON response, the service catches the error and returns `{ isAppropriate: false, severity: 'medium', concerns: [...] }` — the content is stored but flagged, not silently approved.

### Other AI Functions
- `suggestCategory(content)` → POST /api/posts/suggest-category (requires auth to prevent API abuse) → returns one of `['general', 'events', 'lost_found', 'food', 'announcements', 'academic', 'memes', 'housing', 'jobs', 'sports']`
- `generateEventSummary(events)` → GET /api/posts/summary/events → natural language summary of events from the past 7 days; no auth required

---

## Background Jobs (cleanupService)

`services/cleanupService.js` runs a `setInterval` loop (every 60 minutes by default) that:

1. Queries Firestore for expired polls (`isActive: true`, `expiresAt < now`)
2. For each expired poll: deletes the poll document and all related `comment_post` and `post_reports` docs
3. Queries Firestore for events with a past date
4. For each expired event: deletes the event and associated `like_event` and `comment_event` docs
5. Returns `{ deletedCount, totalChecked }` — also exposed via `POST /api/polls/cleanup` and `GET /api/stats/cleanup`

The cleanup service is started in `server.js` after Firebase initialises.

---

## Query Strategy

Firestore composite indexes are not configured in this codebase. To avoid `FAILED_PRECONDITION` errors, all routes use one of two strategies:

1. **Single-field `orderBy` only** — fetch a batch larger than needed (e.g., `limit * 10`), then filter in JavaScript
2. **Direct document reads** — by ID where possible (e.g., like status check: `like_post/<postId>_<userId>`)

This is a conscious development trade-off documented with inline comments (`// For development: Use simple orderBy only`). In production at scale, Firestore composite indexes should be created and the JS filtering removed.

---

## Reputation System

Points are awarded **non-decreasingly** — reputation never goes down.

| Action | Points |
|--------|--------|
| Create a post or poll | +5 |
| Create an event (organizer role) | +10 |
| Create an event (volunteer role) | +5 |
| Receive a like on a post or event | +1 |
| Receive a comment on a post or event | +1 |

Points are **not** awarded to demo users (detected by `userId.startsWith('demo-')` or email containing `demo-user-`). All reputation updates happen within Firestore transactions for consistency, and emit `user_updated` via Socket.io so the UI updates without a page refresh.
