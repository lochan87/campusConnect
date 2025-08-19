import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  connect() {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventHandlers();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
    }
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to CampusConnect server');
      this.isConnected = true;
      this.emit('connectionStatusChanged', true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      this.isConnected = false;
      this.emit('connectionStatusChanged', false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        setTimeout(() => this.connect(), 2000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      this.isConnected = false;
      this.emit('connectionStatusChanged', false);
    });

    // Campus-wide events
    this.socket.on('post_created', (post) => {
      console.log('📝 New post created:', post);
      this.emit('newPost', post);
      
      // Show notification for relevant posts
      if (post.category === 'announcements') {
        toast.success(`📢 New announcement: ${post.title || post.content.substring(0, 50)}...`);
      }
    });

    this.socket.on('post_updated', (postData) => {
      console.log('📝 Post updated:', postData);
      this.emit('postUpdated', postData);
    });

    this.socket.on('post_deleted', (data) => {
      console.log('🗑️ Post deleted:', data);
      this.emit('postDeleted', data);
    });

    this.socket.on('post_voted', (voteData) => {
      console.log('👍 Post voted:', voteData);
      this.emit('postVoted', voteData);
    });

    // Poll events
    this.socket.on('poll_created', (poll) => {
      console.log('📊 New poll created:', poll);
      this.emit('newPoll', poll);
      toast.success(`📊 New poll: ${poll.question.substring(0, 50)}...`);
    });

    this.socket.on('poll_updated', (pollData) => {
      console.log('📊 Poll updated:', pollData);
      this.emit('pollUpdated', pollData);
    });

    this.socket.on('poll_closed', (data) => {
      console.log('📊 Poll closed:', data);
      this.emit('pollClosed', data);
    });

    this.socket.on('poll_deleted', (data) => {
      console.log('🗑️ Poll deleted:', data);
      this.emit('pollDeleted', data);
    });

    // Event updates
    this.socket.on('event_updated', (eventData) => {
      console.log('🎉 Event updated:', eventData);
      this.emit('eventUpdated', eventData);
    });

    // User updates (reputation, postCount, etc.)
    this.socket.on('user_updated', (userData) => {
      console.log('👤 User updated:', userData);
      this.emit('userUpdated', userData);
    });

    // Meme reactions
    this.socket.on('meme_updated', (memeData) => {
      console.log('😂 Meme updated:', memeData);
      this.emit('memeUpdated', memeData);
    });

    // Typing indicators
    this.socket.on('user_typing', (data) => {
      this.emit('userTyping', data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      this.emit('userStoppedTyping', data);
    });

    // General notifications
    this.socket.on('notification', (notification) => {
      console.log('🔔 Notification:', notification);
      this.emit('notification', notification);
      
      switch (notification.type) {
        case 'info':
          toast.success(notification.message);
          break;
        case 'warning':
          toast.error(notification.message);
          break;
        case 'success':
          toast.success(notification.message);
          break;
        default:
          toast(notification.message);
      }
    });
  }

  // Room management
  joinCampus(campusId) {
    if (this.socket?.connected) {
      this.socket.emit('join_campus', campusId);
      console.log(`🏫 Joined campus: ${campusId}`);
    }
  }

  joinLocation(locationId) {
    if (this.socket?.connected) {
      this.socket.emit('join_location', locationId);
      console.log(`📍 Joined location: ${locationId}`);
    }
  }

  joinPost(postId) {
    if (this.socket?.connected) {
      this.socket.emit('join_post', postId);
      console.log(`📝 Joined post discussion: ${postId}`);
    }
  }

  leavePost(postId) {
    if (this.socket?.connected) {
      this.socket.emit('leave_post', postId);
      console.log(`📝 Left post discussion: ${postId}`);
    }
  }

  // Event emission
  emitNewPost(postData) {
    if (this.socket?.connected) {
      this.socket.emit('new_post', postData);
    }
  }

  emitPollVote(voteData) {
    if (this.socket?.connected) {
      this.socket.emit('poll_vote', voteData);
    }
  }

  emitMemeReaction(reactionData) {
    if (this.socket?.connected) {
      this.socket.emit('meme_reaction', reactionData);
    }
  }

  emitTypingStart(data) {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', data);
    }
  }

  emitTypingStop(data) {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', data);
    }
  }

  emitEventLocationUpdate(eventData) {
    if (this.socket?.connected) {
      this.socket.emit('event_location_update', eventData);
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Connection status
  isSocketConnected() {
    return this.socket?.connected || false;
  }

  // Reconnect manually
  reconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    setTimeout(() => this.connect(), 1000);
  }
}

// Create singleton instance
export const socketService = new SocketService();

export default socketService;
