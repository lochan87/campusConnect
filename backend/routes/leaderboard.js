const express = require('express');
const { getFirestore } = require('../config/firebase');
const router = express.Router();

// Helper function to check if user is a demo user
const isDemoUser = (userId, userData) => {
  // Check if userId starts with demo- or has demo characteristics
  if (userId.startsWith('demo-') || userId.includes('demo')) {
    return true;
  }
  
  // Check if email contains demo
  if (userData.email && userData.email.includes('demo-user-')) {
    return true;
  }
  
  // Check if username contains demo
  if (userData.username && userData.username.startsWith('demo_')) {
    return true;
  }
  
  // Check if displayName is "Demo User"
  if (userData.displayName === 'Demo User') {
    return true;
  }
  
  return false;
};

// GET /api/leaderboard - Get top users by reputation and activity (scoped to campus)
router.get('/', async (req, res) => {
  try {
    console.log('📊 Fetching leaderboard data');
    const db = getFirestore();
    const { campusId } = req.query; // scope to campus when provided

    // Get more users to filter out demo users and apply campus scope
    const reputationQuery = db.collection('users')
      .orderBy('reputation', 'desc')
      .limit(100); // fetch extra to have room after filtering
    
    const reputationSnapshot = await reputationQuery.get();
    const topReputation = [];
    
    reputationSnapshot.forEach(doc => {
      const userData = doc.data();
      
      // Skip demo users
      if (isDemoUser(doc.id, userData)) {
        console.log('🚫 Excluding demo user from leaderboard:', doc.id);
        return;
      }

      // Scope to campus when a campusId is provided
      if (campusId && userData.campusId && userData.campusId !== campusId) {
        return;
      }
      
      // Only include users with actual reputation
      if ((userData.reputation || 0) > 0) {
        topReputation.push({
          id: doc.id,
          displayName: userData.displayName || userData.email,
          email: userData.email,
          reputation: userData.reputation || 0,
          postCount: userData.postCount || 0,
          department: userData.department || '',
          year: userData.year || ''
        });
      }
    });
    
    // Limit to top 10 after filtering
    topReputation.splice(10);

    // Get top users by post count
    const activityQuery = db.collection('users')
      .orderBy('postCount', 'desc')
      .limit(100);
    
    const activitySnapshot = await activityQuery.get();
    const mostActive = [];
    
    activitySnapshot.forEach(doc => {
      const userData = doc.data();
      
      // Skip demo users
      if (isDemoUser(doc.id, userData)) {
        return;
      }

      // Scope to campus when a campusId is provided
      if (campusId && userData.campusId && userData.campusId !== campusId) {
        return;
      }
      
      // Only include users with actual activity
      if ((userData.postCount || 0) > 0) {
        mostActive.push({
          id: doc.id,
          displayName: userData.displayName || userData.email,
          email: userData.email,
          reputation: userData.reputation || 0,
          postCount: userData.postCount || 0,
          department: userData.department || '',
          year: userData.year || ''
        });
      }
    });
    
    // Limit to top 10 after filtering
    mostActive.splice(10);

    console.log('✅ Leaderboard data fetched:', { campusId: campusId || 'global', topReputation: topReputation.length, mostActive: mostActive.length });

    res.json({
      success: true,
      leaderboard: {
        topReputation,
        mostActive
      }
    });

  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard data'
    });
  }
});

module.exports = router;
