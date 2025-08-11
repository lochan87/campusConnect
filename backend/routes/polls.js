const express = require('express');
const { getFirestore } = require('../config/firebase');
const { validatePoll } = require('../middleware/validation');
const router = express.Router();

// GET /api/polls - Get all polls with filters
router.get('/', async (req, res) => {
  try {
    const db = getFirestore();
    const {
      campusId,
      location,
      isActive = true,
      sortBy = 'createdAt',
      order = 'desc',
      limit = 20
    } = req.query;

    let query = db.collection('polls');

    // For development: Use simple queries to avoid index requirements
    // Apply sorting only (no where + orderBy combination)
    query = query.orderBy(sortBy, order).limit(parseInt(limit) * 5); // Get more to filter client-side

    const snapshot = await query.get();
    let polls = [];

    snapshot.forEach(doc => {
      const pollData = doc.data();
      polls.push({
        id: doc.id,
        ...pollData,
        createdAt: pollData.createdAt?.toDate?.() || pollData.createdAt,
        expiresAt: pollData.expiresAt?.toDate?.() || pollData.expiresAt
      });
    });

    // Apply ALL client-side filtering for development
    if (campusId) {
      polls = polls.filter(poll => poll.campusId === campusId);
    }
    
    if (location && location !== 'all') {
      polls = polls.filter(poll => poll.location === location);
    }

    if (isActive !== 'all') {
      polls = polls.filter(poll => poll.isActive === Boolean(isActive));
    }

    // Apply final limit
    polls = polls.slice(0, parseInt(limit));

    res.json({
      success: true,
      polls
    });

  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch polls'
    });
  }
});

// POST /api/polls - Create a new poll
router.post('/', validatePoll, async (req, res) => {
  try {
    console.log('📊 Creating new poll...');
    console.log('Poll data received:', req.body);
    
    const db = getFirestore();
    const {
      question,
      description,
      options,
      campusId,
      location,
      userId,
      userName,
      isAnonymous = false,
      expiresIn = 24, // hours
      allowMultiple = false
    } = req.body;

    const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);

    const pollData = {
      question,
      description: description || '',
      options: options.map(option => ({
        text: option,
        votes: 0,
        voters: []
      })),
      campusId,
      location: location || '',
      userId: isAnonymous ? null : userId,
      userName: isAnonymous ? 'Anonymous' : userName,
      isAnonymous: Boolean(isAnonymous),
      allowMultiple: Boolean(allowMultiple),
      totalVotes: 0,
      isActive: true,
      createdAt: new Date(),
      expiresAt,
      updatedAt: new Date()
    };

    console.log('Writing poll to Firestore:', pollData);
    const docRef = await db.collection('polls').add(pollData);
    console.log('✅ Poll saved with ID:', docRef.id);
    
    const newPoll = {
      id: docRef.id,
      ...pollData
    };

    // Emit real-time update via WebSocket
    if (req.app.get('io')) {
      req.app.get('io').to(`campus_${campusId}`).emit('poll_created', newPoll);
      if (location) {
        req.app.get('io').to(`location_${location}`).emit('poll_created', newPoll);
      }
    }

    res.status(201).json({
      success: true,
      poll: newPoll,
      message: 'Poll created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating poll:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to create poll',
      details: error.message
    });
  }
});

// POST /api/polls/:id/vote - Vote on a poll
router.post('/:id/vote', async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { optionIndexes, userId } = req.body; // Array of option indexes

    if (!Array.isArray(optionIndexes) || optionIndexes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid option selection'
      });
    }

    const pollRef = db.collection('polls').doc(id);
    
    const result = await db.runTransaction(async (transaction) => {
      const pollDoc = await transaction.get(pollRef);

      if (!pollDoc.exists) {
        throw new Error('Poll not found');
      }

      const pollData = pollDoc.data();
      
      // Check if poll is active and not expired
      if (!pollData.isActive) {
        throw new Error('Poll is no longer active');
      }

      if (new Date() > (pollData.expiresAt?.toDate?.() || pollData.expiresAt)) {
        throw new Error('Poll has expired');
      }

      // Check if user already voted
      const hasVoted = pollData.options.some(option => 
        option.voters.includes(userId)
      );

      if (hasVoted) {
        throw new Error('User has already voted');
      }

      // Check if multiple votes are allowed
      if (!pollData.allowMultiple && optionIndexes.length > 1) {
        throw new Error('Multiple votes not allowed for this poll');
      }

      // Validate option indexes
      const invalidIndexes = optionIndexes.filter(index => 
        index < 0 || index >= pollData.options.length
      );

      if (invalidIndexes.length > 0) {
        throw new Error('Invalid option index');
      }

      // Update vote counts
      const updatedOptions = pollData.options.map((option, index) => {
        if (optionIndexes.includes(index)) {
          return {
            ...option,
            votes: option.votes + 1,
            voters: [...option.voters, userId]
          };
        }
        return option;
      });

      const updatedPollData = {
        ...pollData,
        options: updatedOptions,
        totalVotes: pollData.totalVotes + optionIndexes.length,
        updatedAt: new Date()
      };

      transaction.update(pollRef, updatedPollData);

      return updatedPollData;
    });

    // Calculate percentages for response
    const optionsWithPercentages = result.options.map(option => ({
      ...option,
      percentage: result.totalVotes > 0 
        ? Math.round((option.votes / result.totalVotes) * 100)
        : 0,
      voters: undefined // Don't send voter IDs in response
    }));

    const responseData = {
      id,
      options: optionsWithPercentages,
      totalVotes: result.totalVotes
    };

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').to(`campus_${result.campusId}`).emit('poll_updated', responseData);
      if (result.location) {
        req.app.get('io').to(`location_${result.location}`).emit('poll_updated', responseData);
      }
    }

    res.json({
      success: true,
      poll: responseData,
      message: 'Vote recorded successfully'
    });

  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to vote on poll'
    });
  }
});

// GET /api/polls/:id - Get a specific poll
router.get('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { userId } = req.query;

    const doc = await db.collection('polls').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }

    const pollData = doc.data();
    
    // Check if user has voted
    const hasVoted = userId ? pollData.options.some(option => 
      option.voters.includes(userId)
    ) : false;

    // Calculate percentages and remove voter IDs from response
    const optionsWithPercentages = pollData.options.map(option => ({
      text: option.text,
      votes: option.votes,
      percentage: pollData.totalVotes > 0 
        ? Math.round((option.votes / pollData.totalVotes) * 100)
        : 0
    }));

    const poll = {
      id: doc.id,
      ...pollData,
      options: optionsWithPercentages,
      hasVoted,
      createdAt: pollData.createdAt?.toDate?.() || pollData.createdAt,
      expiresAt: pollData.expiresAt?.toDate?.() || pollData.expiresAt
    };

    res.json({
      success: true,
      poll
    });

  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch poll'
    });
  }
});

// PUT /api/polls/:id/close - Close a poll (author only)
router.put('/:id/close', async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { userId } = req.body;

    const pollRef = db.collection('polls').doc(id);
    const pollDoc = await pollRef.get();

    if (!pollDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }

    const pollData = pollDoc.data();

    // Check if user is the author
    if (pollData.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to close this poll'
      });
    }

    await pollRef.update({
      isActive: false,
      updatedAt: new Date()
    });

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('poll_closed', { pollId: id });
    }

    res.json({
      success: true,
      message: 'Poll closed successfully'
    });

  } catch (error) {
    console.error('Error closing poll:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to close poll'
    });
  }
});

// DELETE /api/polls/:id - Delete a poll (author only)
router.delete('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { userId } = req.body;

    const pollDoc = await db.collection('polls').doc(id).get();

    if (!pollDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found'
      });
    }

    const pollData = pollDoc.data();

    // Check if user is the author
    if (pollData.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this poll'
      });
    }

    await db.collection('polls').doc(id).delete();

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('poll_deleted', { pollId: id });
    }

    res.json({
      success: true,
      message: 'Poll deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete poll'
    });
  }
});

module.exports = router;
