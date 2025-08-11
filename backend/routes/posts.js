const express = require('express');
const multer = require('multer');
const path = require('path');
const { getFirestore } = require('../config/firebase');
const geminiService = require('../services/geminiService');
const imageService = require('../services/storageService');
const { validatePost } = require('../middleware/validation');
const router = express.Router();

// Configure multer for image uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for Firebase upload
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// GET /api/posts - Get all posts with filters
router.get('/', async (req, res) => {
  try {
    const db = getFirestore();
    const {
      category,
      location,
      campusId,
      sortBy = 'createdAt',
      order = 'desc',
      limit = 50,
      offset = 0
    } = req.query;

    let query = db.collection('posts');

    // For development: Use only simple queries to avoid index requirements
    // Apply sorting only (no where + orderBy combination)
    query = query.orderBy(sortBy, order);

    // Apply pagination
    if (offset > 0) {
      const offsetSnapshot = await query.limit(parseInt(offset)).get();
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }

    query = query.limit(parseInt(limit));

    const snapshot = await query.get();
    
    let posts = [];

    snapshot.forEach(doc => {
      posts.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      });
    });

    // Apply ALL filtering client-side for development
    if (campusId) {
      posts = posts.filter(post => post.campusId === campusId);
    }
    
    if (category && category !== 'all') {
      posts = posts.filter(post => post.category === category);
    }
    
    if (location && location !== 'all') {
      posts = posts.filter(post => post.location === location);
    }

    // Apply pagination after filtering
    const startIndex = parseInt(offset) || 0;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPosts = posts.slice(startIndex, endIndex);

    res.json({
      success: true,
      posts: paginatedPosts,
      total: posts.length,
      hasMore: endIndex < posts.length
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts'
    });
  }
});

// POST /api/posts - Create a new post
router.post('/', upload.single('image'), validatePost, async (req, res) => {
  try {
    const db = getFirestore();
    
    const {
      title,
      content,
      category,
      location,
      campusId,
      isAnonymous = false,
      tags = [],
      userId,
      userName
    } = req.body;

    // Moderate content using Gemini AI
    const moderation = await geminiService.moderateContent(content);
    
    if (!moderation.isAppropriate && moderation.severity === 'high') {
      return res.status(400).json({
        success: false,
        error: 'Content violates community guidelines',
        concerns: moderation.concerns
      });
    }

    const postData = {
      title: title || '',
      content,
      category,
      location: location || '',
      campusId,
      isAnonymous: Boolean(isAnonymous),
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',') : []),
      userId: userId, // Store userId even for anonymous posts (for deletion rights)
      displayUserId: isAnonymous ? null : userId, // Only show userId if not anonymous
      userName: isAnonymous ? 'Anonymous' : userName,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      moderation: {
        isReviewed: moderation.severity === 'low',
        concerns: moderation.concerns,
        severity: moderation.severity
      }
    };

    // Handle image upload if present
    if (req.file) {
      try {
        console.log('Processing image upload...');
        
        // Validate the image
        if (!imageService.validateImage(req.file.buffer, req.file.mimetype)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid image file or file too large (max 800KB)'
          });
        }

        // Convert to Base64 and store with post
        const imageData = imageService.convertToBase64(
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname
        );
        
        postData.imageData = imageData.imageData; // Data URL format
        postData.imageMetadata = {
          mimeType: imageData.mimeType,
          originalName: imageData.originalName,
          size: imageData.size,
          uploadedAt: imageData.uploadedAt
        };
        postData.hasImage = true;
        
        console.log(`Image processed successfully: ${imageData.size} bytes`);
      } catch (uploadError) {
        console.error('Failed to process image:', uploadError);
        return res.status(400).json({
          success: false,
          error: uploadError.message || 'Failed to process image'
        });
      }
    }

    const docRef = await db.collection('posts').add(postData);
    
    const newPost = {
      id: docRef.id,
      ...postData
    };

    // Emit real-time update via WebSocket
    if (req.app.get('io')) {
      req.app.get('io').to(`campus_${campusId}`).emit('post_created', newPost);
      if (location) {
        req.app.get('io').to(`location_${location}`).emit('post_created', newPost);
      }
    }

    res.status(201).json({
      success: true,
      post: newPost,
      message: 'Post created successfully'
    });

  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post'
    });
  }
});

// GET /api/posts/:id - Get a specific post
router.get('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;

    const doc = await db.collection('posts').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const post = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    };

    res.json({
      success: true,
      post
    });

  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post'
    });
  }
});

// POST /api/posts/:id/vote - Vote on a post (upvote/downvote)
router.post('/:id/vote', async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { type, userId } = req.body; // type: 'up' or 'down'

    if (!['up', 'down'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote type'
      });
    }

    const postRef = db.collection('posts').doc(id);
    const voteRef = db.collection('votes').doc(`${id}_${userId}`);

    const result = await db.runTransaction(async (transaction) => {
      const postDoc = await transaction.get(postRef);
      const voteDoc = await transaction.get(voteRef);

      if (!postDoc.exists) {
        throw new Error('Post not found');
      }

      const postData = postDoc.data();
      let upvotes = postData.upvotes || 0;
      let downvotes = postData.downvotes || 0;

      if (voteDoc.exists) {
        const existingVote = voteDoc.data();
        
        // Remove existing vote
        if (existingVote.type === 'up') {
          upvotes--;
        } else {
          downvotes--;
        }

        // If same vote type, remove vote; otherwise, add new vote
        if (existingVote.type === type) {
          transaction.delete(voteRef);
        } else {
          if (type === 'up') {
            upvotes++;
          } else {
            downvotes++;
          }
          transaction.update(voteRef, { type, updatedAt: new Date() });
        }
      } else {
        // New vote
        if (type === 'up') {
          upvotes++;
        } else {
          downvotes++;
        }
        transaction.set(voteRef, {
          postId: id,
          userId,
          type,
          createdAt: new Date()
        });
      }

      transaction.update(postRef, {
        upvotes,
        downvotes,
        updatedAt: new Date()
      });

      return { upvotes, downvotes };
    });

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('post_voted', {
        postId: id,
        upvotes: result.upvotes,
        downvotes: result.downvotes
      });
    }

    res.json({
      success: true,
      upvotes: result.upvotes,
      downvotes: result.downvotes
    });

  } catch (error) {
    console.error('Error voting on post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to vote on post'
    });
  }
});

// GET /api/posts/summary/events - Get AI-generated event summary
router.get('/summary/events', async (req, res) => {
  try {
    const db = getFirestore();
    const { campusId } = req.query;

    let query = db.collection('posts').where('category', '==', 'events');
    
    if (campusId) {
      query = query.where('campusId', '==', campusId);
    }

    // Get recent events (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    query = query.where('createdAt', '>=', weekAgo);

    const snapshot = await query.get();
    const eventPosts = [];

    snapshot.forEach(doc => {
      eventPosts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    const summary = await geminiService.generateEventSummary(eventPosts);

    res.json({
      success: true,
      summary,
      eventCount: eventPosts.length
    });

  } catch (error) {
    console.error('Error generating event summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate event summary'
    });
  }
});

// PUT /api/posts/:id - Edit a post (author only)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { title, content, category, location, userId } = req.body;

    const postDoc = await db.collection('posts').doc(id).get();

    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const postData = postDoc.data();

    // Check if user is the author (unless post is anonymous)
    if (!postData.isAnonymous && postData.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to edit this post'
      });
    }

    // Moderate content using Gemini AI
    const moderation = await geminiService.moderateContent(content);
    
    if (!moderation.isAppropriate && moderation.severity === 'high') {
      return res.status(400).json({
        success: false,
        error: 'Content violates community guidelines',
        concerns: moderation.concerns
      });
    }

    const updateData = {
      title: title || '',
      content,
      category,
      location: location || '',
      updatedAt: new Date(),
      moderation: {
        isReviewed: moderation.severity === 'low',
        concerns: moderation.concerns,
        severity: moderation.severity
      }
    };

    // Handle image upload if present
    if (req.file) {
      updateData.imageUrl = `/uploads/${Date.now()}_${req.file.originalname}`;
      updateData.hasImage = true;
    }

    await db.collection('posts').doc(id).update(updateData);

    const updatedPost = {
      id,
      ...postData,
      ...updateData
    };

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('post_updated', updatedPost);
    }

    res.json({
      success: true,
      post: updatedPost,
      message: 'Post updated successfully'
    });

  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post'
    });
  }
});

// DELETE /api/posts/:id - Delete a post (author only)
router.delete('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { userId } = req.body;

    const postDoc = await db.collection('posts').doc(id).get();

    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const postData = postDoc.data();

    // Check if user is the author
    // For anonymous posts, we still check the actual userId for deletion rights
    if (postData.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this post'
      });
    }

    // No need to delete images from external storage since they're stored in the document
    // Image data will be automatically deleted with the post document

    await db.collection('posts').doc(id).delete();

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('post_deleted', { postId: id });
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post'
    });
  }
});

// GET /api/posts/:id/comments - Get comments for a post
router.get('/:id/comments', async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const commentsSnapshot = await db.collection('comments')
      .where('postId', '==', id)
      .limit(parseInt(limit))
      .get();

    const comments = [];
    commentsSnapshot.forEach(doc => {
      comments.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      });
    });

    // Sort by createdAt in memory (temporary fix for missing Firestore index)
    comments.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA; // desc order
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

// POST /api/posts/:id/comments - Add a comment to a post
router.post('/:id/comments', async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { content, userId, userName, isAnonymous = false } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }

    if (!userId && !isAnonymous) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required for non-anonymous comments'
      });
    }

    // Check if post exists
    const postDoc = await db.collection('posts').doc(id).get();
    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Moderate content using Gemini AI
    const moderation = await geminiService.moderateContent(content);
    
    if (!moderation.isAppropriate && moderation.severity === 'high') {
      return res.status(400).json({
        success: false,
        error: 'Comment violates community guidelines',
        concerns: moderation.concerns
      });
    }

    const commentData = {
      postId: id,
      content: content.trim(),
      userId: isAnonymous ? null : userId,
      userName: isAnonymous ? 'Anonymous' : userName,
      isAnonymous: Boolean(isAnonymous),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      likes: 0,
      moderation: {
        isReviewed: moderation.severity === 'low',
        concerns: moderation.concerns,
        severity: moderation.severity
      }
    };

    const commentRef = await db.collection('comments').add(commentData);
    
    // Update post comment count
    const postData = postDoc.data();
    const newCommentCount = (postData.commentCount || 0) + 1;
    
    await db.collection('posts').doc(id).update({
      commentCount: newCommentCount,
      updatedAt: new Date()
    });

    const newComment = {
      id: commentRef.id,
      ...commentData
    };

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('comment_added', {
        postId: id,
        comment: newComment,
        commentCount: newCommentCount
      });
    }

    res.status(201).json({
      success: true,
      comment: newComment,
      message: 'Comment added successfully'
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create comment'
    });
  }
});

// DELETE /api/posts/:postId/comments/:commentId - Delete a comment
router.delete('/:postId/comments/:commentId', async (req, res) => {
  try {
    const db = getFirestore();
    const { postId, commentId } = req.params;
    const { userId } = req.body;

    const commentDoc = await db.collection('comments').doc(commentId).get();

    if (!commentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    const commentData = commentDoc.data();

    // Check if user is the author (unless comment is anonymous)
    if (!commentData.isAnonymous && commentData.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
    }

    await db.collection('comments').doc(commentId).delete();

    // Update post comment count
    const postDoc = await db.collection('posts').doc(postId).get();
    if (postDoc.exists) {
      const postData = postDoc.data();
      const newCommentCount = Math.max((postData.commentCount || 1) - 1, 0);
      
      await db.collection('posts').doc(postId).update({
        commentCount: newCommentCount,
        updatedAt: new Date()
      });

      // Emit real-time update
      if (req.app.get('io')) {
        req.app.get('io').emit('comment_deleted', {
          postId,
          commentId,
          commentCount: newCommentCount
        });
      }
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
