import axios from 'axios';
import toast from 'react-hot-toast';

// Request queue to track concurrent requests
let pendingRequests = 0;

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // Increased to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  maxConcurrentRequests: 15, // Increased limit
  maxRedirects: 3,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Simplified request handling - just count requests but don't block
    pendingRequests++;
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url} (${pendingRequests} pending)`);
    
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add user ID to requests if available
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.uid) {
      config.headers['X-User-ID'] = user.uid;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url} (${pendingRequests} pending)`);
    
    // Debug post creation responses
    if (response.config.url === '/posts' && response.config.method === 'post') {
      console.log('POST creation response data:', response.data);
    }
    
    return response;
  },
  (error) => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    console.log(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} (${pendingRequests} pending)`);
    console.error('Full error object:', error);
    
    const message = error.response?.data?.error || error.message || 'An error occurred';
    
    // Don't show toast for auth errors or specific errors we handle elsewhere
    if (error.response?.status !== 401 && 
        error.response?.status !== 403 && 
        !message.includes('concurrent') &&
        !message.includes('timeout') &&
        error.code !== 'ECONNABORTED') {
      console.log('Showing error toast:', message);
      toast.error(message);
    }
    
    // Auto-logout on 401
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// API service functions
export const apiService = {
  // Posts
  getPosts: (params = {}) => api.get('/posts', { params }),
  getPost: (id, userId) => api.get(`/posts/${id}`, { params: userId ? { userId } : {} }),
  createPost: (postData) => {
    // If postData is already FormData, use it directly
    if (postData instanceof FormData) {
      return api.post('/posts', postData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 15000 // Increase timeout for file uploads
      });
    }
    
    // Otherwise, create FormData from object
    const formData = new FormData();
    Object.keys(postData).forEach(key => {
      if (key === 'image' && postData[key]) {
        formData.append('image', postData[key]);
      } else if (key === 'tags' && Array.isArray(postData[key])) {
        formData.append('tags', postData[key].join(','));
      } else {
        formData.append(key, postData[key]);
      }
    });
    return api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 15000 // Increase timeout for file uploads
    });
  },
  editPost: (id, postData) => {
    // If postData is already FormData, use it directly
    if (postData instanceof FormData) {
      return api.put(`/posts/${id}`, postData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    
    // Otherwise, create FormData from object
    const formData = new FormData();
    Object.keys(postData).forEach(key => {
      if (key === 'image' && postData[key]) {
        formData.append('image', postData[key]);
      } else if (key === 'tags' && Array.isArray(postData[key])) {
        formData.append('tags', postData[key].join(','));
      } else {
        formData.append(key, postData[key]);
      }
    });
    return api.put(`/posts/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  likePost: (id, userId) => api.post(`/posts/${id}/like`, { userId }),
  deletePost: (id, userId) => api.delete(`/posts/${id}`, { data: { userId } }),
  reportPost: (id, reportData) => api.post(`/posts/${id}/report`, reportData),
  getEventSummary: (campusId) => api.get('/posts/summary/events', { params: { campusId } }),

  // Polls
  getPolls: (params = {}) => api.get('/polls', { params }),
  getPoll: (id, userId) => api.get(`/polls/${id}`, { params: { userId } }),
  createPoll: (pollData) => api.post('/polls', pollData),
  votePoll: (id, voteData) => api.post(`/polls/${id}/vote`, voteData),
  closePoll: (id, userId) => api.put(`/polls/${id}/close`, { userId }),
  deletePoll: (id, userId) => api.delete(`/polls/${id}`, { data: { userId } }),

  // Events
  getEvents: (params = {}) => api.get('/events', { params }),
  getEvent: (id, userId) => api.get(`/events/${id}`, { params: { userId } }),
  createEvent: (eventData) => {
    return api.post('/events', eventData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  editEvent: (id, eventData) => {
    return api.put(`/events/${id}`, eventData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteEvent: (id, userId) => api.delete(`/events/${id}`, { data: { userId } }),
  likeEvent: (id, userId) => api.post(`/events/${id}/like`, { userId }),
  getEventComments: (id) => api.get(`/events/${id}/comments`),
  addEventComment: (id, commentData) => api.post(`/events/${id}/comments`, commentData),
  deleteEventComment: (eventId, commentId, userId) => api.delete(`/events/${eventId}/comments/${commentId}`, { data: { userId } }),
  reportEvent: (id, reportData) => api.post(`/events/${id}/report`, reportData),

  // Users
  register: (userData) => api.post('/users/register', userData),
  login: (loginData) => api.post('/users/login', loginData),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  getUserPosts: (id, params = {}) => api.get(`/users/${id}/posts`, { params }),
  getCampusUsers: (campusId, params = {}) => api.get(`/users/campus/${campusId}`, { params }),
  getLeaderboard: (campusId, params = {}) => api.get(`/users/leaderboard/${campusId}`, { params }),
  reportUser: (id, reportData) => api.post(`/users/${id}/report`, reportData),
  getCampusDigest: (campusId, timeRange = '24h') => api.get(`/users/digest/${campusId}`, { params: { timeRange } }),
  
  // Profile
  getUserProfile: (id) => api.get(`/users/profile/${id}`),
  updateUserProfile: (id, profileData) => api.put(`/users/profile/${id}`, profileData),
  changePassword: (passwordData) => api.put('/users/change-password', passwordData),
  changeEmail: (emailData) => api.put('/users/change-email', emailData),
  changeStudentId: (studentIdData) => api.put('/users/change-student-id', studentIdData),
  deleteUserAccount: () => api.delete('/users/delete-account'),
  
  // Leaderboard
  getLeaderboardData: (campusId) => api.get('/leaderboard', { params: campusId ? { campusId } : {} }),
  
  // Stats
  getStats: (params = {}) => api.get('/stats', { params }),

  // Search
  search: (params = {}) => api.get('/search', { params }),

  // AI Category Suggestion (Feature #18 — real Gemini call)
  suggestCategory: (content) => api.post('/posts/suggest-category', { content }),
  
  // Comments (if implemented)
  getComments: (postId) => api.get(`/posts/${postId}/comments`),
  createComment: (postId, commentData) => api.post(`/posts/${postId}/comments`, commentData),
  deleteComment: (postId, commentId, userId) => api.delete(`/posts/${postId}/comments/${commentId}`, { data: { userId } }),

  // Notifications

  // Health check
  healthCheck: () => api.get('/health', { baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000' })
};

// Convenient export functions for easy access
export const getPost = (id, userId) => apiService.getPost(id, userId);
export const getEvent = (id, userId) => apiService.getEvent(id, userId);
export const deleteEvent = (id, userId) => apiService.deleteEvent(id, userId);
export const likeEvent = (id, userId) => apiService.likeEvent(id, userId);
export const getEventComments = (id) => apiService.getEventComments(id);
export const addEventComment = (id, content, userId = null, isAnonymous = false) => 
  apiService.addEventComment(id, { 
    content, 
    userId, 
    isAnonymous 
  });
export const deleteEventComment = (eventId, commentId, userId) => apiService.deleteEventComment(eventId, commentId, userId);
export const likePost = (id, userId) => apiService.likePost(id, userId);
export const deletePost = (id, userId) => apiService.deletePost(id, userId);
export const getComments = (postId) => apiService.getComments(postId);
export const addComment = (postId, content) => apiService.createComment(postId, { content });
export const createComment = (postId, commentData) => apiService.createComment(postId, commentData);
export const deleteComment = (postId, commentId, userId) => apiService.deleteComment(postId, commentId, userId);

// Utility functions
// Images are embedded as base64 via FormData in createPost() / createEvent().
// There is no standalone upload endpoint — pass the File object under the 'image'
// or 'poster' key when calling those functions instead.
export const uploadImage = async (_file) => {
  throw new Error(
    'uploadImage() is not supported. Pass the File directly to createPost() or createEvent() via FormData.'
  );
};

export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
  }
  
  if (file.size > maxSize) {
    throw new Error('File size too large. Please upload an image smaller than 5MB.');
  }
  
  return true;
};

export const formatError = (error) => {
  if (error.response?.data?.details) {
    return error.response.data.details.join(', ');
  }
  return error.response?.data?.error || error.message || 'An unknown error occurred';
};

export default api;
