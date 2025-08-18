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
      return { ...state, polls: action.payload, loading: false };

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
      return { ...state, events: action.payload, loading: false };

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

    const handlePostVoted = (voteData) => {
      dispatch({ 
        type: POST_ACTIONS.UPDATE_POST, 
        payload: {
          id: voteData.postId,
          upvotes: voteData.upvotes,
          downvotes: voteData.downvotes,
          userVote: voteData.userVote
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
    socketService.on('newPost', handleNewPost);
    socketService.on('postUpdated', handlePostUpdated);
    socketService.on('postDeleted', handlePostDeleted);
    socketService.on('postVoted', handlePostVoted);
    socketService.on('newPoll', handleNewPoll);
    socketService.on('pollUpdated', handlePollUpdated);
    socketService.on('pollDeleted', handlePollDeleted);
    socketService.on('comment_added', handleCommentAdded);
    socketService.on('comment_deleted', handleCommentDeleted);

    // Cleanup
    return () => {
      socketService.off('newPost', handleNewPost);
      socketService.off('postUpdated', handlePostUpdated);
      socketService.off('postDeleted', handlePostDeleted);
      socketService.off('postVoted', handlePostVoted);
      socketService.off('newPoll', handleNewPoll);
      socketService.off('pollUpdated', handlePollUpdated);
      socketService.off('pollDeleted', handlePollDeleted);
      socketService.off('comment_added', handleCommentAdded);
      socketService.off('comment_deleted', handleCommentDeleted);
    };
  }, [user]);

  // Fetch posts
  const fetchPosts = useCallback(async (loadMore = false) => {
    try {
      console.log('🔄 Fetching posts..., loadMore:', loadMore);
      console.log('👤 User:', user);
      
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

      console.log('📋 API params:', params);
      
      const response = await apiService.getPosts(params);
      console.log('📡 API response:', response);
      
      if (response.data.success) {
        const posts = response.data.posts;
        console.log('📄 Posts received:', posts.length, posts);
        
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
  }, [state.filters, state.pagination.limit, state.pagination.offset, user]);

  // Fetch polls
  const fetchPolls = useCallback(async () => {
    try {
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
    }
  }, [user?.campusId, user?.uid]);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const params = {
        campusId: user?.campusId,
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
    }
  }, [user?.campusId]);

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

  // Vote on post
  const voteOnPost = async (postId, voteType) => {
    try {
      const response = await apiService.votePost(postId, {
        type: voteType,
        userId: user.uid
      });
      
      if (response.data.success) {
        // Vote will be updated via socket event
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to vote';
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
        toast.success('Post deleted successfully!');
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
      const fullPostData = {
        ...postData,
        userId: user.uid || user.id
      };

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

  // Update filters
  const updateFilters = (newFilters) => {
    dispatch({ type: POST_ACTIONS.SET_FILTERS, payload: newFilters });
  };

  // Effect to refetch posts when filters change
  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [state.filters, user]);

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
    error: state.error,
    hasMore: state.hasMore,
    filters: state.filters,

    // Actions
    fetchPosts,
    fetchPolls,
    fetchEvents,
    createPost,
    createPoll,
    voteOnPost,
    voteOnPoll,
    deletePost,
    editPost,
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
