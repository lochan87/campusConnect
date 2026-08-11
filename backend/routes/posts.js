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
      offset = 0,
      userId // Add userId to check vote status
    } = req.query;

    let query = db.collection('posts');

    // For development: Use simple orderBy only (no where + orderBy to avoid index requirements).
    // Fetch a generous batch so client-side filtering has enough records to paginate from.
    const fetchLimit = Math.max(parseInt(limit) * 10, 200);
    query = query.orderBy(sortBy, order).limit(fetchLimit);

    const snapshot = await query.get();
    
    let posts = [];

    // Get user likes for all posts if userId is provided
    let userLikes = {};
    if (userId) {
      const likesSnapshot = await db.collection('like_post')
        .where('userId', '==', userId)
        .get();
      
      likesSnapshot.forEach(likeDoc => {
        const likeData = likeDoc.data();
        userLikes[likeData.postId] = true;
      });
    }

    snapshot.forEach(doc => {
      const postData = doc.data();
      posts.push({
        id: doc.id,
        ...postData,
        createdAt: postData.createdAt?.toDate?.() || postData.createdAt,
        userHasLiked: userId ? userLikes[doc.id] || false : false
      });
    });

    // Apply client-side filters
    if (campusId) {
      posts = posts.filter(post => post.campusId === campusId);
    }
    
    if (category && category !== 'all') {
      posts = posts.filter(post => post.category === category);
    }
    
    if (location && location !== 'all') {
      posts = posts.filter(post => post.location === location);
    }

    // Apply pagination AFTER filtering (avoids double-skip bug)
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
      isAnonymous = 'false',
      tags = [],
      userId,
      userName
    } = req.body;

    // Convert string boolean to actual boolean
    const isAnonymousPost = isAnonymous === 'true' || isAnonymous === true;
    
    console.log('🔍 Post creation debug:', {
      receivedIsAnonymous: isAnonymous,
      typeOfIsAnonymous: typeof isAnonymous,
      convertedIsAnonymousPost: isAnonymousPost,
      userName: userName,
      userId: userId
    });

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
      isAnonymous: isAnonymousPost,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',') : []),
      userId: userId, // Store userId even for anonymous posts (for deletion rights)
      displayUserId: isAnonymousPost ? null : userId, // Only show userId if not anonymous
      userName: isAnonymousPost ? 'Anonymous' : userName,
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

    // Award reputation for post creation (+5 points)
    if (!isAnonymousPost && userId) {
      try {
        // Check if user is a demo user
        const isDemoUser = (userId) => {
          return userId.startsWith('demo-') || userId.includes('demo');
        };
        
        if (!isDemoUser(userId)) {
          const userRef = db.collection('users').doc(userId);
          const userDoc = await userRef.get();
          
          if (userDoc.exists) {
            const currentReputation = userDoc.data().reputation || 0;
            const currentPostCount = userDoc.data().postCount || 0;
            await userRef.update({
              reputation: currentReputation + 5,
              postCount: currentPostCount + 1,
              lastActive: new Date()
            });
            console.log(`📈 Post creation: User ${userId} earned +5 reputation (${currentReputation} → ${currentReputation + 5}) and postCount updated (${currentPostCount} → ${currentPostCount + 1})`);
            
            // Emit user update via WebSocket
            if (req.app.get('io')) {
              req.app.get('io').emit('user_updated', {
                userId,
                reputation: currentReputation + 5,
                postCount: currentPostCount + 1
              });
            }
          }
        } else {
          console.log(`🚫 Demo user ${userId} - no reputation awarded for post creation`);
        }
      } catch (reputationError) {
        console.error('Error updating reputation for post creation:', reputationError);
        // Don't fail the post creation if reputation update fails
      }
    }

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
    const { userId } = req.query; // Get userId from query params

    const doc = await db.collection('posts').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const postData = doc.data();
    let userHasLiked = false;

    // Check if user has liked this post (uses same collection as the like/unlike route)
    if (userId) {
      const likeDoc = await db.collection('like_post').doc(`${id}_${userId}`).get();
      userHasLiked = likeDoc.exists;
    }

    const post = {
      id: doc.id,
      ...postData,
      createdAt: postData.createdAt?.toDate?.() || postData.createdAt,
      userHasLiked
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

// POST /api/posts/:id/like - Like/unlike a post
router.post('/:id/like', async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { userId } = req.body;

    const postRef = db.collection('posts').doc(id);
    const likeRef = db.collection('like_post').doc(`${id}_${userId}`);

    const result = await db.runTransaction(async (transaction) => {
      // ALL READS MUST HAPPEN FIRST
      const postDoc = await transaction.get(postRef);
      const likeDoc = await transaction.get(likeRef);

      if (!postDoc.exists) {
        throw new Error('Post not found');
      }

      const postData = postDoc.data();
      
      // Pre-read author document if we might need it
      let authorDoc = null;
      let authorRef = null;
      if (postData.userId && postData.userId !== userId) {
        const isDemoUser = (userId) => {
          return userId.startsWith('demo-') || userId.includes('demo');
        };
        
        if (!isDemoUser(postData.userId)) {
          authorRef = db.collection('users').doc(postData.userId);
          authorDoc = await transaction.get(authorRef);
        }
      }

      // NOW PROCESS THE LIKE LOGIC
      let likes = postData.likes || 0;
      let reputationChange = 0; // Track reputation changes for post author
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
          postId: id,
          userId,
          createdAt: new Date()
        });
      }

      // Update post like count
      transaction.update(postRef, {
        likes,
        updatedAt: new Date()
      });

      // Update author's reputation if there's a positive change and we have the author doc
      if (reputationChange > 0 && authorDoc && authorDoc.exists) {
        const authorData = authorDoc.data();
        const newReputation = (authorData.reputation || 0) + reputationChange;
        
        console.log(`📈 Updating reputation for user ${postData.userId}: ${authorData.reputation || 0} + ${reputationChange} = ${newReputation}`);
        
        transaction.update(authorRef, {
          reputation: newReputation,
          lastActive: new Date()
        });
      } else if (reputationChange > 0 && postData.userId && postData.userId !== userId) {
        console.log(`🚫 Demo user ${postData.userId} - no reputation awarded for like`);
      }

      return { likes, reputationChange, isLiked };
    });

    // Use the transaction result for consistency
    const userHasLiked = result.isLiked;

    // Log like/unlike operation
    console.log(`${userHasLiked ? '👍' : '👎'} Post ${id} ${userHasLiked ? 'liked' : 'unliked'} by user ${userId}. New like count: ${result.likes}`);

    // Log reputation changes
    if (result.reputationChange > 0) {
      console.log(`✨ Reputation +${result.reputationChange} awarded to post author for like`);
    }

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('post_liked', {
        postId: id,
        likes: result.likes,
        userHasLiked
      });
    }

    res.json({
      success: true,
      likes: result.likes,
      userHasLiked,
      reputationChange: result.reputationChange
    });

  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like post'
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
    
    // Log the received data for debugging
    console.log('Edit post request body:', req.body);
    console.log('Edit post request file:', req.file);
    
    const { title, content, category, location, userId } = req.body;
    
    // Validate required fields
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    if (!category || category.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Category is required'
      });
    }

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
      title: title?.trim() || '',
      content: content.trim(),
      category: category.trim(),
      location: location?.trim() || '',
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

    // Use a transaction to ensure all related data is deleted atomically
    await db.runTransaction(async (transaction) => {
      // Delete the post
      transaction.delete(db.collection('posts').doc(id));

      // Get and delete all likes for this post
      const likesSnapshot = await db.collection('like_post')
        .where('postId', '==', id)
        .get();
      
      likesSnapshot.forEach(likeDoc => {
        transaction.delete(likeDoc.ref);
      });

      // Get and delete all comments for this post
      const commentsSnapshot = await db.collection('comment_post')
        .where('postId', '==', id)
        .get();
      
      commentsSnapshot.forEach(commentDoc => {
        transaction.delete(commentDoc.ref);
      });

      console.log(`🗑️ Post deletion: Deleted post ${id} with ${likesSnapshot.size} likes and ${commentsSnapshot.size} comments`);
    });

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

    const commentsSnapshot = await db.collection('comment_post')
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

    const commentRef = await db.collection('comment_post').add(commentData);
    
    // Update post comment count and award reputation to post author
    const postData = postDoc.data();
    const newCommentCount = (postData.commentCount || 0) + 1;
    
    // Award reputation to post author for receiving a comment (if not anonymous and not self-comment)
    if (!isAnonymous && userId && postData.userId && postData.userId !== userId) {
      const isDemoUser = (userId) => {
        return userId.startsWith('demo-') || userId.includes('demo');
      };
      
      if (!isDemoUser(postData.userId)) {
        try {
          const authorRef = db.collection('users').doc(postData.userId);
          const authorDoc = await authorRef.get();
          
          if (authorDoc.exists) {
            const authorData = authorDoc.data();
            const currentReputation = authorData.reputation || 0;
            const newReputation = currentReputation + 1; // +1 reputation for receiving a comment
            
            await authorRef.update({
              reputation: newReputation,
              lastActive: new Date()
            });
            
            console.log(`📈 Post comment: Awarded +1 reputation to post author ${postData.userId}: ${currentReputation} -> ${newReputation}`);
          }
        } catch (error) {
          console.error('Error updating author reputation for comment:', error);
        }
      } else {
        console.log(`🚫 Demo user ${postData.userId} - no reputation awarded for comment`);
      }
    }
    
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

    const commentDoc = await db.collection('comment_post').doc(commentId).get();

    if (!commentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    const commentData = commentDoc.data();

    // Get the post to check if user is the post owner
    const postDoc = await db.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const postData = postDoc.data();
    const isPostOwner = postData.userId === userId;
    const isCommentAuthor = !commentData.isAnonymous && commentData.userId === userId;

    // Check if user is the comment author OR the post owner
    if (!isCommentAuthor && !isPostOwner) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
    }

    // Log the deletion action
    if (isPostOwner && !isCommentAuthor) {
      console.log(`🗑️ Post owner (${userId}) deleted comment (${commentId}) on post (${postId}) by ${commentData.isAnonymous ? 'Anonymous' : commentData.userId}`);
    } else if (isCommentAuthor) {
      console.log(`🗑️ Comment author (${userId}) deleted their own comment (${commentId}) on post (${postId})`);
    }

    await db.collection('comment_post').doc(commentId).delete();

    // Update post comment count
    if (postDoc.exists) {
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

// POST /api/posts/:id/report - Report a post
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

    // Check if post exists
    const postDoc = await db.collection('posts').doc(id).get();
    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if user has already reported this post
    const existingReport = await db.collection('post_reports')
      .where('postId', '==', id)
      .where('reportedBy', '==', reportedBy)
      .get();

    if (!existingReport.empty) {
      return res.status(400).json({
        success: false,
        error: 'You have already reported this post'
      });
    }

    const reportData = {
      postId: id,
      reportedBy,
      reason,
      description: description || '',
      status: 'pending',
      createdAt: new Date(),
      // Store post details for admin review
      postDetails: {
        title: postDoc.data().title,
        content: postDoc.data().content,
        category: postDoc.data().category,
        userId: postDoc.data().userId,
        userName: postDoc.data().userName,
        isAnonymous: postDoc.data().isAnonymous
      }
    };

    await db.collection('post_reports').add(reportData);

    res.json({
      success: true,
      message: 'Post reported successfully'
    });

  } catch (error) {
    console.error('Error reporting post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to report post'
    });
  }
});

module.exports = router;
