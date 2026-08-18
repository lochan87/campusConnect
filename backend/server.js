const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const pollRoutes = require('./routes/polls');
const eventRoutes = require('./routes/events');
const statsRoutes = require('./routes/stats');
const leaderboardRoutes = require('./routes/leaderboard');
const searchRoutes = require('./routes/search');
const messageRoutes = require('./routes/messages');
const authRoutes = require('./routes/forgot');
const { initializeFirebase } = require('./config/firebase');
const { setupWebSocket } = require('./services/websocket');
const { cleanupService } = require('./services/cleanupService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Attach io to app so route handlers can emit real-time events via req.app.get('io')
app.set('io', io);

// Initialize Firebase
initializeFirebase();

// Middleware
// Gzip compress all responses — reduces JSON size ~70%
app.use(compression({
  level: 6,          // Balanced compression (1=fast, 9=max)
  threshold: 1024,   // Only compress responses > 1 KB
  filter: (req, res) => {
    // Don't compress server-sent events
    if (req.headers['accept'] === 'text/event-stream') return false;
    return compression.filter(req, res);
  },
}));
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
app.set('trust proxy', 1);
const isProd = process.env.NODE_ENV === 'production';
const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) ||
  (isProd ? 15 * 60 * 1000 : 60 * 60 * 1000);
// Hard-cap: env var cannot exceed 500 to prevent accidental bypass
const rateLimitMax = Math.min(
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (isProd ? 100 : 500),
  isProd ? 200 : 500
);
const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(rateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(rateLimitWindowMs / 1000)
    });
  }
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Setup WebSocket
setupWebSocket(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 CampusConnect server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start cleanup service for expired polls and events
  // Run every 6 hours in production, every hour in development
  const cleanupInterval = process.env.NODE_ENV === 'production' ? 360 : 60;
  cleanupService.start(cleanupInterval);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  cleanupService.stop();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  cleanupService.stop();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
