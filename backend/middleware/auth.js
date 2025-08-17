const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const userId = req.headers['x-user-id'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // For demo purposes, accept tokens that start with "demo-token-"
    if (!token.startsWith('demo-token-')) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Extract user ID from token (demo implementation)
    const tokenUserId = token.replace('demo-token-', '');

    // Verify user ID matches
    if (!userId || userId !== tokenUserId) {
      return res.status(401).json({ error: 'User ID mismatch' });
    }

    // Add user info to request
    req.user = {
      uid: userId,
      token: token
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = { requireAuth };
