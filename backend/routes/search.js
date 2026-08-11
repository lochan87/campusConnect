const express = require('express');
const { getFirestore } = require('../config/firebase');
const router = express.Router();

/**
 * GET /api/search
 * Query params:
 *   q        {string}  - search term (min 2 chars)
 *   campusId {string}  - campus scope (required)
 *   types    {string}  - comma-separated: "posts,polls,events" (default: all)
 *   limit    {number}  - max results per type (default: 15)
 */
router.get('/', async (req, res) => {
  try {
    const db = getFirestore();
    const { q, campusId, types = 'posts,polls,events', limit = 15 } = req.query;

    // Validate query
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    if (!campusId) {
      return res.status(400).json({
        success: false,
        error: 'Campus ID is required'
      });
    }

    const searchTerm = q.trim().toLowerCase();
    const typeList = types.split(',').map(t => t.trim()).filter(Boolean);
    const perTypeLimit = Math.min(parseInt(limit) || 15, 50);

    // Fetch batch size: fetch more than needed so filtering has enough to work with
    const fetchLimit = perTypeLimit * 15;

    const results = { posts: [], polls: [], events: [] };
    const queries = [];

    // --- Posts search ---
    if (typeList.includes('posts')) {
      queries.push(
        db.collection('posts')
          .orderBy('createdAt', 'desc')
          .limit(fetchLimit)
          .get()
          .then(snapshot => {
            snapshot.forEach(doc => {
              const d = doc.data();
              if (d.campusId !== campusId) return;
              const haystack = `${d.title || ''} ${d.content || ''} ${d.category || ''}`.toLowerCase();
              if (haystack.includes(searchTerm)) {
                results.posts.push({
                  id: doc.id,
                  type: 'post',
                  title: d.title || '',
                  content: d.content ? d.content.substring(0, 150) : '',
                  category: d.category || '',
                  location: d.location || '',
                  userName: d.isAnonymous ? 'Anonymous' : (d.userName || ''),
                  likeCount: d.likeCount || 0,
                  commentCount: d.commentCount || 0,
                  createdAt: d.createdAt?.toDate?.() || d.createdAt,
                  hasImage: !!d.imageUrl
                });
              }
            });
          })
      );
    }

    // --- Polls search ---
    if (typeList.includes('polls')) {
      queries.push(
        db.collection('polls')
          .orderBy('createdAt', 'desc')
          .limit(fetchLimit)
          .get()
          .then(snapshot => {
            snapshot.forEach(doc => {
              const d = doc.data();
              if (d.campusId !== campusId) return;
              const haystack = `${d.question || ''} ${d.description || ''}`.toLowerCase();
              if (haystack.includes(searchTerm)) {
                results.polls.push({
                  id: doc.id,
                  type: 'poll',
                  question: d.question || '',
                  description: d.description ? d.description.substring(0, 150) : '',
                  totalVotes: d.totalVotes || 0,
                  isActive: d.isActive !== false,
                  userName: d.isAnonymous ? 'Anonymous' : (d.userName || ''),
                  createdAt: d.createdAt?.toDate?.() || d.createdAt,
                  expiresAt: d.expiresAt?.toDate?.() || d.expiresAt
                });
              }
            });
          })
      );
    }

    // --- Events search ---
    if (typeList.includes('events')) {
      queries.push(
        db.collection('events')
          .orderBy('createdAt', 'desc')
          .limit(fetchLimit)
          .get()
          .then(snapshot => {
            snapshot.forEach(doc => {
              const d = doc.data();
              if (d.campusId !== campusId) return;
              const haystack = `${d.title || ''} ${d.description || ''} ${d.location || ''}`.toLowerCase();
              if (haystack.includes(searchTerm)) {
                results.events.push({
                  id: doc.id,
                  type: 'event',
                  title: d.title || '',
                  description: d.description ? d.description.substring(0, 150) : '',
                  location: d.location || '',
                  eventDate: d.eventDate?.toDate?.() || d.eventDate,
                  userName: d.userName || '',
                  likeCount: d.likeCount || 0,
                  createdAt: d.createdAt?.toDate?.() || d.createdAt,
                  hasImage: !!d.imageUrl
                });
              }
            });
          })
      );
    }

    // Run all collection queries in parallel
    await Promise.all(queries);

    // Apply per-type limit after filtering
    results.posts = results.posts.slice(0, perTypeLimit);
    results.polls = results.polls.slice(0, perTypeLimit);
    results.events = results.events.slice(0, perTypeLimit);

    const total = results.posts.length + results.polls.length + results.events.length;

    res.json({
      success: true,
      query: q.trim(),
      campusId,
      total,
      results
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed — please try again'
    });
  }
});

module.exports = router;
