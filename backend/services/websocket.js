const { verifyToken } = require('../middleware/auth');

const setupWebSocket = (io) => {
  console.log('🔌 Setting up WebSocket connections');

  // ── Socket authentication middleware ──────────────────────────────────────
  // Validates token on every new connection before any event handlers fire.
  io.use((socket, next) => {
    try {
      // Client must send token in handshake auth: { token: 'Bearer <token>' }
      // or as a query param: ?token=<token>
      const raw =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization ||
        socket.handshake.query?.token;

      if (!raw) {
        return next(new Error('Authentication required'));
      }

      const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;
      const userId = verifyToken(token);

      if (!userId) {
        return next(new Error('Invalid or expired token'));
      }

      // Attach userId to socket for use in event handlers
      socket.userId = userId;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    // Join campus room
    socket.on('join_campus', (campusId) => {
      socket.join(`campus_${campusId}`);
    });

    // Join location-specific room
    socket.on('join_location', (locationId) => {
      socket.join(`location_${locationId}`);
    });

    // ── DM room management ──────────────────────────────
    // Join a private conversation room (client sends after opening a chat)
    socket.on('join_dm_room', (conversationId) => {
      if (conversationId) {
        socket.join(`dm_${conversationId}`);
        console.log(`💬 Socket ${socket.id} joined DM room: dm_${conversationId}`);
      }
    });

    // Leave a DM room (client sends when navigating away)
    socket.on('leave_dm_room', (conversationId) => {
      if (conversationId) {
        socket.leave(`dm_${conversationId}`);
      }
    });

    // Join multiple DM rooms at once (used on app load to receive background DM alerts)
    socket.on('join_dm_rooms', (conversationIds) => {
      if (Array.isArray(conversationIds)) {
        conversationIds.forEach((convId) => {
          socket.join(`dm_${convId}`);
        });
        console.log(`💬 Socket ${socket.id} joined ${conversationIds.length} DM rooms`);
      }
    });

    // ── DM typing indicators ────────────────────────────
    socket.on('dm_typing_start', (data) => {
      // data: { conversationId, userId, username }
      if (data?.conversationId) {
        socket.to(`dm_${data.conversationId}`).emit('dm_typing', {
          conversationId: data.conversationId,
          userId: data.userId,
          username: data.username,
          isTyping: true,
        });
      }
    });

    socket.on('dm_typing_stop', (data) => {
      // data: { conversationId, userId }
      if (data?.conversationId) {
        socket.to(`dm_${data.conversationId}`).emit('dm_typing', {
          conversationId: data.conversationId,
          userId: data.userId,
          isTyping: false,
        });
      }
    });

    // ── Legacy post/poll/event handlers ────────────────
    // Handle new post creation
    socket.on('new_post', (postData) => {
      // Broadcast to campus room
      socket.to(`campus_${postData.campusId}`).emit('post_created', postData);
      
      // If post has location, broadcast to location room
      if (postData.location) {
        socket.to(`location_${postData.location}`).emit('post_created', postData);
      }
    });

    // Handle poll votes
    socket.on('poll_vote', (voteData) => {
      socket.to(`campus_${voteData.campusId}`).emit('poll_updated', voteData);
    });

    // Handle meme reactions
    socket.on('meme_reaction', (reactionData) => {
      socket.to(`campus_${reactionData.campusId}`).emit('meme_updated', reactionData);
    });

    // Handle real-time typing for comments
    socket.on('typing_start', (data) => {
      socket.to(`post_${data.postId}`).emit('user_typing', {
        userId: data.userId,
        username: data.username
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`post_${data.postId}`).emit('user_stopped_typing', {
        userId: data.userId
      });
    });

    // Handle live location updates for events
    socket.on('event_location_update', (eventData) => {
      socket.to(`campus_${eventData.campusId}`).emit('event_updated', eventData);
    });

    // Leave rooms on disconnect
    socket.on('disconnect', () => {
      // Socket disconnected
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`❌ Socket error:`, error);
    });
  });

  return io;
};

// Helper functions to emit events from API routes
const emitToCampus = (io, campusId, event, data) => {
  io.to(`campus_${campusId}`).emit(event, data);
};

const emitToLocation = (io, locationId, event, data) => {
  io.to(`location_${locationId}`).emit(event, data);
};

const emitToAll = (io, event, data) => {
  io.emit(event, data);
};

// ── DM-specific helper ──────────────────────────────────
// Used by the messages route to emit to a DM conversation room
const emitToDM = (io, conversationId, event, data) => {
  io.to(`dm_${conversationId}`).emit(event, data);
};

module.exports = {
  setupWebSocket,
  emitToCampus,
  emitToLocation,
  emitToAll,
  emitToDM,
};
