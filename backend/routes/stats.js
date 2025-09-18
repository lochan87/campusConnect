const express = require('express');
const { getFirestore } = require('../config/firebase');
const { cleanupService } = require('../services/cleanupService');
const router = express.Router();

// GET /api/stats - Get quick stats for dashboard
router.get('/', async (req, res) => {
  try {
    const db = getFirestore();
    const { campusId, userId } = req.query;

    if (!campusId) {
      return res.status(400).json({
        success: false,
        error: 'Campus ID is required'
      });
    }

    // Create promises for concurrent execution
    const promises = [];

    // Get posts count
    promises.push(
      db.collection('posts')
        .where('campusId', '==', campusId)
        .get()
        .then(snapshot => ({ type: 'posts', count: snapshot.size }))
    );

    // Get active polls count
    promises.push(
      db.collection('polls')
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
        .get()
        .then(snapshot => ({ type: 'polls', count: snapshot.size }))
    );

    // Get events count
    promises.push(
      db.collection('events')
        .where('campusId', '==', campusId)
        .get()
        .then(snapshot => ({ type: 'events', count: snapshot.size }))
    );

    // Execute all queries concurrently
    const results = await Promise.all(promises);

    // Transform results into object
    const stats = {};
    results.forEach(result => {
      stats[result.type] = result.count;
    });

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

// GET /api/stats/cleanup - Trigger manual cleanup (useful for testing)
router.get('/cleanup', async (req, res) => {
  try {
    console.log('🧹 Manual cleanup triggered via API');
    const result = await cleanupService.runOnce();
    
    res.json({
      success: true,
      message: 'Cleanup completed',
      result
    });

  } catch (error) {
    console.error('Error during manual cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run cleanup'
    });
  }
});

module.exports = router;