const setupWebSocket = (io) => {
  console.log('🔌 Setting up WebSocket connections');

  io.on('connection', (socket) => {
    // Join campus room
    socket.on('join_campus', (campusId) => {
      socket.join(`campus_${campusId}`);
    });

    // Join location-specific room
    socket.on('join_location', (locationId) => {
      socket.join(`location_${locationId}`);
    });

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

module.exports = {
  setupWebSocket,
  emitToCampus,
  emitToLocation,
  emitToAll
};
