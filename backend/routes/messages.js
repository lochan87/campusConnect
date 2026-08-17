const express = require('express');
const { getFirestore } = require('../config/firebase');
const { requireAuth } = require('../middleware/auth');
const { storageService } = require('../services/storageService');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Multer in-memory storage for image attachments
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// ─────────────────────────────────────────────
// Helper: build a deterministic conversation ID
// ─────────────────────────────────────────────
const buildConvId = (uid1, uid2) => [uid1, uid2].sort().join('_');

// ─────────────────────────────────────────────
// Helper: fetch user public profile (name, avatar, campusId)
// ─────────────────────────────────────────────
const getUserPublic = async (db, uid) => {
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data();
  return {
    uid,
    username: d.username || d.displayName || 'Unknown',
    avatar: d.avatar || d.photoURL || null,
    campusId: d.campusId || null,
    department: d.department || null,
    course: d.course || null,
  };
};

// ─────────────────────────────────────────────
// Helper: ensure requester is a participant
// ─────────────────────────────────────────────
const assertParticipant = (conv, uid) => {
  if (!conv.participants || !conv.participants.includes(uid)) {
    const err = new Error('Access denied: not a participant');
    err.status = 403;
    throw err;
  }
};

// ══════════════════════════════════════════════
// GET /api/messages/conversations
// List all conversations for the authenticated user
// ══════════════════════════════════════════════
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const uid = req.user.uid;

    const snap = await db
      .collection('conversations')
      .where('participants', 'array-contains', uid)
      .limit(50)
      .get();

    const conversations = await Promise.all(
      snap.docs.map(async (doc) => {
        const data = doc.data();
        const otherUid = data.participants.find((p) => p !== uid);
        const otherUser = await getUserPublic(db, otherUid);
        return {
          id: doc.id,
          ...data,
          otherUser,
          unreadCount: data.unreadCounts?.[uid] || 0,
        };
      })
    );

    // Sort by updatedAt descending in JS (avoids composite index requirement)
    conversations.sort((a, b) => {
      const aTime = a.updatedAt?.toDate?.() || new Date(a.updatedAt || 0);
      const bTime = b.updatedAt?.toDate?.() || new Date(b.updatedAt || 0);
      return bTime - aTime;
    });


    res.json({ success: true, conversations });
  } catch (err) {
    console.error('GET /conversations error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// POST /api/messages/conversations
// Start or retrieve a 1-on-1 conversation
// Body: { recipientId }
// ══════════════════════════════════════════════
router.post('/conversations', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const uid = req.user.uid;
    const { recipientId } = req.body;

    if (!recipientId) return res.status(400).json({ error: 'recipientId is required' });
    if (recipientId === uid) return res.status(400).json({ error: 'Cannot message yourself' });

    // Verify recipient exists and is on same campus
    const [me, recipient] = await Promise.all([
      getUserPublic(db, uid),
      getUserPublic(db, recipientId),
    ]);

    if (!recipient) return res.status(404).json({ error: 'Recipient user not found' });
    if (!me) return res.status(404).json({ error: 'Sender profile not found' });
    if (me.campusId !== recipient.campusId) {
      return res.status(403).json({ error: 'Can only message users on the same campus' });
    }

    const convId = buildConvId(uid, recipientId);
    const convRef = db.collection('conversations').doc(convId);
    const convSnap = await convRef.get();

    if (convSnap.exists) {
      const data = convSnap.data();
      return res.json({
        success: true,
        conversation: {
          id: convId,
          ...data,
          otherUser: recipient,
          unreadCount: data.unreadCounts?.[uid] || 0,
        },
        isNew: false,
      });
    }

    // Create new conversation doc
    const now = new Date();
    const convData = {
      participants: [uid, recipientId],
      campusId: me.campusId,
      lastMessage: null,
      unreadCounts: { [uid]: 0, [recipientId]: 0 },
      createdAt: now,
      updatedAt: now,
    };

    await convRef.set(convData);

    res.status(201).json({
      success: true,
      conversation: {
        id: convId,
        ...convData,
        otherUser: recipient,
        unreadCount: 0,
      },
      isNew: true,
    });
  } catch (err) {
    console.error('POST /conversations error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// GET /api/messages/:convId/messages
// Paginated message history (cursor-based, 30/page)
// Query: ?before=<messageId>&limit=30
// ══════════════════════════════════════════════
router.get('/:convId/messages', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const uid = req.user.uid;
    const { convId } = req.params;
    const pageLimit = Math.min(parseInt(req.query.limit) || 30, 50);

    // Auth check
    const convSnap = await db.collection('conversations').doc(convId).get();
    if (!convSnap.exists) return res.status(404).json({ error: 'Conversation not found' });
    assertParticipant(convSnap.data(), uid);

    let query = db
      .collection('conversations')
      .doc(convId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(pageLimit);

    // Cursor pagination
    if (req.query.before) {
      const cursorSnap = await db
        .collection('conversations')
        .doc(convId)
        .collection('messages')
        .doc(req.query.before)
        .get();
      if (cursorSnap.exists) {
        query = query.startAfter(cursorSnap);
      }
    }

    const snap = await query.get();
    const messages = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((msg) => !msg.deletedFor?.includes(uid))
      .reverse(); // chronological order

    res.json({
      success: true,
      messages,
      hasMore: snap.docs.length === pageLimit,
      nextCursor: snap.docs.length === pageLimit ? snap.docs[snap.docs.length - 1].id : null,
    });
  } catch (err) {
    console.error('GET /:convId/messages error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// POST /api/messages/:convId/messages
// Send a new message (text or image)
// Body (multipart): { text?, type? } + optional image file
// ══════════════════════════════════════════════
router.post(
  '/:convId/messages',
  requireAuth,
  upload.single('image'),
  async (req, res) => {
    try {
      const db = getFirestore();
      const io = req.app.get('io');
      const uid = req.user.uid;
      const { convId } = req.params;
      const { text } = req.body;

      if (!text && !req.file) {
        return res.status(400).json({ error: 'Message must contain text or an image' });
      }

      // Auth + participant check
      const convRef = db.collection('conversations').doc(convId);
      const convSnap = await convRef.get();
      if (!convSnap.exists) return res.status(404).json({ error: 'Conversation not found' });
      const convData = convSnap.data();
      assertParticipant(convData, uid);

      const recipientId = convData.participants.find((p) => p !== uid);

      // Upload image if provided
      let imageUrl = null;
      if (req.file) {
        try {
          imageUrl = await storageService.uploadImage(req.file, `dm/${convId}`);
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          return res.status(500).json({ error: 'Image upload failed' });
        }
      }

      const now = new Date();
      const msgId = uuidv4();
      const messageData = {
        senderId: uid,
        text: text || '',
        imageUrl: imageUrl || null,
        type: imageUrl ? 'image' : 'text',
        readBy: [uid], // sender has read it
        deletedFor: [],
        createdAt: now,
      };

      // Write message to sub-collection
      await db
        .collection('conversations')
        .doc(convId)
        .collection('messages')
        .doc(msgId)
        .set(messageData);

      // Update conversation metadata
      const newUnreadCounts = {
        ...convData.unreadCounts,
        [recipientId]: (convData.unreadCounts?.[recipientId] || 0) + 1,
        // sender's count stays 0 (they just sent it)
        [uid]: 0,
      };

      await convRef.update({
        lastMessage: {
          text: text || '📷 Image',
          senderId: uid,
          timestamp: now,
          type: imageUrl ? 'image' : 'text',
        },
        unreadCounts: newUnreadCounts,
        updatedAt: now,
      });

      const fullMessage = { id: msgId, ...messageData };

      // Emit real-time event to the conversation room
      if (io) {
        io.to(`dm_${convId}`).emit('dm_new_message', {
          conversationId: convId,
          message: fullMessage,
        });
      }

      res.status(201).json({ success: true, message: fullMessage });
    } catch (err) {
      console.error('POST /:convId/messages error:', err);
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

// ══════════════════════════════════════════════
// DELETE /api/messages/:convId/messages/:msgId
// Soft-delete a message. deleteForBoth only allowed within 60s of send.
// Body: { deleteForBoth: boolean }
// ══════════════════════════════════════════════
router.delete('/:convId/messages/:msgId', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const io = req.app.get('io');
    const uid = req.user.uid;
    const { convId, msgId } = req.params;
    const { deleteForBoth = false } = req.body || {};

    // Auth check
    const convSnap = await db.collection('conversations').doc(convId).get();
    if (!convSnap.exists) return res.status(404).json({ error: 'Conversation not found' });
    assertParticipant(convSnap.data(), uid);

    const msgRef = db
      .collection('conversations')
      .doc(convId)
      .collection('messages')
      .doc(msgId);

    const msgSnap = await msgRef.get();
    if (!msgSnap.exists) return res.status(404).json({ error: 'Message not found' });

    const msgData = msgSnap.data();
    if (msgData.senderId !== uid) {
      return res.status(403).json({ error: 'Cannot delete another user\'s message' });
    }

    if (deleteForBoth) {
      // Only allow within 60 seconds of sending
      const sentAt = msgData.createdAt?.toDate?.() || new Date(msgData.createdAt);
      const ageSeconds = (Date.now() - sentAt.getTime()) / 1000;
      if (ageSeconds > 60) {
        return res.status(403).json({ error: 'Unsend window (60s) has passed. You can only delete for yourself.' });
      }
      // Mark deleted for all participants
      const convData = convSnap.data();
      await msgRef.update({ deletedFor: convData.participants });

      // Clear conversation lastMessage if it was this message
      if (convData.lastMessage?.senderId === uid) {
        await db.collection('conversations').doc(convId).update({
          lastMessage: null,
          updatedAt: new Date(),
        });
      }

      if (io) {
        io.to(`dm_${convId}`).emit('dm_message_deleted', {
          conversationId: convId,
          messageId: msgId,
          deletedForBoth: true,
        });
      }
    } else {
      // Soft-delete for self only
      await msgRef.update({
        deletedFor: (msgData.deletedFor || []).includes(uid)
          ? msgData.deletedFor
          : [...(msgData.deletedFor || []), uid],
      });
    }

    res.json({ success: true, messageId: msgId });
  } catch (err) {
    console.error('DELETE /:convId/messages/:msgId error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// PUT /api/messages/:convId/read
// Mark all messages in a conversation as read for the current user
// ══════════════════════════════════════════════
router.put('/:convId/read', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const io = req.app.get('io');
    const uid = req.user.uid;
    const { convId } = req.params;

    const convRef = db.collection('conversations').doc(convId);
    const convSnap = await convRef.get();
    if (!convSnap.exists) return res.status(404).json({ error: 'Conversation not found' });
    assertParticipant(convSnap.data(), uid);

    // Reset unread count for this user
    await convRef.update({ [`unreadCounts.${uid}`]: 0 });

    // Fetch all messages and mark unread ones as read (filter in JS — no composite index needed)
    const allMsgs = await db
      .collection('conversations')
      .doc(convId)
      .collection('messages')
      .get();

    const batch = db.batch();
    let updateCount = 0;
    allMsgs.docs.forEach((doc) => {
      const existing = doc.data().readBy || [];
      if (!existing.includes(uid)) {
        batch.update(doc.ref, { readBy: [...existing, uid] });
        updateCount++;
      }
    });
    if (updateCount > 0) await batch.commit();

    // Emit read receipt to conversation room
    if (io) {
      io.to(`dm_${convId}`).emit('dm_read_receipt', {
        conversationId: convId,
        readBy: uid,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('PUT /:convId/read error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// GET /api/messages/conversations/:convId
// Get single conversation metadata
// ══════════════════════════════════════════════
router.get('/conversations/:convId', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const uid = req.user.uid;
    const { convId } = req.params;

    const convSnap = await db.collection('conversations').doc(convId).get();
    if (!convSnap.exists) return res.status(404).json({ error: 'Conversation not found' });
    const data = convSnap.data();
    assertParticipant(data, uid);

    const otherUid = data.participants.find((p) => p !== uid);
    const otherUser = await getUserPublic(db, otherUid);

    res.json({
      success: true,
      conversation: {
        id: convId,
        ...data,
        otherUser,
        unreadCount: data.unreadCounts?.[uid] || 0,
      },
    });
  } catch (err) {
    console.error('GET /conversations/:convId error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// GET /api/messages/users/search
// Search campus users to start a conversation
// Query: ?q=<searchTerm>&campusId=<id>
// ══════════════════════════════════════════════
router.get('/users/search', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const uid = req.user.uid;
    const { q, campusId } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    if (!campusId) {
      return res.status(400).json({ error: 'campusId is required' });
    }

    const searchTerm = q.trim().toLowerCase();

    // Fetch campus users, then filter by name in JS.
    // This avoids the composite index requirement (campusId + usernameLower range).
    const snap = await db
      .collection('users')
      .where('campusId', '==', campusId)
      .limit(200) // generous upper bound; filtered to 10 below
      .get();

    const users = snap.docs
      .map((doc) => {
        const d = doc.data();
        return {
          uid: doc.id,
          username: d.username || d.displayName || '',
          avatar: d.avatar || d.photoURL || null,
          department: d.department || null,
          course: d.course || null,
          campusId: d.campusId,
          _key: (d.usernameLower || d.username || d.displayName || '').toLowerCase(),
        };
      })
      .filter((u) => u.uid !== uid && u._key.includes(searchTerm))
      .slice(0, 10)
      .map(({ _key, ...rest }) => rest); // strip internal field

    res.json({ success: true, users });
  } catch (err) {
    console.error('GET /users/search error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
