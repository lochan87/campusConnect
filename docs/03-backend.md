# 03 — Backend Reference

## Entry Point: `server.js`

```
Port:      process.env.PORT || 5000
CORS:      { origin: process.env.FRONTEND_URL, credentials: true }
Body:      express.json({ limit: '10mb' }), express.urlencoded({ limit: '10mb', extended: true })
Security:  helmet()
Rate-limit: via express-rate-limit (env-configurable)
Static:    /uploads → ./uploads directory
```

Routes are mounted at:

| Prefix | File |
|--------|------|
| `/api/users` | `routes/users.js` |
| `/api/posts` | `routes/posts.js` |
| `/api/polls` | `routes/polls.js` |
| `/api/events` | `routes/events.js` |
| `/api/messages` | `routes/messages.js` |
| `/api/search` | `routes/search.js` |
| `/api/leaderboard` | `routes/leaderboard.js` |
| `/api/stats` | `routes/stats.js` |
| `/api/auth` | `routes/forgot.js` |
| `/health` | Inline in server.js — returns `{ status: 'ok' }` |

Socket.io is attached to the same HTTP server. The `io` instance is stored on the app: `app.set('io', io)`, so route handlers can emit events via `req.app.get('io')`.

---

## Middleware

### `middleware/auth.js` — `requireAuth`

**Token format:** `Authorization: Bearer <jwt>`

The JWT payload contains `{ uid, email }` and optionally `uid.hmac` (an HMAC of the UID using `JWT_SECRET`). Verification steps:

1. `jwt.verify(token, JWT_SECRET)` — validates signature and expiry
2. If `decoded.hmac` is present: `crypto.createHmac('sha256', JWT_SECRET).update(uid).digest('hex')` must match `decoded.hmac`
3. `req.user` is set to the decoded payload

**Token generation** (also in `auth.js`):
```js
generateToken(uid, email) // used in register + login routes
// signs with { expiresIn: '7d' }
// embeds hmac field
```

### `middleware/validation.js` — Joi schemas

**`validatePost`** — applied to `POST /api/posts`:
- `content` — required string, min 1 char, max 5000
- `category` — required, one of `['general','events','lost_found','food','announcements','academic','memes','housing','jobs','sports']`
- `campusId` — required string
- `title`, `location`, `tags` — optional

**`validatePoll`** — applied to `POST /api/polls`:
- `question` — required string, min 5 chars, max 500
- `options` — required array, min 2 items, max 10
- `campusId` — required string
- `expiresIn` — number, 1–168 (hours)
- `description`, `location`, `isAnonymous`, `allowMultiple` — optional

Validation errors return `400` with `{ success: false, errors: [...] }`.

---

## Routes

### `routes/users.js`

All user-lifecycle endpoints.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users/register` | No | Register new user. Hashes password, checks email uniqueness, writes to Firestore, returns JWT |
| POST | `/api/users/login` | No | Login with email+password. Returns JWT |
| GET | `/api/users/:id` | No | Get user profile by Firestore doc ID |
| PUT | `/api/users/:id` | Yes | Update user fields (bio, year, department, etc.) |
| GET | `/api/users/:id/posts` | No | Get all posts by this user |
| GET | `/api/users/campus/:campusId` | No | List all users on a campus |
| GET | `/api/users/profile/:id` | No | Get detailed profile including avatar (base64) |
| PUT | `/api/users/profile/:id` | Yes | Update detailed profile fields |
| POST | `/api/users/profile/:id/avatar` | Yes | Upload avatar image (multer); stored as base64 in Firestore |
| DELETE | `/api/users/profile/:id/avatar` | Yes | Remove avatar |
| PUT | `/api/users/change-password` | Yes | Verify current password, update hash |
| PUT | `/api/users/change-email` | Yes | Verify password, update email |
| PUT | `/api/users/change-student-id` | Yes | Update student ID |
| DELETE | `/api/users/delete-account` | Yes | Delete account and all user data |
| POST | `/api/users/:id/report` | Yes | Report a user (stored in `user_reports`) |
| POST | `/api/users/demo-login` | No | Creates a mock user stored only in localStorage; bypasses Firestore |
| GET | `/api/users/leaderboard/:campusId` | No | Legacy route (prefer `/api/leaderboard`) |
| GET | `/api/users/digest/:campusId` | No | Returns recent activity digest |

**Registration details:**
- Password minimum: no explicit minimum in Joi schema — the route checks for existence of the field; bcrypt is called with saltRounds=10
- `department` is stored both as typed and as an auto-slug (`departmentSlug` = first word, lower, underscores)
- The `campusId` links to a hard-coded or predefined campus identifier — there is no `campuses` collection management in this backend

### `routes/posts.js`

> **Important route ordering:** `/summary/events` and `/suggest-category` must be registered before `/:id` to prevent Express matching `summary` as an ID.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/posts/summary/events` | No | AI-generated summary of events-category posts from last 7 days |
| POST | `/api/posts/suggest-category` | Yes | AI category suggestion for content (min 15 chars) |
| GET | `/api/posts` | No | List posts. Query params: `category`, `location`, `campusId`, `sortBy`, `order`, `limit`, `offset`, `userId` |
| POST | `/api/posts` | Yes | Create post with optional image. Moderates content via Gemini. Awards +5 rep. Emits `post_created` |
| GET | `/api/posts/:id` | No | Get single post. Optional `userId` query param to check if user has liked |
| POST | `/api/posts/:id/like` | Yes | Toggle like/unlike. Uses Firestore transaction. Awards +1 rep to author. Emits `post_liked` |
| PUT | `/api/posts/:id` | Yes | Edit post (author only for non-anonymous). Re-moderates content |
| DELETE | `/api/posts/:id` | Yes | Delete post (author check uses stored `userId`, not `displayUserId`). Cascades to likes + comments in transaction |
| GET | `/api/posts/:id/comments` | No | Get comments for post. Sorted in-memory (no Firestore index) |
| POST | `/api/posts/:id/comments` | Yes | Add comment. Moderates content. Awards +1 rep to post author. Emits `comment_added` |
| DELETE | `/api/posts/:postId/comments/:commentId` | Yes | Delete comment. Allowed if: comment author OR post owner |
| POST | `/api/posts/:id/report` | Yes | Report post. Prevents duplicate reports per user. Stores in `post_reports` |

**Image handling:**
- Images uploaded via `multipart/form-data` (field name: `image`)
- Multer stores in memory (not disk)
- `storageService.validateImage()` checks size ≤ 800KB and verifies magic bytes
- `storageService.convertToBase64()` returns a data URL stored in `postData.imageData`
- The `hasImage: true` flag is set; `imageMetadata` stores mime type, original name, size, upload timestamp

**Post data shape:**
```
{
  title, content, category, location, campusId,
  isAnonymous,                  // boolean
  userId,                       // always stored (for deletion rights)
  displayUserId,                // null if anonymous (shown to clients)
  userName,                     // 'Anonymous' if isAnonymous
  tags,                         // string[]
  upvotes, downvotes,           // both exist; likes uses a separate 'likes' field
  commentCount,
  createdAt, updatedAt, isActive,
  imageData, imageMetadata, hasImage,   // optional
  moderation: { isReviewed, concerns, severity }
}
```

**Note:** There are two like-related fields in Firestore: `upvotes`/`downvotes` (initialised but never updated by the like route) and `likes` (updated by `POST /:id/like`). The `likes` field is the one in active use.

### `routes/polls.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/polls` | No | List polls. Query params: `campusId`, `location`, `isActive`, `sortBy`, `order`, `limit`, `userId`. Voter IDs stripped from response |
| POST | `/api/polls` | Yes | Create poll. `expiresAt` = now + `expiresIn` hours. Awards +5 rep. Emits `poll_created` |
| GET | `/api/polls/:id` | No | Get single poll with percentages. Voter IDs stripped |
| POST | `/api/polls/:id/vote` | Yes | Vote. Uses Firestore transaction. Validates: poll active, not expired, user hasn't voted, multi-vote only if `allowMultiple`. Emits `poll_updated` |
| PUT | `/api/polls/:id/close` | Yes | Close poll (author only). Sets `isActive: false`. Emits `poll_closed` |
| DELETE | `/api/polls/:id` | Yes | Delete poll (author only). Emits `poll_deleted` |
| POST | `/api/polls/cleanup` | Yes | Manual trigger for cleanup service |
| GET | `/api/polls/cleanup/status` | No | Returns cleanup service status |

**Poll options format in Firestore:**
```
options: [{ text: string, votes: number, voters: string[] }]
```
The `voters` array is never sent to clients — it is stripped in `GET /` and `GET /:id`.

**Vote body:** `{ optionIndexes: number[], userId: string }` — `optionIndexes` is always an array (even for single-choice polls).

### `routes/events.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/events` | No | List events. Query params: `campusId`, `limit`, `offset`, `sortBy`, `order`, `location`, `upcoming`, `userId`. Each event includes `creator` object and `userHasLiked`. Sorted client-side by date |
| POST | `/api/events` | Yes | Create event with optional poster image. No Gemini moderation (unlike posts). Awards rep based on `userRole`. Emits `event_created` |
| GET | `/api/events/:eventId` | No | Get single event with creator info |
| PUT | `/api/events/:eventId` | Yes | Edit event (owner only). **Note:** update uses `admin.storage().bucket()` for poster upload — inconsistent with create which uses base64. If Firebase Storage is not configured, this fails |
| DELETE | `/api/events/:eventId` | Yes | Delete event (owner only). Cascades to likes + comments in transaction |
| POST | `/api/events/:eventId/report` | Yes | Report event. Stores in `event_reports`. One report per user per event |
| POST | `/api/events/:id/like` | Yes | Toggle like/unlike. Transaction. Awards +1 rep to author |
| GET | `/api/events/:id/comments` | No | Get event comments. Sorted in-memory |
| POST | `/api/events/:id/comments` | Yes | Add event comment. Awards +1 rep to event author |
| DELETE | `/api/events/:eventId/comments/:commentId` | Yes | Delete event comment. Owner or admin (role check) |

**Event data shape:**
```
{
  title, description, date, startTime, endTime, location,
  eventType, targetAudience, userRole, hostingDepartment, stream,
  campusId, userId,
  posterData, posterMetadata, hasPoster,   // base64 image (create path)
  poster,                                  // GCS URL (update path, if Storage configured)
  likes, comments,                         // counters
  createdAt, updatedAt
}
```

### `routes/messages.js`

All endpoints require `requireAuth`. Conversations are 1-on-1 only (no group chats).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/messages/conversations` | List all conversations for current user. Includes `otherUser` profile and `unreadCount`. Sorted by `updatedAt` in JS |
| POST | `/api/messages/conversations` | Start or retrieve conversation. Verifies both users exist and are on the same campus. Conversation ID = sorted UIDs joined by `_` |
| GET | `/api/messages/conversations/:convId` | Get single conversation metadata |
| GET | `/api/messages/:convId/messages` | Paginated message history. Cursor-based: `?before=<messageId>&limit=30`. Max 50 per page. Filters soft-deleted messages |
| POST | `/api/messages/:convId/messages` | Send message (text or image). Updates `unreadCounts` on conversation. Emits `dm_new_message` to `dm_<convId>` room |
| DELETE | `/api/messages/:convId/messages/:msgId` | Soft-delete. `deleteForBoth: true` allowed only within 60 seconds of send. Otherwise self-only deletion |
| PUT | `/api/messages/:convId/read` | Mark all messages read. Resets `unreadCounts[uid]` to 0. Batch-updates `readBy` on all messages. Emits `dm_read_receipt` |
| GET | `/api/messages/users/search` | Search campus users by username. Min 2 chars. Returns max 10 results. Excludes self |

**Message data shape:**
```
{
  senderId, text, imageUrl,
  type: 'text' | 'image',
  readBy: string[],          // array of uids who have read
  deletedFor: string[],      // soft-delete: array of uids for whom it's hidden
  createdAt
}
```

**Conversation data shape:**
```
{
  participants: [uid1, uid2],
  campusId,
  lastMessage: { text, senderId, timestamp, type },
  unreadCounts: { [uid]: number },
  createdAt, updatedAt
}
```
Messages are stored in a sub-collection: `conversations/{convId}/messages/{msgId}`.

### `routes/search.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/search` | No | Search posts, polls, events. Query params: `q` (min 2 chars), `campusId` (required), `types` (comma-separated, default all), `limit` (max 50 per type) |

All three collection queries run in parallel (`Promise.all`). Matching is JavaScript `includes()` on a concatenated haystack string. Results are capped at `limit` per type after filtering.

### `routes/leaderboard.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/leaderboard` | No | Two boards: `topReputation` and `mostActive` (by `postCount`). Optional `campusId` query param. Demo users excluded. Top 10 each |

### `routes/stats.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/stats` | No | Count of posts, active polls, events for a `campusId`. Runs 3 Firestore count queries concurrently |
| GET | `/api/stats/cleanup` | Yes | Manually trigger the cleanup service |

### `routes/forgot.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/forgot-password` | No | Verifies user exists in Firebase Auth, generates a Firebase password reset link, sends branded email via Nodemailer |

---

## Services

### `services/websocket.js`

Configures the Socket.io server:
- CORS: same `FRONTEND_URL` as Express CORS
- Transports: `['websocket', 'polling']`
- **Auth middleware** on handshake: extracts `Bearer <token>` from `socket.handshake.auth.token`, calls `auth.verifyToken()` — if invalid, `next(new Error('Authentication error'))`
- Registers room-join handlers: `join_campus`, `join_location`, `join_post`, `leave_post`, `join_dm_room`, `leave_dm_room`, `join_dm_rooms`
- Registers typing indicators: `typing_start` / `typing_stop` → broadcasts `user_typing` / `user_stopped_typing` to room
- DM typing: `dm_typing_start` / `dm_typing_stop` → broadcasts to `dm_<convId>` room
- Disconnect handler: logs disconnect reason

### `services/geminiService.js`

Uses `@google/generative-ai` with `GEMINI_API_KEY`. Model: `gemini-1.5-flash`.

Three exported async functions:

**`moderateContent(content)`**
- Sends a structured prompt asking Gemini to return JSON: `{ isAppropriate, severity, concerns }`
- On JSON parse failure: returns `{ isAppropriate: false, severity: 'medium', concerns: ['Content review required'] }`

**`suggestCategory(content)`**
- Returns one of 10 category strings
- On error: returns `'general'` as fallback

**`generateEventSummary(events)`**
- Takes an array of event post objects
- Returns a plain-text or markdown summary string
- On error: returns a static fallback message

### `services/cleanupService.js`

Exports a `cleanupService` singleton with:
- `start()` — begins the `setInterval` loop
- `stop()` — clears the interval
- `runOnce()` — single cleanup pass; returns `{ deletedCount, totalChecked }`
- `getStatus()` — returns `{ isRunning, hasInterval }`

Called by `server.js` on startup: `cleanupService.start()`.

### `services/emailService.js`

Exports `sendPasswordResetEmail(email, resetLink, displayName)`.

Key implementation notes (relevant for debugging):
- Creates a **new Nodemailer transporter per call** (not cached) — workaround for Render.com where long-lived TCP connections to Gmail are dropped
- Uses `secure: false` + `requireTLS: true` (STARTTLS) because Render's free tier blocks port 465 (SMTP over SSL)
- Renders an HTML email template with the CampusConnect branding and the Firebase-generated reset link

### `services/storageService.js`

Exports `imageService` (also exported as `storageService` depending on the import path used).

- `validateImage(buffer, mimetype)` — checks file size ≤ 800KB; verifies magic bytes match declared MIME type (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, GIF: `47 49 46 38`, WebP: `52 49 46 46`)
- `convertToBase64(buffer, mimetype, originalName)` — returns `{ imageData: 'data:<mime>;base64,...', mimeType, originalName, size, uploadedAt }`
- `uploadImage(file, path)` — **also exists** and is used by `routes/messages.js` for DM image attachments; this path actually calls `admin.storage()` (Cloud Storage), which requires a configured Firebase Storage bucket
