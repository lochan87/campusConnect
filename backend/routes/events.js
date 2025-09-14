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
      upcoming = true 
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
    
    const db = getFirestore();
    const doc = await db.collection('events').doc(eventId).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const eventData = doc.data();
    
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

// Create new event
router.post('/', upload.single('poster'), async (req, res) => {
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
        console.log('Processing poster upload...');
        
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
        
        console.log(`Poster processed successfully: ${posterData.size} bytes`);
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
            console.log(`📈 Event creation: User ${eventData.userId} (${userRole}) earned +${reputationBonus} reputation (${currentReputation} → ${currentReputation + reputationBonus}), postCount updated (${currentPostCount} → ${currentPostCount + 1}), eventCount updated (${currentEventCount} → ${currentEventCount + 1})`);
            
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
        } else {
          console.log(`🚫 Demo user ${eventData.userId} - no reputation awarded for event creation`);
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

    await db.collection('events').doc(eventId).delete();

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

// POST /api/events/:eventId/report - Report an event
router.post('/:eventId/report', async (req, res) => {
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

module.exports = router;
