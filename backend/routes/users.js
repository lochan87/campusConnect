const express = require('express');
const { getFirestore, getAuth } = require('../config/firebase');
const admin = require('firebase-admin');
const geminiService = require('../services/geminiService');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Auto-selection logic for course and department based on Student ID
const autoSelectCourseAndDepartment = (studentId) => {
  if (!studentId || studentId.length !== 10) return { course: '', department: '' };
  
  const courseCode = studentId.substring(2, 5);  // Extract CCC part
  const deptCode = studentId.substring(5, 7);    // Extract DD part
  
  // Course code mapping
  const courseCodeMapping = {
    'BEN': 'B.E (Bachelor of Engineering)',
    'MTE': 'M.Tech (Master of Technology)',
    'MBA': 'MBA (Master of Business Administration)',
    'BBA': 'BBA (Bachelor of Business Administration)',
    'BCO': 'B.Com (Bachelor of Commerce)',
    'MCO': 'M.Com (Master of Commerce)',
    'PHD': 'Ph.D (Doctor of Philosophy)',
    'BCA': 'BCA (Bachelor of Computer Applications)',
    'MCA': 'MCA (Master of Computer Applications)',
    'BDS': 'Dental (Bachelor of Dental Surgery)',
    'MBS': 'MBBS (Bachelor of Medicine and Bachelor of Surgery)',
    'BSC': 'B.Sc (Bachelor of Science)',
    'MSC': 'M.Sc (Master of Science)',
    'BAR': 'BA (Bachelor of Arts)',
    'MAR': 'MA (Master of Arts)',
    'LLB': 'LLB (Bachelor of Laws)',
    'LLM': 'LLM (Master of Laws)',
    'BED': 'B.Ed (Bachelor of Education)',
    'MED': 'M.Ed (Master of Education)',
  };

  // Department code mapping (serial order for each course)
  const departmentCodeMapping = {
    'B.E (Bachelor of Engineering)': {
      '01': 'Artificial Intelligence and Machine Learning',
      '02': 'Computer Science & Engineering (Data Science)',
      '03': 'Information Science and Engineering',
      '04': 'Computer Science & Engineering (Internet of Things and Cyber Security including Block Chain Technology)',
      '05': 'Electronics and Instrumentation Engineering',
      '06': 'Computer Science and Design',
      '07': 'Mechanical Engineering',
      '08': 'Computer Science and Engineering',
      '09': 'Medical Electronics Engineering',
      '10': 'Computer Science and Business Systems',
      '11': 'Electronics and Telecommunication Engineering',
      '12': 'Computer Science & Engineering (Cyber Security)',
      '13': 'Robotics and Artificial Intelligence',
      '14': 'Aeronautical Engineering',
      '15': 'Chemical Engineering',
      '16': 'Automobile Engineering',
      '17': 'Civil Engineering',
      '18': 'Biotechnology',
      '19': 'Electrical & Electronics Engineering',
      '20': 'Electronics & Communication Engineering'
    },
    'M.Tech (Master of Technology)': {
      '01': 'Computer Science and Engineering',
      '02': 'Mechanical Engineering',
      '03': 'Electronics and Communication Engineering',
      '04': 'Civil Engineering',
      '05': 'Chemical Engineering',
      '06': 'Biotechnology'
    },
    'MBA (Master of Business Administration)': {
      '01': 'Finance',
      '02': 'Marketing',
      '03': 'Human Resources',
      '04': 'Operations',
      '05': 'Information Systems',
      '06': 'International Business'
    },
    'BBA (Bachelor of Business Administration)': {
      '01': 'Finance',
      '02': 'Marketing',
      '03': 'Human Resources',
      '04': 'Operations',
      '05': 'Information Systems',
      '06': 'International Business'
    },
    'B.Com (Bachelor of Commerce)': {
      '01': 'Accounting',
      '02': 'Banking & Finance',
      '03': 'Taxation',
      '04': 'Economics',
      '05': 'Business Mathematics',
      '06': 'Corporate Secretaryship'
    },
    'M.Com (Master of Commerce)': {
      '01': 'Accounting',
      '02': 'Banking & Finance',
      '03': 'Taxation',
      '04': 'Economics',
      '05': 'Business Mathematics',
      '06': 'Corporate Secretaryship'
    },
    'BCA (Bachelor of Computer Applications)': {
      '01': 'Software Development',
      '02': 'Database Management',
      '03': 'Web Technologies',
      '04': 'Mobile Application Development',
      '05': 'System Analysis and Design',
      '06': 'Network Administration'
    },
    'MCA (Master of Computer Applications)': {
      '01': 'Software Development',
      '02': 'Database Management',
      '03': 'Web Technologies',
      '04': 'Mobile Application Development',
      '05': 'System Analysis and Design',
      '06': 'Network Administration'
    },
    'Ph.D (Doctor of Philosophy)': {
      '01': 'Engineering & Technology',
      '02': 'Business & Management',
      '03': 'Commerce & Economics',
      '04': 'Computer Applications',
      '05': 'Medical Sciences',
      '06': 'Basic Sciences',
      '07': 'Arts & Humanities',
      '08': 'Law',
      '09': 'Education'
    }
  };
  
  // Find course by code
  const course = courseCodeMapping[courseCode.toUpperCase()] || '';
  
  // Find department by code and course
  let department = '';
  if (course && departmentCodeMapping[course] && departmentCodeMapping[course][deptCode]) {
    department = departmentCodeMapping[course][deptCode];
  }
  
  return { course, department };
};

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

// GET /api/users/check-email/:email - Check email availability
router.get('/check-email/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const db = getFirestore();
    const auth = getAuth();
    
    console.log(`🔍 Checking email availability for: ${email}`);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(`❌ Invalid email format: ${email}`);
      return res.json({
        success: true,
        available: false,
        message: 'Invalid email format'
      });
    }

    // Check Firebase Auth for existing user with this email
    try {
      const userRecord = await auth.getUserByEmail(email);
      console.log(`❌ Email found in Firebase Auth: ${email}`, userRecord.uid);
      // If we get here, user exists
      return res.json({
        success: true,
        available: false,
        message: 'Email is already registered'
      });
    } catch (authError) {
      console.log(`🔍 Firebase Auth check result for ${email}:`, authError.code);
      // If error is 'auth/user-not-found', email is available
      if (authError.code === 'auth/user-not-found') {
        console.log(`✅ Email not found in Firebase Auth, checking Firestore...`);
        // Also check Firestore just in case there's a mismatch
        const usersQuery = await db.collection('users')
          .where('email', '==', email)
          .limit(1)
          .get();

        const isAvailable = usersQuery.empty;
        console.log(`🔍 Firestore check result: ${isAvailable ? 'Available' : 'Taken'}`);
        
        if (!usersQuery.empty) {
          console.log(`❌ Email found in Firestore:`, usersQuery.docs[0].data());
        }

        return res.json({
          success: true,
          available: isAvailable,
          message: isAvailable ? 'Email is available' : 'Email is already registered'
        });
      } else {
        // Some other auth error
        console.log(`❌ Firebase Auth error:`, authError);
        throw authError;
      }
    }

  } catch (error) {
    console.error('❌ Error checking email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check email availability'
    });
  }
});

// GET /api/users/debug-email/:email - Debug email checking process
router.get('/debug-email/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const db = getFirestore();
    const auth = getAuth();
    
    const debugInfo = {
      email: email,
      timestamp: new Date().toISOString(),
      checks: {}
    };
    
    console.log(`🐛 DEBUG: Full email check for ${email}`);
    
    // Check Firebase Auth
    try {
      const userRecord = await auth.getUserByEmail(email);
      debugInfo.checks.firebaseAuth = {
        exists: true,
        uid: userRecord.uid,
        created: userRecord.metadata.creationTime,
        lastSignIn: userRecord.metadata.lastSignInTime
      };
      console.log(`🐛 Firebase Auth: USER EXISTS`, userRecord.uid);
    } catch (authError) {
      debugInfo.checks.firebaseAuth = {
        exists: false,
        error: authError.code,
        message: authError.message
      };
      console.log(`🐛 Firebase Auth: USER NOT FOUND`, authError.code);
    }
    
    // Check Firestore
    const usersQuery = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    debugInfo.checks.firestore = {
      exists: !usersQuery.empty,
      recordCount: usersQuery.docs.length,
      records: usersQuery.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }))
    };
    
    console.log(`🐛 Firestore: ${usersQuery.empty ? 'NO RECORDS' : `${usersQuery.docs.length} RECORDS FOUND`}`);
    
    // Overall availability
    const isAvailable = debugInfo.checks.firebaseAuth.exists === false && 
                       debugInfo.checks.firestore.exists === false;
    
    debugInfo.available = isAvailable;
    debugInfo.recommendation = isAvailable ? 
      'Email is available for registration' : 
      'Email is already in use - check Firebase Auth or Firestore records';
    
    res.json({
      success: true,
      debug: debugInfo
    });
    
  } catch (error) {
    console.error('🐛 DEBUG ERROR:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        error: error.message,
        stack: error.stack
      }
    });
  }
});

// GET /api/users/cleanup-all-orphaned - Clean up all orphaned Firestore records
router.get('/cleanup-all-orphaned', async (req, res) => {
  try {
    const db = getFirestore();
    const auth = getAuth();
    
    console.log(`🧹 Starting cleanup of all orphaned Firestore records...`);
    
    // Get all users from Firestore
    const allUsers = await db.collection('users').get();
    
    if (allUsers.empty) {
      return res.json({
        success: true,
        message: 'No users found in Firestore',
        orphanedRecords: 0
      });
    }
    
    const orphanedRecords = [];
    
    // Check each Firestore user against Firebase Auth
    for (const doc of allUsers.docs) {
      const userData = doc.data();
      const email = userData.email;
      
      try {
        // Try to get user from Firebase Auth
        await auth.getUserByEmail(email);
        console.log(`✅ User exists in both systems: ${email}`);
      } catch (authError) {
        if (authError.code === 'auth/user-not-found') {
          console.log(`❌ Orphaned record found: ${email}`);
          orphanedRecords.push({
            docId: doc.id,
            email: email,
            data: userData
          });
        } else {
          console.log(`⚠️ Error checking ${email}:`, authError.code);
        }
      }
    }
    
    if (orphanedRecords.length === 0) {
      return res.json({
        success: true,
        message: 'No orphaned records found',
        orphanedRecords: 0
      });
    }
    
    // Clean up orphaned records
    console.log(`🧹 Removing ${orphanedRecords.length} orphaned records...`);
    const batch = db.batch();
    orphanedRecords.forEach(record => {
      const docRef = db.collection('users').doc(record.docId);
      batch.delete(docRef);
    });
    
    await batch.commit();
    
    return res.json({
      success: true,
      message: `Successfully cleaned up ${orphanedRecords.length} orphaned records`,
      orphanedRecords: orphanedRecords.length,
      cleanedEmails: orphanedRecords.map(r => r.email)
    });
    
  } catch (error) {
    console.error('❌ Error during full cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup orphaned records'
    });
  }
});

// GET /api/users/cleanup-email/:email - Clean up orphaned Firestore records
router.get('/cleanup-email/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const db = getFirestore();
    const auth = getAuth();
    
    console.log(`🧹 Cleaning up records for email: ${email}`);
    
    // Check if user exists in Firebase Auth
    let authUserExists = false;
    try {
      await auth.getUserByEmail(email);
      authUserExists = true;
      console.log(`✅ User exists in Firebase Auth`);
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        console.log(`❌ User not found in Firebase Auth`);
      } else {
        throw authError;
      }
    }
    
    // Check Firestore records
    const usersQuery = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (usersQuery.empty) {
      console.log(`✅ No Firestore records found for ${email}`);
      return res.json({
        success: true,
        message: 'No cleanup needed - no records found',
        authExists: authUserExists,
        firestoreRecords: 0
      });
    }
    
    // If Firebase Auth user doesn't exist but Firestore records do, clean them up
    if (!authUserExists) {
      console.log(`🧹 Removing ${usersQuery.docs.length} orphaned Firestore records`);
      const batch = db.batch();
      usersQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      return res.json({
        success: true,
        message: `Cleaned up ${usersQuery.docs.length} orphaned Firestore records`,
        authExists: false,
        removedRecords: usersQuery.docs.length
      });
    } else {
      return res.json({
        success: true,
        message: 'User exists in both Firebase Auth and Firestore - no cleanup needed',
        authExists: true,
        firestoreRecords: usersQuery.docs.length
      });
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup email records'
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
      course,
      department,
      year,
      bio
    } = req.body;

    // Validate required fields (campusId will be generated from studentId)
    if (!email || !password || !firstName || !lastName || !username || !studentId) {
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
    // Generate campusId based on studentId (ignore frontend campusId)
    const generatedCampusId = generateCampusId(studentId);
    
    const userData = {
      uid: userRecord.uid,
      email,
      firstName,
      lastName,
      username: username.toLowerCase(),
      studentId,
      campusId: generatedCampusId,
      course: course || '',
      department: department || '',
      year: year || '',
      displayName: `${firstName} ${lastName}`,
      bio: bio || '', // Use provided bio or empty string
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
      errorMessage = 'The email address is already in use by another account.';
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

    // Use stored reputation and postCount from user document
    // These values are updated during content creation
    const userProfile = {
      ...userData,
      postCount: userData.postCount || 0,
      pollCount: userData.pollCount || 0,
      eventCount: userData.eventCount || 0,
      reputation: userData.reputation || 0
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

// PUT /api/users/change-student-id - Change user student ID
router.put('/change-student-id', async (req, res) => {
  try {
    const { userId, newStudentId, password } = req.body;
    
    if (!userId || !newStudentId || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Basic student ID validation
    const studentIdRegex = /^\d{2}[A-Z]{3}\d{5}$/i;
    if (!studentIdRegex.test(newStudentId.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Student ID must be in format YYCCCDDNNN (e.g., 22BEN03073)'
      });
    }

    const db = getFirestore();
    
    // Check if the new student ID is already in use
    const existingStudentQuery = await db.collection('users')
      .where('studentId', '==', newStudentId.trim())
      .limit(1)
      .get();

    if (!existingStudentQuery.empty) {
      const existingUser = existingStudentQuery.docs[0];
      if (existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          error: 'Student ID is already in use'
        });
      }
    }

    // In a real implementation, you would verify the current password here
    // For now, we'll update the student ID directly
    
    // Auto-select course and department based on new Student ID
    const { course, department } = autoSelectCourseAndDepartment(newStudentId.trim());
    
    // Update student ID, course, and department in Firestore user profile
    const updateData = {
      studentId: newStudentId.trim(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Only update course and department if they were successfully auto-selected
    if (course) {
      updateData.course = course;
    }
    if (department) {
      updateData.department = department;
    }
    
    const userRef = db.collection('users').doc(userId);
    await userRef.update(updateData);
    
    res.json({
      success: true,
      message: 'Student ID updated successfully',
      newStudentId: newStudentId.trim(),
      autoUpdated: {
        course: course || null,
        department: department || null
      }
    });

  } catch (error) {
    console.error('❌ Error changing student ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change student ID'
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
    const db = getFirestore();
    
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // Create a basic user profile for demo users
      const basicUserData = {
        uid: userId,
        email: `demo-user-${userId}@campus.edu`,
        username: `demo_${userId.substring(0, 8)}`,
        displayName: 'Demo User',
        studentId: `DEMO${userId.substring(0, 6).toUpperCase()}`,
        course: 'B.E (Bachelor of Engineering)',
        department: 'Computer Science and Engineering',
        year: '1st Year',
        bio: 'Welcome to CampusConnect!',
        reputation: 0,
        postCount: 0,
        joinedAt: new Date(),
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
          studentId: basicUserData.studentId,
          course: basicUserData.course,
          department: basicUserData.department,
          year: basicUserData.year,
          bio: basicUserData.bio,
          reputation: basicUserData.reputation,
          postCount: 0,
          joinedAt: basicUserData.joinedAt,
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
    
    // Helper function to check if user is a demo user
    const isDemoUser = (userId, userData) => {
      if (userId.startsWith('demo-') || userId.includes('demo')) return true;
      if (userData && userData.email && userData.email.includes('demo-user-')) return true;
      if (userData && userData.username && userData.username.startsWith('demo_')) return true;
      if (userData && userData.displayName === 'Demo User') return true;
      return false;
    };
    
    const isDemo = isDemoUser(userId, userData);
    
    console.log('👤 User data from database:', {
      uid: userId,
      studentId: userData.studentId,
      hasStudentId: !!userData.studentId,
      studentIdType: typeof userData.studentId,
      allFields: Object.keys(userData),
      isDemoUser: isDemo
    });
    
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
      studentId: userData.studentId || '',
      course: userData.course || '',
      department: userData.department || '',
      year: userData.year || '',
      bio: userData.bio || '',
      reputation: isDemo ? 0 : (userData.reputation || 0), // Always 0 for demo users
      postCount: userData.postCount || totalPosts,
      joinedAt: userData.joinedAt?.toDate?.() || userData.joinedAt || userData.createdAt?.toDate?.() || userData.createdAt || new Date(),
      stats: {
        totalPosts: totalPosts || 0,
        totalPolls: totalPolls || 0,
        totalLikes: totalLikes || 0,
        recentActivity: (recentPosts.length + recentPolls.length) || 0
      },
      recentPosts: userPosts.slice(0, 10) || [],
      recentPolls: userPolls.slice(0, 10) || []
    };

    console.log('📤 Sending profile response:', {
      userId,
      studentId: profile.studentId,
      hasStudentId: !!profile.studentId
    });

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
    const { displayName, username, course, department, year, bio, studentId } = req.body;
    
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
    if (course !== undefined) updateData.course = course;
    if (department !== undefined) updateData.department = department;
    if (year !== undefined) updateData.year = year;
    if (bio !== undefined) updateData.bio = bio;
    if (studentId !== undefined) updateData.studentId = studentId;
    
    updateData.updatedAt = new Date();
    
    console.log('💾 Updating user profile:', {
      userId,
      updateData,
      studentId: updateData.studentId,
      hasStudentId: !!updateData.studentId
    });
    
    await db.collection('users').doc(userId).update(updateData);
    
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

// PUT /api/users/change-password - Change user password
router.put('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters'
      });
    }
    
    const auth = getAuth();
    
    try {
      // In a real implementation, you would verify the current password
      // For this demo, we'll just update the password directly
      await auth.updateUser(userId, {
        password: newPassword
      });
      
      res.json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (authError) {
      console.error('❌ Firebase Auth error:', authError);
      
      if (authError.code === 'auth/user-not-found') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      if (authError.code === 'auth/weak-password') {
        return res.status(400).json({
          success: false,
          error: 'Password is too weak'
        });
      }
      
      throw authError;
    }

  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// PUT /api/users/change-email - Change user email
router.put('/change-email', async (req, res) => {
  try {
    const { userId, newEmail, password } = req.body;
    
    if (!userId || !newEmail || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    
    const auth = getAuth();
    
    try {
      // Check if the new email is already in use
      try {
        await auth.getUserByEmail(newEmail);
        return res.status(400).json({
          success: false,
          error: 'Email address is already in use'
        });
      } catch (checkError) {
        // If user is not found, email is available (this is what we want)
        if (checkError.code !== 'auth/user-not-found') {
          throw checkError;
        }
      }
      
      // Update the user's email in Firebase Auth
      await auth.updateUser(userId, {
        email: newEmail
      });
      
      // Update email in Firestore user profile
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        email: newEmail,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.json({
        success: true,
        message: 'Email updated successfully'
      });

    } catch (authError) {
      console.error('❌ Firebase Auth error:', authError);
      
      if (authError.code === 'auth/user-not-found') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      if (authError.code === 'auth/email-already-exists') {
        return res.status(400).json({
          success: false,
          error: 'Email address is already in use'
        });
      }
      
      if (authError.code === 'auth/invalid-email') {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address'
        });
      }
      
      throw authError;
    }

  } catch (error) {
    console.error('❌ Error changing email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change email'
    });
  }
});

// Function to generate campus ID - simple shared format for all users
const generateCampusId = (studentId) => {
  // Simple shared campus ID for all users
  return 'CC_Name';
};

// PUT /api/users/change-student-id - Change student ID with auto-update
router.put('/change-student-id', requireAuth, async (req, res) => {
  try {
    const { studentId } = req.body;
    const userId = req.user.uid;
    const db = getFirestore();
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Student ID is required'
      });
    }

    // Validate student ID format (YYCCCDDNNN - 10 characters)
    const studentIdRegex = /^[0-9]{2}[A-Z]{3}[0-9]{5}$/;
    if (!studentIdRegex.test(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Student ID format. Expected format: YYCCCDDNNN (e.g., 22BEN03073)'
      });
    }

    // Auto-select course and department based on student ID
    const { course, department } = autoSelectCourseAndDepartment(studentId);
    
    if (!course || !department) {
      return res.status(400).json({
        success: false,
        error: 'Unable to determine course or department from Student ID'
      });
    }

    // Generate new campus ID based on student ID
    const campusId = generateCampusId(studentId);
    
    // Update user document
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      studentId,
      course,
      department,
      campusId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      message: 'Student ID updated successfully',
      data: {
        studentId,
        course,
        department,
        campusId
      }
    });

  } catch (error) {
    console.error('❌ Error changing student ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change student ID'
    });
  }
});

// Delete user account
router.delete('/delete-account', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Use a batch to delete all user data atomically
    const batch = db.batch();
    
    // Delete user's posts
    const postsSnapshot = await db.collection('posts')
      .where('authorId', '==', userId)
      .get();
    
    postsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's polls
    const pollsSnapshot = await db.collection('polls')
      .where('authorId', '==', userId)
      .get();
    
    pollsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's comments on posts
    const postCommentsSnapshot = await db.collectionGroup('comments')
      .where('authorId', '==', userId)
      .get();
    
    postCommentsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's votes on polls
    const pollVotesSnapshot = await db.collectionGroup('votes')
      .where('userId', '==', userId)
      .get();
    
    pollVotesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Remove user's likes from all posts and polls
    const allPostsSnapshot = await db.collection('posts').get();
    allPostsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.likes && data.likes.includes(userId)) {
        batch.update(doc.ref, {
          likes: data.likes.filter(id => id !== userId)
        });
      }
    });
    
    const allPollsSnapshot = await db.collection('polls').get();
    allPollsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.likes && data.likes.includes(userId)) {
        batch.update(doc.ref, {
          likes: data.likes.filter(id => id !== userId)
        });
      }
    });
    
    // Delete user document
    const userDoc = db.collection('users').doc(userId);
    batch.delete(userDoc);
    
    // Commit all deletions
    await batch.commit();
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
