import { apiService } from './api';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.loadUserFromStorage();
  }

  // Load user from localStorage on app start
  loadUserFromStorage() {
    try {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');
      
      if (savedUser && token) {
        this.currentUser = JSON.parse(savedUser);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      this.clearStorage();
    }
  }

  // Save user to localStorage
  saveUserToStorage(user, token) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('authToken', token);
    this.currentUser = user;
  }

  // Clear storage
  clearStorage() {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    this.currentUser = null;
  }

  // Register new user
  async register(userData) {
    try {
      const response = await apiService.register(userData);
      
      if (response.data.success) {
        const { user, token } = response.data;
        // Use the signed token returned by the backend
        if (!token) {
          throw new Error('No token received from server');
        }
        
        this.saveUserToStorage(user, token);
        return { success: true, user };
      }
      
      throw new Error(response.data.error || 'Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(loginData) {
    try {
      const response = await apiService.login(loginData);
      
      if (response.data.success) {
        const { user, token } = response.data;
        // Use the signed token returned by the backend
        if (!token) {
          throw new Error('No token received from server');
        }
        
        this.saveUserToStorage(user, token);
        return { success: true, user };
      }
      
      throw new Error(response.data.error || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout user
  logout() {
    this.clearStorage();
    return { success: true };
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser && !!localStorage.getItem('authToken');
  }

  // Get auth token
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Update user profile
  async updateProfile(userData) {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      const response = await apiService.updateUser(this.currentUser.uid, {
        ...userData,
        userId: this.currentUser.uid
      });

      if (response.data.success) {
        // Update local user data
        const updatedUser = { ...this.currentUser, ...userData };
        this.saveUserToStorage(updatedUser, this.getToken());
        return { success: true, user: updatedUser };
      }

      throw new Error(response.data.error || 'Profile update failed');
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Refresh user data
  async refreshUser() {
    try {
      if (!this.currentUser) {
        return null;
      }

      const response = await apiService.getUser(this.currentUser.uid);
      
      if (response.data.success) {
        let user = response.data.user;

        // Also fetch avatar from profile endpoint (GET /:id doesn't include it)
        try {
          const profileRes = await apiService.getUserProfile(this.currentUser.uid);
          if (profileRes.data.success && profileRes.data.profile?.avatar) {
            user = { ...user, avatar: profileRes.data.profile.avatar };
          }
        } catch (_) { /* avatar fetch is non-critical */ }

        this.saveUserToStorage(user, this.getToken());
        return user;
      }

      return this.currentUser;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return this.currentUser;
    }
  }

  // Persist an updated avatar URL into local storage without a full refresh
  updateAvatarInStorage(avatarUrl) {
    if (!this.currentUser) return;
    const updated = { ...this.currentUser, avatar: avatarUrl };
    this.saveUserToStorage(updated, this.getToken());
    return updated;
  }

  // Check if user can perform action
  canPerformAction(action, resource = null) {
    if (!this.currentUser) {
      return false;
    }

    switch (action) {
      case 'create_post':
      case 'create_poll':
        return this.currentUser.isActive && this.currentUser.isVerified;
      
      case 'vote':
        return this.currentUser.isActive;
      
      case 'moderate':
        return this.currentUser.role === 'admin' || this.currentUser.role === 'moderator';
      
      case 'delete_post':
      case 'delete_poll':
        if (resource && resource.userId === this.currentUser.uid) {
          return true; // Own content
        }
        return this.currentUser.role === 'admin' || this.currentUser.role === 'moderator';
      
      default:
        return true;
    }
  }

  // Generate mock users for demo (remove in production)
  generateMockUser(campusId = 'demo-campus') {
    const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    const departments = ['Computer Science', 'Engineering', 'Business', 'Arts', 'Science', 'Medicine'];
    const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@campus.edu`;
    const studentId = `ST${Math.floor(Math.random() * 90000) + 10000}`;

    // Use a consistent UID for demo purposes - hash based on email
    const consistentUid = `demo-user-${btoa(email).replace(/[+=\/]/g, '').substring(0, 16)}`;

    return {
      uid: consistentUid,
      email,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      studentId,
      campusId,
      department: departments[Math.floor(Math.random() * departments.length)],
      year: years[Math.floor(Math.random() * years.length)],
      isActive: true,
      isVerified: Math.random() > 0.3, // 70% verified
      reputation: Math.floor(Math.random() * 1000),
      postCount: Math.floor(Math.random() * 50),
      joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date in last year
      lastActive: new Date(),
      preferences: {
        notifications: {
          posts: true,
          polls: true,
          events: true,
          memes: true
        },
        privacy: {
          showProfile: true,
          allowDirectMessages: true
        }
      }
    };
  }

  // Demo login (remove in production)
  async demoLogin(campusId = 'demo-campus') {
    try {
      const mockUser = this.generateMockUser(campusId);
      const token = 'demo-token-' + mockUser.uid;
      
      this.saveUserToStorage(mockUser, token);
      return { success: true, user: mockUser };
    } catch (error) {
      console.error('Demo login error:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const authService = new AuthService();

export default authService;
