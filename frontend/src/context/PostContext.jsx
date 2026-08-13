import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  posts: [],
  polls: [],
  events: [],
  loading: false,
  pollsLoading: false,
  eventsLoading: false,
  error: null,
  hasMore: true,
  filters: {
    category: 'all',
    location: 'all',
    sortBy: 'createdAt',
    order: 'desc'
  },
  pagination: {
    limit: 20,
    offset: 0
  }
};

// Action types
const POST_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_POLLS_LOADING: 'SET_POLLS_LOADING',
  SET_EVENTS_LOADING: 'SET_EVENTS_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_POSTS: 'SET_POSTS',
  ADD_POSTS: 'ADD_POSTS',
  ADD_POST: 'ADD_POST',
  UPDATE_POST: 'UPDATE_POST',
  DELETE_POST: 'DELETE_POST',
  SET_POLLS: 'SET_POLLS',
  ADD_POLL: 'ADD_POLL',
  UPDATE_POLL: 'UPDATE_POLL',
  DELETE_POLL: 'DELETE_POLL',
  SET_EVENTS: 'SET_EVENTS',
  ADD_EVENT: 'ADD_EVENT',
  UPDATE_EVENT: 'UPDATE_EVENT',
  DELETE_EVENT: 'DELETE_EVENT',
  SET_FILTERS: 'SET_FILTERS',
  SET_HAS_MORE: 'SET_HAS_MORE',
  RESET_PAGINATION: 'RESET_PAGINATION'
};

// Reducer
const postReducer = (state, action) => {
  switch (action.type) {
    case POST_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case POST_ACTIONS.SET_POLLS_LOADING:
      return { ...state, pollsLoading: action.payload };

    case POST_ACTIONS.SET_EVENTS_LOADING:
      return { ...state, eventsLoading: action.payload };

    case POST_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case POST_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case POST_ACTIONS.SET_POSTS:
      return { 
        ...state, 
        posts: action.payload, 
        loading: false,
        pagination: { ...state.pagination, offset: action.payload.length }
      };

    case POST_ACTIONS.ADD_POSTS:
      return { 
        ...state, 
        posts: [...state.posts, ...action.payload],
        loading: false,
        pagination: { ...state.pagination, offset: state.posts.length + action.payload.length }
      };

    case POST_ACTIONS.ADD_POST:
      return { 
        ...state, 
        posts: [action.payload, ...state.posts] 
      };

    case POST_ACTIONS.UPDATE_POST:
      return {
        ...state,
        posts: state.posts.map(post =>
          post.id === action.payload.id 
            ? { ...post, ...action.payload } 
            : post
        )
      };

    case POST_ACTIONS.DELETE_POST:
      return {
        ...state,
        posts: state.posts.filter(post => post.id !== action.payload)
      };

    case POST_ACTIONS.SET_POLLS:
      return { ...state, polls: action.payload, pollsLoading: false };

    case POST_ACTIONS.ADD_POLL:
      return { 
        ...state, 
        polls: [action.payload, ...state.polls] 
      };

    case POST_ACTIONS.UPDATE_POLL:
      return {
        ...state,
        polls: state.polls.map(poll =>
          poll.id === action.payload.id 
            ? { ...poll, ...action.payload } 
            : poll
        )
      };

    case POST_ACTIONS.DELETE_POLL:
      return {
        ...state,
        polls: state.polls.filter(poll => poll.id !== action.payload)
      };

    case POST_ACTIONS.SET_EVENTS:
      return { ...state, events: action.payload, eventsLoading: false };

    case POST_ACTIONS.ADD_EVENT:
      return { 
        ...state, 
        events: [action.payload, ...state.events] 
      };

    case POST_ACTIONS.UPDATE_EVENT:
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id 
            ? { ...event, ...action.payload } 
            : event
        )
      };

    case POST_ACTIONS.DELETE_EVENT:
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload)
      };

    case POST_ACTIONS.SET_FILTERS:
      return { 
        ...state, 
        filters: { ...state.filters, ...action.payload } 
      };

    case POST_ACTIONS.SET_HAS_MORE:
      return { ...state, hasMore: action.payload };

    case POST_ACTIONS.RESET_PAGINATION:
      return { 
        ...state, 
        pagination: { ...state.pagination, offset: 0 },
        hasMore: true
      };

    default:
      return state;
  }
};

// Create context
const PostContext = createContext();

// Provider component
export const PostProvider = ({ children }) => {
  const [state, dispatch] = useReducer(postReducer, initialState);
  const { user } = useAuth();

  // Set up socket listeners
  useEffect(() => {
    if (!user) return;

    const handleNewPost = (post) => {
      dispatch({ type: POST_ACTIONS.ADD_POST, payload: post });
    };

    const handlePostUpdated = (postData) => {
      dispatch({ type: POST_ACTIONS.UPDATE_POST, payload: postData });
    };

    const handlePostDeleted = (data) => {
      dispatch({ type: POST_ACTIONS.DELETE_POST, payload: data.postId });
    };

    const handlePostLiked = (likeData) => {
      dispatch({ 
        type: POST_ACTIONS.UPDATE_POST, 
        payload: {
          id: likeData.postId,
          likes: likeData.likes,
          userHasLiked: likeData.userHasLiked
        }
      });
    };

    const handleNewPoll = (poll) => {
      dispatch({ type: POST_ACTIONS.ADD_POLL, payload: poll });
    };

    const handlePollUpdated = (pollData) => {
      dispatch({ type: POST_ACTIONS.UPDATE_POLL, payload: pollData });
    };

    const handlePollDeleted = (data) => {
      dispatch({ type: POST_ACTIONS.DELETE_POLL, payload: data.pollId });
    };

    const handleCommentAdded = (data) => {
      // Update the comment count for the post
      dispatch({
        type: POST_ACTIONS.UPDATE_POST,
        payload: {
          id: data.postId,
          commentCount: data.commentCount
        }
      });
    };

    const handleCommentDeleted = (data) => {
      // Update the comment count for the post
      dispatch({
        type: POST_ACTIONS.UPDATE_POST,
        payload: {
          id: data.postId,
          commentCount: data.commentCount
        }
      });
    };

    // Register socket listeners
    socketService.on('post_created', handleNewPost);
    socketService.on('post_updated', handlePostUpdated);
    socketService.on('post_deleted', handlePostDeleted);
    socketService.on('post_liked', handlePostLiked);
    socketService.on('poll_created', handleNewPoll);
    socketService.on('poll_updated', handlePollUpdated);
    socketService.on('poll_deleted', handlePollDeleted);
    socketService.on('comment_added', handleCommentAdded);
    socketService.on('comment_deleted', handleCommentDeleted);

    // Cleanup
    return () => {
      socketService.off('post_created', handleNewPost);
      socketService.off('post_updated', handlePostUpdated);
      socketService.off('post_deleted', handlePostDeleted);
      socketService.off('post_liked', handlePostLiked);
      socketService.off('poll_created', handleNewPoll);
      socketService.off('poll_updated', handlePollUpdated);
      socketService.off('poll_deleted', handlePollDeleted);
      socketService.off('comment_added', handleCommentAdded);
      socketService.off('comment_deleted', handleCommentDeleted);
    };
  }, [user]);

  // Fetch posts
  const fetchPosts = useCallback(async (loadMore = false) => {
    if (state.loading || !user?.campusId) return;
    
    try {
      // Reduced logging for better performance
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Fetching posts..., loadMore:', loadMore);
      }
      
      if (!loadMore) {
        dispatch({ type: POST_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: POST_ACTIONS.RESET_PAGINATION });
      }

      const params = {
        ...state.filters,
        campusId: user?.campusId,
        userId: user?.uid, // Add userId to get vote status
        limit: state.pagination.limit,
        offset: loadMore ? state.pagination.offset : 0
      };
      
      const response = await apiService.getPosts(params);
      
      if (response.data.success) {
        const posts = response.data.posts;
        
        if (loadMore) {
          dispatch({ type: POST_ACTIONS.ADD_POSTS, payload: posts });
        } else {
          dispatch({ type: POST_ACTIONS.SET_POSTS, payload: posts });
        }
        
        dispatch({ 
          type: POST_ACTIONS.SET_HAS_MORE, 
          payload: response.data.hasMore || posts.length === state.pagination.limit 
        });
      }
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      dispatch({ 
        type: POST_ACTIONS.SET_ERROR, 
        payload: error.response?.data?.error || 'Failed to fetch posts' 
      });
    }
  }, [state.filters, state.pagination.limit, user?.campusId, user?.uid]);

  // Fetch polls
  const fetchPolls = useCallback(async () => {
    if (state.pollsLoading || !user?.campusId) return;
    
    try {
      dispatch({ type: POST_ACTIONS.SET_POLLS_LOADING, payload: true });
      
      const params = {
        campusId: user?.campusId,
        isActive: true,
        limit: 10,
        userId: user?.uid // Add current user ID to check vote status
      };

      const response = await apiService.getPolls(params);
      
      if (response.data.success) {
        dispatch({ type: POST_ACTIONS.SET_POLLS, payload: response.data.polls });
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
      dispatch({ type: POST_ACTIONS.SET_POLLS_LOADING, payload: false });
    }
  }, [user?.campusId, user?.uid, state.pollsLoading]);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    if (state.eventsLoading || !user?.campusId) return;
    
    try {
      dispatch({ type: POST_ACTIONS.SET_EVENTS_LOADING, payload: true });
      
      const params = {
        campusId: user?.campusId,
        userId: user?.uid, // Add userId to get like status
        limit: 10,
        sortBy: 'date',
        order: 'asc' // Show upcoming events first
      };

      const response = await apiService.getEvents(params);
      
      if (response.data.success) {
        dispatch({ type: POST_ACTIONS.SET_EVENTS, payload: response.data.events });
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      dispatch({ type: POST_ACTIONS.SET_EVENTS_LOADING, payload: false });
    }
  }, [user?.campusId, state.eventsLoading]);

  // Create post
  const createPost = async (postData) => {
    try {
      const fullPostData = {
        ...postData,
        campusId: user.campusId,
        userId: postData.isAnonymous ? null : user.uid,
        userName: postData.isAnonymous ? 'Anonymous' : user.displayName
      };

      const response = await apiService.createPost(fullPostData);
      
      if (response.data.success) {
        // Post will be added via socket event
        toast.success('Post created successfully!');
        return { success: true, post: response.data.post };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create post';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Create poll
  const createPoll = async (pollData) => {
    try {
      const fullPollData = {
        ...pollData,
        campusId: user.campusId,
        userId: pollData.isAnonymous ? null : user.uid,
        userName: pollData.isAnonymous ? 'Anonymous' : user.displayName
      };

      const response = await apiService.createPoll(fullPollData);
      
      if (response.data.success) {
        // Poll will be added via socket event
        toast.success('Poll created successfully!');
        return { success: true, poll: response.data.poll };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create poll';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Like/unlike post
  const likePost = async (postId) => {
    try {
      const response = await apiService.likePost(postId, user.uid);
      
      if (response.data.success) {
        dispatch({
          type: POST_ACTIONS.UPDATE_POST,
          payload: {
            id: postId,
            likes: response.data.likes,
            userHasLiked: response.data.userHasLiked,
            likesCount: response.data.likes
          }
        });
        
        return { 
          success: true, 
          likes: response.data.likes, 
          userHasLiked: response.data.userHasLiked 
        };
      }
    } catch (error) {
      console.error('Error in likePost:', error);
      const errorMessage = error.response?.data?.error || 'Failed to like post';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Like/unlike event
  const likeEvent = async (eventId) => {
    try {
      const response = await apiService.likeEvent(eventId, user.uid);
      
      if (response.data.success) {
        dispatch({
          type: POST_ACTIONS.UPDATE_EVENT,
          payload: {
            id: eventId,
            likes: response.data.likes,
            userHasLiked: response.data.isLiked,
            likesCount: response.data.likes
          }
        });
        
        return { 
          success: true, 
          likes: response.data.likes, 
          userHasLiked: response.data.isLiked 
        };
      }
    } catch (error) {
      console.error('Error in likeEvent:', error);
      const errorMessage = error.response?.data?.error || 'Failed to like event';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Vote on poll
  const voteOnPoll = async (pollId, optionIndexes) => {
    try {
      const response = await apiService.votePoll(pollId, {
        optionIndexes,
        userId: user.uid
      });
      
      if (response.data.success) {
        // Poll will be updated via socket event
        toast.success('Vote recorded!');
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to vote';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Delete post
  const deletePost = async (postId) => {
    try {
      const response = await apiService.deletePost(postId, user.uid || user.id);
      
      if (response.data.success) {
        // Post will be removed via socket event
        // (toast shown by the calling page to avoid duplicates)
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete post';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Edit post
  const editPost = async (postId, postData) => {
    try {
      // If postData is FormData, add userId directly to it
      // Otherwise, create the object with userId
      let fullPostData;
      
      if (postData instanceof FormData) {
        // Add userId to the existing FormData
        postData.append('userId', user.uid || user.id);
        fullPostData = postData;
      } else {
        fullPostData = {
          ...postData,
          userId: user.uid || user.id
        };
      }

      const response = await apiService.editPost(postId, fullPostData);
      
      if (response.data.success) {
        // Post will be updated via socket event
        toast.success('Post updated successfully!');
        return { success: true, post: response.data.post };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update post';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Delete event
  const deleteEvent = async (eventId) => {
    try {
      const response = await apiService.deleteEvent(eventId, user.uid || user.id);
      
      if (response.data.success) {
        // Event will be removed via socket event or refresh
        // (toast shown by the calling page to avoid duplicates)
        // Manually remove from state for immediate UI update
        dispatch({ type: POST_ACTIONS.DELETE_EVENT, payload: eventId });
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete event';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Edit event
  const editEvent = async (eventId, eventData) => {
    try {
      // Add userId to the FormData
      if (eventData instanceof FormData) {
        eventData.append('userId', user.uid || user.id);
      } else {
        // Convert to FormData if it's not already
        const formData = new FormData();
        Object.keys(eventData).forEach(key => {
          if (key === 'poster' && eventData[key]) {
            formData.append('poster', eventData[key]);
          } else {
            formData.append(key, eventData[key]);
          }
        });
        formData.append('userId', user.uid || user.id);
        eventData = formData;
      }

      const response = await apiService.editEvent(eventId, eventData);
      
      if (response.data.success) {
        // Event will be updated via socket event or refresh
        toast.success('Event updated successfully!');
        // Manually update state for immediate UI update
        dispatch({ type: POST_ACTIONS.UPDATE_EVENT, payload: response.data.event });
        return { success: true, event: response.data.event };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update event';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Update filters
  const updateFilters = (newFilters) => {
    dispatch({ type: POST_ACTIONS.SET_FILTERS, payload: newFilters });
  };

  // Re-fetch posts when filters change (skip the initial mount by tracking previous filters)
  useEffect(() => {
    if (!user) return;
    // fetchPosts resets pagination and loads fresh results with current filters
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.filters, user?.campusId]);

  // Clear error
  const clearError = () => {
    dispatch({ type: POST_ACTIONS.CLEAR_ERROR });
  };

  // Refresh posts
  const refreshPosts = () => {
    if (user) {
      fetchPosts();
    }
  };

  // Load more posts
  const loadMorePosts = () => {
    if (state.hasMore && !state.loading && user) {
      fetchPosts(true);
    }
  };

  // Update comment count for a post (optimistic update)
  const updateCommentCount = (postId, increment = 1) => {
    dispatch({
      type: POST_ACTIONS.UPDATE_POST,
      payload: {
        id: postId,
        commentCount: (state.posts.find(p => p.id === postId)?.commentCount || 0) + increment
      }
    });
  };

  const value = {
    // State
    posts: state.posts,
    polls: state.polls,
    events: state.events,
    loading: state.loading,
    pollsLoading: state.pollsLoading,
    eventsLoading: state.eventsLoading,
    error: state.error,
    hasMore: state.hasMore,
    filters: state.filters,

    // Actions
    fetchPosts,
    fetchPolls,
    fetchEvents,
    createPost,
    createPoll,
    likePost,
    likeEvent,
    voteOnPoll,
    deletePost,
    editPost,
    deleteEvent,
    editEvent,
    updateFilters,
    updateCommentCount,
    clearError,
    refreshPosts,
    loadMorePosts
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};

// Hook to use post context
export const usePosts = () => {
  const context = useContext(PostContext);
  
  if (!context) {
    throw new Error('usePosts must be used within a PostProvider');
  }
  
  return context;
};

export default PostContext;
