const express = require('express');
const router = express.Router();
const { getFirestore, admin } = require('../config/firebase');
const multer = require('multer');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const storageService = require('../services/storageService');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const { 
      campusId, 
      limit = 20, 
      offset = 0, 
      sortBy = 'date', 
      order = 'asc',
      location,
      upcoming = true,
      userId // Add userId from query params
    } = req.query;

    const db = getFirestore();
    let query = db.collection('events');

    // For now, use the simplest possible query to avoid index issues
    // Just get all events and filter client-side
    query = query.orderBy('createdAt', 'desc');

    // Apply pagination
    query = query.limit(parseInt(limit) * 2); // Get more to account for client-side filtering

    const snapshot = await query.get();
    let events = [];

    for (const doc of snapshot.docs) {
      const eventData = doc.data();
      
      // Check if user has liked this event
      let userHasLiked = false;
      if (userId) {
        try {
          const likeDoc = await db.collection('like_event').doc(`${doc.id}_${userId}`).get();
          userHasLiked = likeDoc.exists;
        } catch (error) {
          console.error('Error checking like status:', error);
        }
      }
      
      // Get creator info
      let creator = null;
      if (eventData.userId) {
        try {
          const userDoc = await db.collection('users').doc(eventData.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            creator = {
              id: eventData.userId,
              name: userData.displayName || userData.firstName || 'Anonymous',
              avatar: userData.avatar || null
            };
          }
        } catch (error) {
          console.error('Error fetching creator info:', error);
        }
      }

      events.push({
        id: doc.id,
        ...eventData,
        creator,
        userHasLiked,
        likesCount: eventData.likes || 0,
        commentCount: eventData.comments || 0,
        createdAt: eventData.createdAt?.toDate?.()?.toISOString() || eventData.createdAt
      });
    }

    // Apply client-side filtering (since we simplified DB query)
    // Filter by campus
    if (campusId) {
      events = events.filter(event => event.campusId === campusId);
    }

    // Filter by location
    if (location && location !== 'all') {
      events = events.filter(event => event.location === location);
    }

    // Filter for upcoming events
    if (upcoming === 'true') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      events = events.filter(event => event.date >= today);
    }

    // Sort events client-side
    if (sortBy === 'date') {
      events.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    // Apply pagination after filtering
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedEvents = events.slice(startIndex, endIndex);

    res.json({
      success: true,
      events: paginatedEvents,
      hasMore: endIndex < events.length,
      total: events.length
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
});

// Get single event
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.query; // Get userId from query params
    
    const db = getFirestore();
    const doc = await db.collection('events').doc(eventId).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const eventData = doc.data();
    
    // Check if user has liked this event
    let userHasLiked = false;
    if (userId) {
      const likeDoc = await db.collection('like_event').doc(`${eventId}_${userId}`).get();
      userHasLiked = likeDoc.exists;
    }
    
    // Get creator info
    let creator = null;
    if (eventData.userId) {
      try {
        const userDoc = await db.collection('users').doc(eventData.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          creator = {
            id: eventData.userId,
            name: userData.displayName || userData.firstName || 'Anonymous',
            avatar: userData.avatar || null
          };
        }
      } catch (error) {
        console.error('Error fetching creator info:', error);
      }
    }

    res.json({
      success: true,
      event: {
        id: doc.id,
        ...eventData,
        creator,
        userHasLiked,
        likesCount: eventData.likes || 0,
        commentsCount: eventData.comments || 0,
        createdAt: eventData.createdAt?.toDate?.()?.toISOString() || eventData.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event'
    });
  }
});

// Create new event (auth required)
router.post('/', requireAuth, upload.single('poster'), async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      eventType,
      targetAudience,
      userRole,
      hostingDepartment,
      stream,
      campusId,
      userId,
      isAnonymous
    } = req.body;

    // Validate required fields
    if (!title || !date || !startTime || !endTime || !location || !campusId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, date, startTime, endTime, location, campusId'
      });
    }

    // Validate date is not in the past
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Event date cannot be in the past'
      });
    }

    // Create event document structure
    const db = getFirestore();
    const eventData = {
      title,
      description: description || '',
      date,
      startTime,
      endTime,
      location,
      eventType,
      targetAudience,
      userRole,
      hostingDepartment,
      stream,
      campusId,
      userId: isAnonymous === 'true' ? null : userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Handle poster upload if provided
    if (req.file) {
      try {
        // Validate the poster image
        if (!storageService.validateImage(req.file.buffer, req.file.mimetype)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid poster image file or file too large (max 800KB)'
          });
        }

        // Convert to Base64 and store with event
        const posterData = storageService.convertToBase64(
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname
        );
        
        eventData.posterData = posterData.imageData; // Data URL format
        eventData.posterMetadata = {
          mimeType: posterData.mimeType,
          originalName: posterData.originalName,
          size: posterData.size,
          uploadedAt: posterData.uploadedAt
        };
        eventData.hasPoster = true;
      } catch (uploadError) {
        console.error('Failed to process poster:', uploadError);
        return res.status(400).json({
          success: false,
          error: uploadError.message || 'Failed to process poster'
        });
      }
    }

    const docRef = await db.collection('events').add(eventData);

    // Award reputation for event creation based on user role
    if (eventData.userId) {
      try {
        // Check if user is a demo user
        const isDemoUser = (userId) => {
          return userId.startsWith('demo-') || userId.includes('demo');
        };
        
        if (!isDemoUser(eventData.userId)) {
          const userRef = db.collection('users').doc(eventData.userId);
          const userDoc = await userRef.get();
          
          if (userDoc.exists) {
            const currentReputation = userDoc.data().reputation || 0;
            const currentPostCount = userDoc.data().postCount || 0;
            
            // Determine reputation bonus based on role (default to organizer if not specified)
            const userRole = req.body.userRole || 'organizer';
            const reputationBonus = userRole === 'organizer' ? 10 : 5; // organizer: +10, volunteer: +5
            const currentEventCount = userDoc.data().eventCount || 0;
            
            await userRef.update({
              reputation: currentReputation + reputationBonus,
              postCount: currentPostCount + 1,
              eventCount: currentEventCount + 1,
              lastActive: new Date()
            });
            // Emit user update via WebSocket
            if (req.app.get('io')) {
              req.app.get('io').emit('user_updated', {
                userId: eventData.userId,
                reputation: currentReputation + reputationBonus,
                postCount: currentPostCount + 1,
                eventCount: currentEventCount + 1
              });
            }
          }
        }
      } catch (reputationError) {
        console.error('Error updating reputation for event creation:', reputationError);
        // Don't fail the event creation if reputation update fails
      }
    }

    // Get the created event with creator info
    let creator = null;
    if (eventData.userId) {
      try {
        const userDoc = await db.collection('users').doc(eventData.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          creator = {
            id: eventData.userId,
            name: userData.displayName || userData.firstName || 'Anonymous',
            avatar: userData.avatar || null
          };
        }
      } catch (error) {
        console.error('Error fetching creator info:', error);
      }
    }

    const newEvent = {
      id: docRef.id,
      ...eventData,
      creator,
      createdAt: eventData.createdAt.toISOString()
    };

    // Emit real-time event_created to campus room — mirrors post_created pattern
    if (req.app.get('io')) {
      req.app.get('io').to(`campus_${campusId}`).emit('event_created', newEvent);
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: newEvent
    });

  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create event'
    });
  }
});

// Update event
router.put('/:eventId', requireAuth, upload.single('poster'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    const db = getFirestore();
    // Get existing event
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const existingEvent = eventDoc.data();

    // Check if user owns the event
    if (existingEvent.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own events'
      });
    }

    const {
      title,
      description,
      date,
      startTime,
      endTime,
      location
    } = req.body;

    // Handle poster upload if provided
    let posterUrl = existingEvent.poster;
    if (req.file) {
      try {
        const bucket = admin.storage().bucket();
        const fileName = `events/${Date.now()}-${req.file.originalname}`;
        const file = bucket.file(fileName);

        const stream = file.createWriteStream({
          metadata: {
            contentType: req.file.mimetype,
          },
        });

        await new Promise((resolve, reject) => {
          stream.on('error', reject);
          stream.on('finish', resolve);
          stream.end(req.file.buffer);
        });

        await file.makePublic();
        posterUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      } catch (uploadError) {
        console.error('Error uploading poster:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload poster'
        });
      }
    }

    // Update event data
    const updateData = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(date && { date }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(location && { location }),
      poster: posterUrl,
      updatedAt: new Date()
    };

    await db.collection('events').doc(eventId).update(updateData);

    res.json({
      success: true,
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update event'
    });
  }
});

// Delete event
router.delete('/:eventId', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    const db = getFirestore();
    // Get existing event
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const existingEvent = eventDoc.data();

    // Check if user owns the event
    if (existingEvent.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own events'
      });
    }

    // Use a transaction to ensure all related data is deleted atomically
    await db.runTransaction(async (transaction) => {
      // Delete the event
      transaction.delete(db.collection('events').doc(eventId));

      // Get and delete all likes for this event
      const likesSnapshot = await db.collection('like_event')
        .where('eventId', '==', eventId)
        .get();
      
      likesSnapshot.forEach(likeDoc => {
        transaction.delete(likeDoc.ref);
      });

      // Get and delete all comments for this event
      const commentsSnapshot = await db.collection('comment_event')
        .where('eventId', '==', eventId)
        .get();
      
      commentsSnapshot.forEach(commentDoc => {
        transaction.delete(commentDoc.ref);
      });

      console.log(`🗑️ Event deletion: Deleted event ${eventId} with ${likesSnapshot.size} likes and ${commentsSnapshot.size} comments`);
    });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete event'
    });
  }
});

// POST /api/events/:eventId/report (auth required)
router.post('/:eventId/report', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const { eventId } = req.params;
    const { reportedBy, reason, description } = req.body;

    if (!reportedBy || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Reporter ID and reason are required'
      });
    }

    // Check if event exists
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check if user has already reported this event
    const existingReport = await db.collection('event_reports')
      .where('eventId', '==', eventId)
      .where('reportedBy', '==', reportedBy)
      .get();

    if (!existingReport.empty) {
      return res.status(400).json({
        success: false,
        error: 'You have already reported this event'
      });
    }

    const reportData = {
      eventId: eventId,
      reportedBy,
      reason,
      description: description || '',
      status: 'pending',
      createdAt: new Date(),
      // Store event details for admin review
      eventDetails: {
        title: eventDoc.data().title,
        description: eventDoc.data().description,
        date: eventDoc.data().date,
        startTime: eventDoc.data().startTime,
        endTime: eventDoc.data().endTime,
        location: eventDoc.data().location,
        userId: eventDoc.data().userId,
        creator: eventDoc.data().creator
      }
    };

    await db.collection('event_reports').add(reportData);

    res.json({
      success: true,
      message: 'Event reported successfully'
    });

  } catch (error) {
    console.error('Error reporting event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to report event'
    });
  }
});

// Like/Unlike event (auth required)
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { userId } = req.body;

    const eventRef = db.collection('events').doc(id);
    const likeRef = db.collection('like_event').doc(`${id}_${userId}`);

    const result = await db.runTransaction(async (transaction) => {
      // ALL READS MUST HAPPEN FIRST
      const eventDoc = await transaction.get(eventRef);
      const likeDoc = await transaction.get(likeRef);

      if (!eventDoc.exists) {
        throw new Error('Event not found');
      }

      const eventData = eventDoc.data();
      
      // Pre-read author document if we might need it
      let authorDoc = null;
      let authorRef = null;
      if (eventData.userId && eventData.userId !== userId) {
        const isDemoUser = (userId) => {
          return userId.startsWith('demo-') || userId.includes('demo');
        };
        
        if (!isDemoUser(eventData.userId)) {
          authorRef = db.collection('users').doc(eventData.userId);
          authorDoc = await transaction.get(authorRef);
        }
      }

      // NOW PROCESS THE LIKE LOGIC
      let likes = eventData.likes || 0;
      let reputationChange = 0; // Track reputation changes for event author
      let isLiked = false;

      if (likeDoc.exists) {
        // Unlike - remove the like
        likes--;
        transaction.delete(likeRef);
        isLiked = false;
        // No reputation change when removing like (reputation never decreases)
      } else {
        // Like - add the like
        likes++;
        reputationChange = +1; // Give reputation for new like
        isLiked = true;
        transaction.set(likeRef, {
          eventId: id,
          userId,
          createdAt: new Date()
        });
      }

      // Update event like count
      transaction.update(eventRef, {
        likes,
        updatedAt: new Date()
      });

      // Update author's reputation if there's a positive change and we have the author doc
      if (reputationChange > 0 && authorDoc && authorDoc.exists) {
        const authorData = authorDoc.data();
        const currentReputation = authorData.reputation || 0;
        const newReputation = currentReputation + reputationChange;
        
        transaction.update(authorRef, {
          reputation: newReputation,
          updatedAt: new Date()
        });
      }

      return { likes, isLiked, reputationChange };
    });

    res.json({
      success: true,
      likes: result.likes,
      isLiked: result.isLiked,
      message: result.isLiked ? 'Event liked successfully' : 'Event unliked successfully'
    });

  } catch (error) {
    console.error('Error toggling event like:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to toggle like'
    });
  }
});

// GET /api/events/:id/comments - Get comments for an event
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getFirestore();

    const commentsSnapshot = await db.collection('comment_event')
      .where('eventId', '==', id)
      .get();

    const comments = [];
    commentsSnapshot.forEach(doc => {
      comments.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
      });
    });

    comments.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA; // Most recent first
    });

    res.json({
      success: true,
      comments,
      total: comments.length
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
});

// POST /api/events/:id/comments (auth required)
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, userId, isAnonymous = false } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }

    if (!isAnonymous && !userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required for non-anonymous comments'
      });
    }

    const db = getFirestore();
    
    // Check if event exists
    const eventRef = db.collection('events').doc(id);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Get user info if not anonymous
    let userName = 'Anonymous';
    if (!isAnonymous && userId) {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          userName = userData.displayName || userData.firstName || 'Anonymous';
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }

    const commentData = {
      eventId: id,
      content: content.trim(),
      userId: isAnonymous ? null : userId,
      userName: isAnonymous ? 'Anonymous' : userName,
      isAnonymous,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const commentRef = await db.collection('comment_event').add(commentData);

    // Update event comment count and award reputation to event author
    const eventData = eventDoc.data();
    const currentComments = eventData.comments || 0;
    
    // Award reputation to event author for receiving a comment (if not anonymous and not self-comment)
    if (!isAnonymous && userId && eventData.userId && eventData.userId !== userId) {
      const isDemoUser = (userId) => {
        return userId.startsWith('demo-') || userId.includes('demo');
      };
      
      if (!isDemoUser(eventData.userId)) {
        try {
          const authorRef = db.collection('users').doc(eventData.userId);
          const authorDoc = await authorRef.get();
          
          if (authorDoc.exists) {
            const authorData = authorDoc.data();
            const currentReputation = authorData.reputation || 0;
            const newReputation = currentReputation + 1; // +1 reputation for receiving a comment
            
            await authorRef.update({
              reputation: newReputation,
              updatedAt: new Date()
            });
            
            console.log(`📈 Event comment: Awarded +1 reputation to event author ${eventData.userId}: ${currentReputation} -> ${newReputation}`);
          }
        } catch (error) {
          console.error('Error updating author reputation for comment:', error);
        }
      } else {
        console.log(`🚫 Demo user ${eventData.userId} - no reputation awarded for comment`);
      }
    }

    await eventRef.update({
      comments: currentComments + 1,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      comment: {
        id: commentRef.id,
        ...commentData,
        createdAt: commentData.createdAt.toISOString()
      },
      message: 'Comment added successfully'
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
});

// DELETE /api/events/:eventId/comments/:commentId (auth required)
router.delete('/:eventId/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const { eventId, commentId } = req.params;
    const { userId } = req.body;

    const db = getFirestore();
    const commentDoc = await db.collection('comment_event').doc(commentId).get();

    if (!commentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    const commentData = commentDoc.data();

    // Check if user owns the comment or is admin
    if (!userId || (commentData.userId !== userId)) {
      // Allow deletion if user is admin (implement admin check here if needed)
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;
      
      if (!userData || userData.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'You can only delete your own comments'
        });
      }
    }

    // Delete the comment
    await db.collection('comment_event').doc(commentId).delete();

    // Update event comment count
    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (eventDoc.exists) {
      const eventData = eventDoc.data();
      const currentComments = Math.max((eventData.comments || 1) - 1, 0);
      await eventRef.update({
        comments: currentComments,
        updatedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
});

module.exports = router;
