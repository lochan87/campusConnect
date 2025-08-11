const express = require('express');
const { getFirestore, getAuth } = require('../config/firebase');
const geminiService = require('../services/geminiService');
const router = express.Router();

// GET /api/users/check-username/:username - Check username availability
router.get('/check-username/:username', async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const db = getFirestore();
    
    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.json({
        success: true,
        available: false,
        message: 'Username can only contain letters, numbers, and underscores'
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.json({
        success: true,
        available: false,
        message: 'Username must be between 3 and 20 characters'
      });
    }

    // Check if username exists
    const usersQuery = await db.collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    const isAvailable = usersQuery.empty;

    res.json({
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Username is available' : 'Username is already taken'
    });

  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check username availability'
    });
  }
});

// POST /api/users/register - Register a new user
router.post('/register', async (req, res) => {
  try {
    const db = getFirestore();
    const auth = getAuth();
    const {
      email,
      password,
      firstName,
      lastName,
      username,
      studentId,
      campusId,
      department,
      year
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !username || !studentId || !campusId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'Username can only contain letters, numbers, and underscores'
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Username must be between 3 and 20 characters'
      });
    }

    // Check if username is already taken
    const usernameCheck = await db.collection('users')
      .where('username', '==', username.toLowerCase())
      .limit(1)
      .get();

    if (!usernameCheck.empty) {
      return res.status(400).json({
        success: false,
        error: 'Username is already taken'
      });
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`
    });

    // Create user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email,
      firstName,
      lastName,
      username: username.toLowerCase(),
      studentId,
      campusId,
      department: department || '',
      year: year || '',
      displayName: `${firstName} ${lastName}`,
      isActive: true,
      isVerified: false,
      reputation: 0,
      postCount: 0,
      joinedAt: new Date(),
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

    await db.collection('users').doc(userRecord.uid).set(userData);

    // Remove sensitive data from response
    const { password: _, ...userResponse } = userData;

    res.status(201).json({
      success: true,
      user: userResponse,
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('Error registering user:', error);
    
    let errorMessage = 'Failed to register user';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Email already exists';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    }

    res.status(400).json({
      success: false,
      error: errorMessage
    });
  }
});

// POST /api/users/login - Login user
router.post('/login', async (req, res) => {
  try {
    const db = getFirestore();
    const auth = getAuth();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    // For demo purposes, since we can't verify password directly with Firebase Admin SDK
    // In a real app, you'd use Firebase Client SDK on frontend or implement proper auth
    
    // Try to find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Update last active timestamp
    await db.collection('users').doc(userDoc.id).update({
      lastActive: new Date()
    });

    // Remove sensitive data from response
    const { password: _, ...userResponse } = userData;

    res.json({
      success: true,
      user: userResponse,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
});

// GET /api/users/:id - Get user profile
router.get('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;

    const userDoc = await db.collection('users').doc(id).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Get user's post count and reputation
    const postsSnapshot = await db.collection('posts')
      .where('userId', '==', id)
      .where('isActive', '==', true)
      .get();

    const pollsSnapshot = await db.collection('polls')
      .where('userId', '==', id)
      .where('isActive', '==', true)
      .get();

    // Calculate reputation based on post upvotes
    let reputation = 0;
    postsSnapshot.forEach(doc => {
      const post = doc.data();
      reputation += (post.upvotes || 0) - (post.downvotes || 0);
    });

    const userProfile = {
      ...userData,
      postCount: postsSnapshot.size,
      pollCount: pollsSnapshot.size,
      reputation
    };

    res.json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// PUT /api/users/:id - Update user profile
router.put('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { userId } = req.body; // From auth token in real app

    // Check if user is updating their own profile
    if (id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this profile'
      });
    }

    const {
      firstName,
      lastName,
      department,
      year,
      preferences
    } = req.body;

    const updateData = {
      updatedAt: new Date()
    };

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (department) updateData.department = department;
    if (year) updateData.year = year;
    if (preferences) updateData.preferences = preferences;

    if (firstName || lastName) {
      updateData.displayName = `${firstName || ''} ${lastName || ''}`.trim();
    }

    await db.collection('users').doc(id).update(updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// GET /api/users/:id/posts - Get user's posts
router.get('/:id/posts', async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    let query = db.collection('posts')
      .where('userId', '==', id)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    if (offset > 0) {
      const offsetSnapshot = await db.collection('posts')
        .where('userId', '==', id)
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(parseInt(offset))
        .get();
      
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();
    const posts = [];

    snapshot.forEach(doc => {
      posts.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      });
    });

    res.json({
      success: true,
      posts
    });

  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user posts'
    });
  }
});

// GET /api/users/campus/:campusId - Get users by campus
router.get('/campus/:campusId', async (req, res) => {
  try {
    const db = getFirestore();
    const { campusId } = req.params;
    const { limit = 50 } = req.query;

    const snapshot = await db.collection('users')
      .where('campusId', '==', campusId)
      .where('isActive', '==', true)
      .orderBy('reputation', 'desc')
      .limit(parseInt(limit))
      .get();

    const users = [];

    snapshot.forEach(doc => {
      const userData = doc.data();
      // Remove sensitive information
      const { email, preferences, ...publicUserData } = userData;
      users.push({
        id: doc.id,
        ...publicUserData
      });
    });

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Error fetching campus users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campus users'
    });
  }
});

// GET /api/users/leaderboard/:campusId - Get campus leaderboard
router.get('/leaderboard/:campusId', async (req, res) => {
  try {
    const db = getFirestore();
    const { campusId } = req.params;
    const { limit = 10 } = req.query;

    // Get top users by reputation
    const snapshot = await db.collection('users')
      .where('campusId', '==', campusId)
      .where('isActive', '==', true)
      .orderBy('reputation', 'desc')
      .limit(parseInt(limit))
      .get();

    const leaderboard = [];

    snapshot.forEach((doc, index) => {
      const userData = doc.data();
      leaderboard.push({
        rank: index + 1,
        id: doc.id,
        displayName: userData.displayName,
        department: userData.department,
        reputation: userData.reputation || 0,
        postCount: userData.postCount || 0
      });
    });

    res.json({
      success: true,
      leaderboard
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

// POST /api/users/:id/report - Report a user
router.post('/:id/report', async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { reportedBy, reason, description } = req.body;

    if (!reportedBy || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Reporter ID and reason are required'
      });
    }

    const reportData = {
      reportedUser: id,
      reportedBy,
      reason,
      description: description || '',
      status: 'pending',
      createdAt: new Date()
    };

    await db.collection('user_reports').add(reportData);

    res.json({
      success: true,
      message: 'User reported successfully'
    });

  } catch (error) {
    console.error('Error reporting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to report user'
    });
  }
});

// GET /api/users/profile/:id - Get user profile and stats
router.get('/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('👤 Fetching user profile for:', userId);
    
    const db = getFirestore();
    
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // Create a basic user profile for demo users
      console.log('📝 Creating basic profile for user:', userId);
      const basicUserData = {
        uid: userId,
        email: `demo-user-${userId}@campus.edu`,
        username: `demo_${userId.substring(0, 8)}`,
        displayName: 'Demo User',
        department: 'Computer Science',
        year: '1st Year',
        bio: 'Welcome to CampusConnect!',
        reputation: 0,
        postCount: 0,
        createdAt: new Date(),
        isActive: true
      };
      
      // Create the user document
      await db.collection('users').doc(userId).set(basicUserData);
      
      // Return a basic profile
      return res.json({
        success: true,
        profile: {
          id: userId,
          displayName: basicUserData.displayName,
          username: basicUserData.username,
          email: basicUserData.email,
          department: basicUserData.department,
          year: basicUserData.year,
          bio: basicUserData.bio,
          reputation: basicUserData.reputation,
          postCount: 0,
          joinedAt: basicUserData.createdAt,
          stats: {
            totalPosts: 0,
            totalPolls: 0,
            totalLikes: 0,
            recentActivity: 0
          },
          recentPosts: [],
          recentPolls: []
        }
      });
    }

    const userData = userDoc.data();
    
    // Get user's posts (simplified query to avoid index requirement)
    const postsQuery = db.collection('posts')
      .where('authorId', '==', userId)
      .limit(50);
    
    const postsSnapshot = await postsQuery.get();
    const userPosts = [];
    
    postsSnapshot.forEach(doc => {
      const postData = doc.data();
      userPosts.push({
        id: doc.id,
        title: postData.title,
        content: postData.content,
        type: postData.type,
        createdAt: postData.createdAt?.toDate?.() || postData.createdAt,
        category: postData.category,
        likes: postData.likes || 0,
        isAnonymous: postData.isAnonymous
      });
    });

    // Sort posts by date in JavaScript instead of Firestore
    userPosts.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA; // Newest first
    });

    // Get user's polls (simplified query to avoid index requirement)
    const pollsQuery = db.collection('polls')
      .where('authorId', '==', userId)
      .limit(50);
    
    const pollsSnapshot = await pollsQuery.get();
    const userPolls = [];
    
    pollsSnapshot.forEach(doc => {
      const pollData = doc.data();
      userPolls.push({
        id: doc.id,
        question: pollData.question,
        options: pollData.options,
        createdAt: pollData.createdAt?.toDate?.() || pollData.createdAt,
        totalVotes: (pollData.options || []).reduce((sum, opt) => sum + (opt.votes || 0), 0),
        isAnonymous: pollData.isAnonymous
      });
    });

    // Sort polls by date in JavaScript instead of Firestore
    userPolls.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA; // Newest first
    });

    // Calculate activity stats
    const totalPosts = userPosts.length;
    const totalPolls = userPolls.length;
    const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
    
    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentPosts = userPosts.filter(post => {
      const postDate = new Date(post.createdAt);
      return postDate >= thirtyDaysAgo;
    });
    
    const recentPolls = userPolls.filter(poll => {
      const pollDate = new Date(poll.createdAt);
      return pollDate >= thirtyDaysAgo;
    });

    const profile = {
      id: userId,
      displayName: userData.displayName || userData.email,
      username: userData.username || null,
      email: userData.email,
      department: userData.department || '',
      year: userData.year || '',
      bio: userData.bio || '',
      reputation: userData.reputation || 0,
      postCount: userData.postCount || totalPosts,
      joinedAt: userData.createdAt?.toDate?.() || userData.createdAt,
      stats: {
        totalPosts,
        totalPolls,
        totalLikes,
        recentActivity: recentPosts.length + recentPolls.length
      },
      recentPosts: userPosts.slice(0, 10),
      recentPolls: userPolls.slice(0, 10)
    };

    console.log('✅ User profile fetched:', userId);

    res.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// PUT /api/users/profile/:id - Update user profile
router.put('/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { displayName, username, department, year, bio } = req.body;
    
    console.log('✏️ Updating user profile for:', userId);
    
    const db = getFirestore();
    
    // If username is being updated, check if it's available
    if (username !== undefined && username.trim()) {
      const normalizedUsername = username.toLowerCase().trim();
      
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(normalizedUsername)) {
        return res.status(400).json({
          success: false,
          error: 'Username can only contain letters, numbers, and underscores'
        });
      }

      if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
        return res.status(400).json({
          success: false,
          error: 'Username must be between 3 and 20 characters'
        });
      }

      // Check if username is already taken by another user
      const usernameCheck = await db.collection('users')
        .where('username', '==', normalizedUsername)
        .limit(1)
        .get();

      if (!usernameCheck.empty) {
        const existingUser = usernameCheck.docs[0];
        if (existingUser.id !== userId) {
          return res.status(400).json({
            success: false,
            error: 'Username is already taken'
          });
        }
      }
    }
    
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (username !== undefined && username.trim()) updateData.username = username.toLowerCase().trim();
    if (department !== undefined) updateData.department = department;
    if (year !== undefined) updateData.year = year;
    if (bio !== undefined) updateData.bio = bio;
    
    updateData.updatedAt = new Date();
    
    await db.collection('users').doc(userId).update(updateData);
    
    console.log('✅ User profile updated:', userId);
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    });
  }
});

// GET /api/users/digest/:campusId - Get AI-generated campus digest
router.get('/digest/:campusId', async (req, res) => {
  try {
    const db = getFirestore();
    const { campusId } = req.params;
    const { timeRange = '24h' } = req.query;

    // Get recent posts from the campus
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - (timeRange === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000));

    const snapshot = await db.collection('posts')
      .where('campusId', '==', campusId)
      .where('createdAt', '>=', cutoffTime)
      .orderBy('createdAt', 'desc')
      .get();

    const posts = [];
    snapshot.forEach(doc => {
      posts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    const digest = await geminiService.generateCampusDigest(posts, timeRange);

    res.json({
      success: true,
      digest,
      postCount: posts.length,
      timeRange
    });

  } catch (error) {
    console.error('Error generating campus digest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate campus digest'
    });
  }
});

module.exports = router;
