const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const pollRoutes = require('./routes/polls');
const eventRoutes = require('./routes/events');
const leaderboardRoutes = require('./routes/leaderboard');
const { initializeFirebase } = require('./config/firebase');
const { setupWebSocket } = require('./services/websocket');
const { cleanupService } = require('./services/cleanupService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize Firebase
initializeFirebase();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
app.set('trust proxy', 1);
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || (process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 60 * 1000), // 15 minutes in production, 1 hour in development
  max: process.env.RATE_LIMIT_MAX_REQUESTS || (process.env.NODE_ENV === 'production' ? 100 : 1000), // 100 in production, 1000 in development
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.log(`🚫 Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}, Method: ${req.method}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000) / 1000)
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
app.use('/api/leaderboard', leaderboardRoutes);

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
  
  // Start cleanup service for expired polls
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
