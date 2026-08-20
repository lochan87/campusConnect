# 08 — Security

This document describes every security layer that exists in the code, along with gaps that a new contributor should be aware of.

---

## HTTP Headers — Helmet

`server.js` applies `helmet()` middleware to every request. Helmet sets the following headers by default:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 0` (modern browsers handle XSS natively)
- `Strict-Transport-Security` (in production)
- `Referrer-Policy`

No custom Helmet configuration is applied — it runs with defaults.

---

## Rate Limiting — `express-rate-limit`

Applied globally in `server.js`:

```js
// Default (from .env):
RATE_LIMIT_WINDOW_MS=60000    // 60 seconds
RATE_LIMIT_MAX_REQUESTS=10000 // 10,000 requests per IP per minute (very permissive in dev)
```

The production `.env.example` shows:
```
RATE_LIMIT_WINDOW_MS=900000   // 15 minutes
RATE_LIMIT_MAX_REQUESTS=100   // 100 requests per 15 min per IP
```

When the limit is exceeded: responds with `429 Too Many Requests`. The `api.js` response interceptor suppresses the toast for rate-limit messages.

---

## Authentication — JWT + bcrypt + HMAC

### Password storage

Passwords are never stored in plaintext. Registration uses:
```js
bcrypt.hash(password, 10)  // saltRounds = 10
```
Login uses `bcrypt.compare(plaintext, hash)`.

### Token structure

JWTs are signed with `JWT_SECRET` (env var) using the default HS256 algorithm. Tokens expire in 7 days.

**Payload:**
```json
{
  "uid": "<firestore-doc-id>",
  "email": "<user-email>",
  "hmac": "<sha256-hmac-of-uid>",
  "iat": ...,
  "exp": ...
}
```

The `hmac` field is a secondary binding: `HMAC-SHA256(uid, JWT_SECRET)`. This means even if someone with access to `JWT_SECRET` crafts a token for a different UID, the HMAC check would catch a mismatched `uid`/`hmac` pair. Note: this only adds value if `JWT_SECRET` itself is not compromised — an attacker with the secret can compute both.

### Socket.io authentication

Every Socket.io connection handshake passes the JWT in `socket.handshake.auth.token`. The `websocket.js` middleware calls the same `auth.verifyToken()` function as `requireAuth`. Unauthenticated sockets are rejected:
```js
next(new Error('Authentication error'))
```
The client receives an error event and the connection is not established.

---

## CORS

```js
cors({
  origin: process.env.FRONTEND_URL,   // single exact-match origin
  credentials: true                   // allow cookies (not used, but enables future use)
})
```

Only one origin is allowed. In production this is the Vercel URL. This prevents cross-origin requests from unknown domains. There is no wildcard `*` origin in the production config.

---

## Input Validation — Joi

Two Joi schemas are applied as Express middleware:

**`validatePost`** (applied to `POST /api/posts`):
- `content`: required, string, 1–5000 chars
- `category`: required, must be one of 10 enum values
- `campusId`: required

**`validatePoll`** (applied to `POST /api/polls`):
- `question`: required, string, 5–500 chars
- `options`: required array, 2–10 items
- `campusId`: required
- `expiresIn`: number, 1–168

On validation failure: `400 { success: false, errors: [{ field, message }] }`.

Not all routes have Joi validation — notably `PUT /api/posts/:id` and `POST /api/events` do manual field checks.

---

## Content Moderation — Gemini AI

Applied to all post and comment content creation and editing:

| Endpoint | Gemini check |
|----------|-------------|
| `POST /api/posts` | `moderateContent(content)` |
| `PUT /api/posts/:id` | `moderateContent(content)` |
| `POST /api/posts/:id/comments` | `moderateContent(content)` |

Events (`POST /api/events`) are **not moderated** by Gemini.

**Severity levels:**
- `'low'` — content approved, `moderation.isReviewed = true`
- `'medium'` — content stored but `moderation.isReviewed = false` (flagged for manual review)
- `'high'` — request rejected with `400`

**Fail-closed:** If the Gemini API returns an unparseable response or throws, the error is caught and returns `severity: 'medium'` — content is stored but flagged. It does not default to `'low'` (which would silently approve bad content).

---

## Authorization — Route-Level Ownership Checks

There is no RBAC framework. Ownership is verified manually in each route:

| Route | Check |
|-------|-------|
| `PUT /api/posts/:id` | `postData.userId !== userId` → 403 (if not anonymous) |
| `DELETE /api/posts/:id` | `postData.userId !== userId` → 403 |
| `DELETE /api/posts/:id/comments/:id` | Must be comment author OR post owner |
| `PUT /api/polls/:id/close` | `pollData.userId !== userId` → 403 |
| `DELETE /api/polls/:id` | `pollData.userId !== userId` → 403 |
| `PUT /api/events/:id` | `existingEvent.userId !== userId` → 403 |
| `DELETE /api/events/:id` | `existingEvent.userId !== userId` → 403 |
| `DELETE /api/events/:id/comments/:id` | Must be comment author OR admin role |
| `GET /api/messages/:convId/*` | Must be a participant in the conversation |
| `DELETE /api/messages/:convId/messages/:id` | Must be the message sender |

The `userId` used for these checks is typically passed in the request body (`req.body.userId`) or read from `req.user.uid` (from the JWT). Routes protected by `requireAuth` use `req.user.uid` — routes without it rely on the client-supplied `userId` in the body, which is validated by the server-side ownership check (not simply trusted).

---

## Anonymous Post Protection

For anonymous posts, the actual `userId` is stored in Firestore under `userId` (not exposed to clients). The `displayUserId` field is set to `null`. When deletion or editing is requested, the server checks `postData.userId !== requestedUserId` — so only the true author can delete their anonymous post.

---

## Direct Message Privacy

- The conversation ID is deterministic: sorted UIDs joined by `_`. This means you cannot guess a conversation ID for two users you don't know.
- All DM routes check that the requesting user is in `conv.participants`.
- Soft-deleted messages (`deletedFor`) are filtered out before sending to clients.
- Voter arrays in polls are stripped before sending to clients.

---

## Known Security Gaps

| Gap | Details | Recommendation |
|-----|---------|---------------|
| No server-side `userId` validation | Some routes accept `userId` from `req.body` (not always from JWT). The ownership check prevents impersonation, but the JWT `uid` should always be the authoritative identity. | Always use `req.user.uid` from the JWT, never trust `req.body.userId` |
| No refresh token mechanism | JWTs expire in 7 days. When expired, the user is logged out and the 401 interceptor clears localStorage. There is no silent refresh. | Implement refresh tokens if longer sessions are needed |
| Firestore Admin SDK bypasses security rules | All writes go through the Admin SDK which ignores Firestore Security Rules. Backend authorization is the only enforcement layer. | Ensure all write paths go through the Express layer |
| Images stored as base64 in Firestore | No virus/malware scanning on uploaded images. Magic-byte check prevents MIME spoofing but not malicious image payloads. | Move to Cloud Storage with client-side URL validation |
| Rate limits are per-IP | Behind a NAT, all students from the same campus may share an IP. The dev default (10,000/60s) is very permissive. | Tune per-IP limits and add user-level rate limiting for sensitive endpoints |
| No CSRF protection | The app uses `localStorage` for tokens (not cookies), so the standard CSRF attack vector doesn't apply. If cookies are ever used, add CSRF protection. | Keep tokens in localStorage; if moving to cookies, add `sameSite: strict` and CSRF tokens |
| Password reset gap | `admin.auth().getUserByEmail()` in `forgot.js` requires the user to exist in Firebase Auth, but registration only writes to Firestore. Only users who have separately registered in Firebase Auth can reset their password. | Either integrate Firebase Auth sign-up during registration, or build a custom token-based reset flow using Firestore |
