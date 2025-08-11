import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
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
    return response;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    
    // Don't show toast for auth errors (handled separately)
    if (error.response?.status !== 401 && error.response?.status !== 403) {
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
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (postData) => {
    // If postData is already FormData, use it directly
    if (postData instanceof FormData) {
      return api.post('/posts', postData, {
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
    return api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
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
  votePost: (id, voteData) => api.post(`/posts/${id}/vote`, voteData),
  deletePost: (id, userId) => api.delete(`/posts/${id}`, { data: { userId } }),
  getEventSummary: (campusId) => api.get('/posts/summary/events', { params: { campusId } }),

  // Polls
  getPolls: (params = {}) => api.get('/polls', { params }),
  getPoll: (id, userId) => api.get(`/polls/${id}`, { params: { userId } }),
  createPoll: (pollData) => api.post('/polls', pollData),
  votePoll: (id, voteData) => api.post(`/polls/${id}/vote`, voteData),
  closePoll: (id, userId) => api.put(`/polls/${id}/close`, { userId }),
  deletePoll: (id, userId) => api.delete(`/polls/${id}`, { data: { userId } }),

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
  
  // Leaderboard
  getLeaderboardData: () => api.get('/leaderboard'),

  // Comments (if implemented)
  getComments: (postId) => api.get(`/posts/${postId}/comments`),
  createComment: (postId, commentData) => api.post(`/posts/${postId}/comments`, commentData),
  deleteComment: (postId, commentId, userId) => api.delete(`/posts/${postId}/comments/${commentId}`, { data: { userId } }),

  // Notifications

  // Health check
  healthCheck: () => api.get('/health', { baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000' })
};

// Utility functions
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return response.data.imageUrl;
  } catch (error) {
    throw new Error('Failed to upload image');
  }
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
