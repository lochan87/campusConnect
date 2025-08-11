import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  connectionStatus: 'disconnected' // 'connected', 'connecting', 'disconnected', 'error'
};

// Action types
const NOTIFICATION_ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  UPDATE_UNREAD_COUNT: 'UPDATE_UNREAD_COUNT'
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      const newNotification = {
        id: Date.now() + Math.random(),
        timestamp: new Date(),
        isRead: false,
        ...action.payload
      };
      
      return {
        ...state,
        notifications: [newNotification, ...state.notifications.slice(0, 49)], // Keep max 50
        unreadCount: state.unreadCount + 1
      };

    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };

    case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true
        })),
        unreadCount: 0
      };

    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      const notificationToRemove = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: notificationToRemove && !notificationToRemove.isRead 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount
      };

    case NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };

    case NOTIFICATION_ACTIONS.SET_CONNECTION_STATUS:
      return {
        ...state,
        isConnected: action.payload === 'connected',
        connectionStatus: action.payload
      };

    case NOTIFICATION_ACTIONS.UPDATE_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload
      };

    default:
      return state;
  }
};

// Create context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user } = useAuth();

  // Set up socket listeners
  useEffect(() => {
    if (!user) return;

    // Connection status handlers
    const handleConnectionStatusChanged = (connected) => {
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_CONNECTION_STATUS,
        payload: connected ? 'connected' : 'disconnected'
      });
    };

    // Post-related notifications
    const handleNewPost = (post) => {
      if (post.userId !== user.uid) { // Don't notify about own posts
        let message = '';
        let type = 'info';
        
        switch (post.category) {
          case 'events':
            message = `🎉 New event: ${post.title || post.content.substring(0, 50)}...`;
            type = 'event';
            break;
          case 'lost_found':
            message = `🔍 Lost & Found: ${post.content.substring(0, 50)}...`;
            type = 'lost_found';
            break;
          case 'food':
            message = `🍔 Food Alert: ${post.content.substring(0, 50)}...`;
            type = 'food';
            break;
          case 'announcements':
            message = `📢 Announcement: ${post.title || post.content.substring(0, 50)}...`;
            type = 'announcement';
            break;
          case 'memes':
            message = `😂 New meme posted`;
            type = 'meme';
            break;
          default:
            message = `📝 New post in ${post.location || 'campus'}`;
            type = 'post';
        }

        dispatch({
          type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
          payload: {
            type,
            message,
            data: { postId: post.id, category: post.category },
            priority: post.category === 'announcements' ? 'high' : 'normal'
          }
        });
      }
    };

    const handleNewPoll = (poll) => {
      if (poll.userId !== user.uid) {
        dispatch({
          type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
          payload: {
            type: 'poll',
            message: `📊 New poll: ${poll.question.substring(0, 50)}...`,
            data: { pollId: poll.id },
            priority: 'normal'
          }
        });
      }
    };

    const handlePostVoted = (voteData) => {
      // Notify if it's user's post being voted on
      const userPost = state.posts?.find(post => 
        post.id === voteData.postId && post.userId === user.uid
      );
      
      if (userPost) {
        dispatch({
          type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
          payload: {
            type: 'vote',
            message: `👍 Your post received a vote!`,
            data: { postId: voteData.postId },
            priority: 'low'
          }
        });
      }
    };

    // Event notifications
    const handleEventUpdated = (eventData) => {
      dispatch({
        type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: 'event_update',
          message: `🎉 Event updated: ${eventData.title || 'Check details'}`,
          data: { eventId: eventData.id },
          priority: 'normal'
        }
      });
    };

    // System notifications
    const handleNotification = (notification) => {
      dispatch({
        type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
        payload: {
          type: notification.type || 'system',
          message: notification.message,
          data: notification.data || {},
          priority: notification.priority || 'normal'
        }
      });
    };

    // Register socket listeners
    socketService.on('connectionStatusChanged', handleConnectionStatusChanged);
    socketService.on('newPost', handleNewPost);
    socketService.on('newPoll', handleNewPoll);
    socketService.on('postVoted', handlePostVoted);
    socketService.on('eventUpdated', handleEventUpdated);
    socketService.on('notification', handleNotification);

    // Cleanup
    return () => {
      socketService.off('connectionStatusChanged', handleConnectionStatusChanged);
      socketService.off('newPost', handleNewPost);
      socketService.off('newPoll', handleNewPoll);
      socketService.off('postVoted', handlePostVoted);
      socketService.off('eventUpdated', handleEventUpdated);
      socketService.off('notification', handleNotification);
    };
  }, [user]);

  // Add notification manually
  const addNotification = (notification) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
      payload: notification
    });
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.MARK_AS_READ,
      payload: notificationId
    });
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    dispatch({ type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ });
  };

  // Remove notification
  const removeNotification = (notificationId) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION,
      payload: notificationId
    });
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    dispatch({ type: NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS });
  };

  // Get unread notifications
  const getUnreadNotifications = () => {
    return state.notifications.filter(notification => !notification.isRead);
  };

  // Get notifications by type
  const getNotificationsByType = (type) => {
    return state.notifications.filter(notification => notification.type === type);
  };

  // Check if user has permission to receive notification type
  const shouldReceiveNotification = (type) => {
    if (!user?.preferences?.notifications) return true;
    
    const preferences = user.preferences.notifications;
    
    switch (type) {
      case 'post':
      case 'announcement':
        return preferences.posts;
      case 'poll':
        return preferences.polls;
      case 'event':
      case 'event_update':
        return preferences.events;
      case 'meme':
        return preferences.memes;
      default:
        return true;
    }
  };

  const value = {
    // State
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isConnected: state.isConnected,
    connectionStatus: state.connectionStatus,

    // Actions
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getUnreadNotifications,
    getNotificationsByType,
    shouldReceiveNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};

export default NotificationContext;
