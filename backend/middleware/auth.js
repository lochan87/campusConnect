const crypto = require('crypto');

/**
 * Generate a signed session token for a given userId.
 * Format: "<uid>.<hmac-hex>"
 * Uses JWT_SECRET from environment (falls back to a hard-coded dev default).
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'campusconnect-dev-secret';
  const hmac = crypto.createHmac('sha256', secret).update(userId).digest('hex');
  return `${userId}.${hmac}`;
};

/**
 * Verify a signed session token.
 * Returns the userId if valid, null otherwise.
 */
const verifyToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET || 'campusconnect-dev-secret';

    // Legacy support: demo-token-{uid} (for demo users only, no real secret)
    if (token.startsWith('demo-token-')) {
      const userId = token.replace('demo-token-', '');
      if (userId && (userId.startsWith('demo-') || userId.includes('demo'))) {
        return userId; // Only accept demo tokens for demo UIDs
      }
      return null; // Reject demo-token for non-demo UIDs
    }

    // Signed token: "<uid>.<hmac>"
    const lastDotIndex = token.lastIndexOf('.');
    if (lastDotIndex === -1) return null;

    const userId = token.substring(0, lastDotIndex);
    const providedHmac = token.substring(lastDotIndex + 1);

    if (!userId || !providedHmac) return null;

    // Constant-time comparison to prevent timing attacks
    const expectedHmac = crypto.createHmac('sha256', secret).update(userId).digest('hex');
    const valid = crypto.timingSafeEqual(
      Buffer.from(providedHmac, 'hex'),
      Buffer.from(expectedHmac, 'hex')
    );

    return valid ? userId : null;
  } catch {
    return null;
  }
};

/**
 * Express middleware — validates Authorization: Bearer <token> header.
 * Sets req.user = { uid } on success.
 */
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const headerUserId = req.headers['x-user-id'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const userId = verifyToken(token);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // If X-User-ID header is present, make sure it matches the token
    if (headerUserId && headerUserId !== userId) {
      return res.status(401).json({ error: 'User ID mismatch' });
    }

    req.user = { uid: userId, token };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = { requireAuth, generateToken, verifyToken };
