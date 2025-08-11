const express = require('express');
const { getFirestore } = require('../config/firebase');
const router = express.Router();

// GET /api/leaderboard - Get top users by reputation and activity
router.get('/', async (req, res) => {
  try {
    console.log('📊 Fetching leaderboard data');
    const db = getFirestore();
    
    // Get top users by reputation
    const reputationQuery = db.collection('users')
      .orderBy('reputation', 'desc')
      .limit(10);
    
    const reputationSnapshot = await reputationQuery.get();
    const topReputation = [];
    
    reputationSnapshot.forEach(doc => {
      const userData = doc.data();
      topReputation.push({
        id: doc.id,
        displayName: userData.displayName || userData.email,
        email: userData.email,
        reputation: userData.reputation || 0,
        postCount: userData.postCount || 0,
        department: userData.department || '',
        year: userData.year || ''
      });
    });

    // Get top users by post count
    const activityQuery = db.collection('users')
      .orderBy('postCount', 'desc')
      .limit(10);
    
    const activitySnapshot = await activityQuery.get();
    const mostActive = [];
    
    activitySnapshot.forEach(doc => {
      const userData = doc.data();
      mostActive.push({
        id: doc.id,
        displayName: userData.displayName || userData.email,
        email: userData.email,
        reputation: userData.reputation || 0,
        postCount: userData.postCount || 0,
        department: userData.department || '',
        year: userData.year || ''
      });
    });

    console.log('✅ Leaderboard data fetched:', { topReputation: topReputation.length, mostActive: mostActive.length });

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
