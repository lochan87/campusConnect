import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { socketService } from '../services/socket';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';
import { soundFx } from '../utils/soundEffects';
import toast from 'react-hot-toast';

// ── State shape ──────────────────────────────────────────────────────────────
const initialState = {
  conversations: [],       // sorted by updatedAt desc
  messages: {},            // { [convId]: Message[] }  chronological
  typingUsers: {},         // { [convId]: { [userId]: username } }
  activeConversationId: null,
  totalUnread: 0,
  loadingConversations: false,
  loadingMessages: {},     // { [convId]: boolean }
  hasMoreMessages: {},     // { [convId]: boolean }
  error: null,
};

// ── Action types ─────────────────────────────────────────────────────────────
const A = {
  SET_CONVERSATIONS: 'SET_CONVERSATIONS',
  ADD_OR_UPDATE_CONVERSATION: 'ADD_OR_UPDATE_CONVERSATION',
  SET_ACTIVE: 'SET_ACTIVE',
  SET_MESSAGES: 'SET_MESSAGES',
  PREPEND_MESSAGES: 'PREPEND_MESSAGES',     // older messages loaded on scroll-up
  APPEND_MESSAGE: 'APPEND_MESSAGE',         // new message arriving / sent
  REPLACE_OPTIMISTIC: 'REPLACE_OPTIMISTIC', // confirm optimistic message
  REMOVE_MESSAGE: 'REMOVE_MESSAGE',
  SET_TYPING: 'SET_TYPING',
  CLEAR_TYPING: 'CLEAR_TYPING',
  UPDATE_UNREAD: 'UPDATE_UNREAD',
  SET_LOADING_CONVS: 'SET_LOADING_CONVS',
  SET_LOADING_MSGS: 'SET_LOADING_MSGS',
  SET_HAS_MORE: 'SET_HAS_MORE',
  SET_ERROR: 'SET_ERROR',
  MARK_CONV_READ: 'MARK_CONV_READ',
  MARK_MESSAGES_READ: 'MARK_MESSAGES_READ', // update readBy on all messages when partner reads
  TOGGLE_REACTION: 'TOGGLE_REACTION',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const computeTotal = (conversations, uid) =>
  conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

// ── Reducer ──────────────────────────────────────────────────────────────────
const dmReducer = (state, action) => {
  switch (action.type) {
    case A.SET_CONVERSATIONS:
      return {
        ...state,
        conversations: action.payload,
        totalUnread: computeTotal(action.payload),
        loadingConversations: false,
      };

    case A.ADD_OR_UPDATE_CONVERSATION: {
      const incoming = action.payload;
      const exists = state.conversations.find((c) => c.id === incoming.id);
      const updated = exists
        ? state.conversations.map((c) => (c.id === incoming.id ? { ...c, ...incoming } : c))
        : [incoming, ...state.conversations];
      const sorted = [...updated].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      return {
        ...state,
        conversations: sorted,
        totalUnread: computeTotal(sorted),
      };
    }

    case A.SET_ACTIVE:
      return { ...state, activeConversationId: action.payload };

    case A.SET_MESSAGES:
      return {
        ...state,
        messages: { ...state.messages, [action.payload.convId]: action.payload.messages },
        loadingMessages: { ...state.loadingMessages, [action.payload.convId]: false },
      };

    case A.PREPEND_MESSAGES: {
      const { convId, messages } = action.payload;
      const existing = state.messages[convId] || [];
      return {
        ...state,
        messages: { ...state.messages, [convId]: [...messages, ...existing] },
        loadingMessages: { ...state.loadingMessages, [convId]: false },
      };
    }

    case A.APPEND_MESSAGE: {
      const { convId, message } = action.payload;
      const existing = state.messages[convId] || [];
      // Prevent duplicate (optimistic + confirmed)
      if (existing.find((m) => m.id === message.id)) return state;
      return {
        ...state,
        messages: { ...state.messages, [convId]: [...existing, message] },
      };
    }

    case A.REPLACE_OPTIMISTIC: {
      const { convId, tempId, message } = action.payload;
      const existing = state.messages[convId] || [];
      // If real message already arrived via socket, just remove the optimistic stub
      if (existing.find((m) => m.id === message.id)) {
        return {
          ...state,
          messages: {
            ...state.messages,
            [convId]: existing.filter((m) => m.id !== tempId),
          },
        };
      }
      return {
        ...state,
        messages: {
          ...state.messages,
          [convId]: existing.map((m) => (m.id === tempId ? message : m)),
        },
      };
    }

    case A.REMOVE_MESSAGE: {
      const { convId, messageId } = action.payload;
      const existing = state.messages[convId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [convId]: existing.filter((m) => m.id !== messageId),
        },
      };
    }

    case A.SET_TYPING: {
      const { convId, userId, username, isTyping } = action.payload;
      const convTyping = { ...(state.typingUsers[convId] || {}) };
      if (isTyping) {
        convTyping[userId] = username || userId;
      } else {
        delete convTyping[userId];
      }
      return {
        ...state,
        typingUsers: { ...state.typingUsers, [convId]: convTyping },
      };
    }

    case A.CLEAR_TYPING: {
      const convTyping = { ...(state.typingUsers[action.payload] || {}) };
      return {
        ...state,
        typingUsers: { ...state.typingUsers, [action.payload]: {} },
      };
    }

    case A.MARK_CONV_READ: {
      const convId = action.payload;
      const conversations = state.conversations.map((c) =>
        c.id === convId ? { ...c, unreadCount: 0 } : c
      );
      return {
        ...state,
        conversations,
        totalUnread: computeTotal(conversations),
      };
    }

    // When the other participant reads the conversation, mark all messages as read
    case A.MARK_MESSAGES_READ: {
      const { convId, readerUid } = action.payload;
      const existing = state.messages[convId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [convId]: existing.map((msg) =>
            msg.readBy?.includes(readerUid)
              ? msg
              : { ...msg, readBy: [...(msg.readBy || []), readerUid] }
          ),
        },
      };
    }

    case A.SET_LOADING_CONVS:
      return { ...state, loadingConversations: action.payload };

    case A.SET_LOADING_MSGS:
      return {
        ...state,
        loadingMessages: { ...state.loadingMessages, [action.payload.convId]: action.payload.value },
      };

    case A.SET_HAS_MORE:
      return {
        ...state,
        hasMoreMessages: { ...state.hasMoreMessages, [action.payload.convId]: action.payload.value },
      };

    case A.TOGGLE_REACTION: {
      const { convId, messageId, emoji, uid } = action.payload;
      const existing = state.messages[convId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [convId]: existing.map((msg) => {
            if (msg.id !== messageId) return msg;
            const currentReactions = { ...(msg.reactions || {}) };
            const uidsForEmoji = currentReactions[emoji] || [];
            if (uidsForEmoji.includes(uid)) {
              const updated = uidsForEmoji.filter((u) => u !== uid);
              if (updated.length === 0) delete currentReactions[emoji];
              else currentReactions[emoji] = updated;
            } else {
              currentReactions[emoji] = [...uidsForEmoji, uid];
            }
            return { ...msg, reactions: currentReactions };
          }),
        },
      };
    }

    case A.SET_ERROR:
      return { ...state, error: action.payload };

    default:
      return state;
  }
};

// ── Context ──────────────────────────────────────────────────────────────────
const DMContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export const DMProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dmReducer, initialState);
  const { user } = useAuth();
  const typingTimersRef = useRef({});

  // Sound preference state
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('dm_sound_enabled') !== 'false';
  });
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    localStorage.setItem('dm_sound_enabled', soundEnabled);
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  // Stable refs for volatile state (avoids re-registering socket handlers)
  const activeConvIdRef = useRef(state.activeConversationId);
  const conversationsRef = useRef(state.conversations);
  const messagesRef = useRef(state.messages);
  const userRef = useRef(user);
  // Track locally deleted message IDs so re-fetches can't resurrect them
  const deletedMsgIdsRef = useRef(new Set());

  useEffect(() => { activeConvIdRef.current = state.activeConversationId; });
  useEffect(() => { conversationsRef.current = state.conversations; });
  useEffect(() => { messagesRef.current = state.messages; });
  useEffect(() => { userRef.current = user; });

  // ── Load conversations on auth ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  // ── Join all DM rooms on socket connect so background messages arrive ───
  useEffect(() => {
    if (!user || state.conversations.length === 0) return;
    const ids = state.conversations.map((c) => c.id);
    socketService.joinDMRooms(ids);
  }, [user, state.conversations.length]);

  // ── Socket event listeners (deps = [user] only — refs give access to latest state) ──
  useEffect(() => {
    if (!user) return;

    const handleNewMessage = (data) => {
      const { conversationId, message } = data;
      const currentUser = userRef.current;

      // Skip messages we sent ourselves — optimistic UI + REPLACE_OPTIMISTIC handles them
      if (message.senderId === currentUser?.uid) return;

      // Append to chat if messages are loaded for this conv
      dispatch({ type: A.APPEND_MESSAGE, payload: { convId: conversationId, message } });

      // Play sound ping if sound enabled
      if (soundEnabledRef.current) {
        soundFx.playPop();
      }

      // Update conversation preview + bubble to top
      dispatch({
        type: A.ADD_OR_UPDATE_CONVERSATION,
        payload: {
          id: conversationId,
          lastMessage: {
            text: message.text || '📷 Image',
            senderId: message.senderId,
            timestamp: message.createdAt,
            type: message.type,
          },
          updatedAt: message.createdAt,
        },
      });

      const activeId = activeConvIdRef.current;
      if (activeId === conversationId) {
        // User is actively viewing this conv — auto mark as read so ticks turn blue for sender
        apiService.markConversationRead(conversationId).catch(() => {});
        dispatch({ type: A.MARK_CONV_READ, payload: conversationId });
      } else {
        // Background notification
        const conv = conversationsRef.current.find((c) => c.id === conversationId);
        const senderName = conv?.otherUser?.username || 'Someone';
        toast(`💬 ${senderName}: ${message.text || 'Sent an image'}`, {
          duration: 4000,
          icon: null,
        });
        // Refresh conv list so unread badge + ordering updates
        loadConversations();
      }
    };

    const handleTyping = (data) => {
      const { conversationId, userId, username, isTyping } = data;
      if (userId === userRef.current?.uid) return;

      dispatch({ type: A.SET_TYPING, payload: { convId: conversationId, userId, username, isTyping } });

      if (isTyping) {
        clearTimeout(typingTimersRef.current[`${conversationId}_${userId}`]);
        typingTimersRef.current[`${conversationId}_${userId}`] = setTimeout(() => {
          dispatch({ type: A.SET_TYPING, payload: { convId: conversationId, userId, isTyping: false } });
        }, 3000);
      } else {
        clearTimeout(typingTimersRef.current[`${conversationId}_${userId}`]);
      }
    };

    const handleReadReceipt = (data) => {
      // Backend emits { conversationId, readBy: uid } when partner reads
      const { conversationId, readBy: readerUid } = data;
      if (!readerUid || readerUid === userRef.current?.uid) return; // ignore own read events
      // Update readBy on all messages in this conversation locally — turns ticks blue
      dispatch({
        type: A.MARK_MESSAGES_READ,
        payload: { convId: conversationId, readerUid },
      });
    };

    const handleMessageDeleted = (data) => {
      const { conversationId, messageId, deletedForBoth } = data;
      if (deletedForBoth) {
        dispatch({ type: A.REMOVE_MESSAGE, payload: { convId: conversationId, messageId } });
      }
    };

    socketService.on('dmNewMessage', handleNewMessage);
    socketService.on('dmTyping', handleTyping);
    socketService.on('dmReadReceipt', handleReadReceipt);
    socketService.on('dmMessageDeleted', handleMessageDeleted);

    return () => {
      socketService.off('dmNewMessage', handleNewMessage);
      socketService.off('dmTyping', handleTyping);
      socketService.off('dmReadReceipt', handleReadReceipt);
      socketService.off('dmMessageDeleted', handleMessageDeleted);
    };
  }, [user]); // ✅ Only [user] — refs prevent stale closures without re-registering

  // ── Actions ───────────────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!user) return;
    dispatch({ type: A.SET_LOADING_CONVS, payload: true });
    try {
      const res = await apiService.getConversations();
      dispatch({ type: A.SET_CONVERSATIONS, payload: res.data.conversations });
    } catch (err) {
      console.error('loadConversations error:', err);
      dispatch({ type: A.SET_LOADING_CONVS, payload: false });
    }
  }, [user]);

  const loadMessages = useCallback(
    async (convId, refresh = false) => {
      // Use ref to check current loaded state — avoids stale closure from state.messages dep
      const alreadyLoaded = (messagesRef.current[convId]?.length || 0) > 0;
      if (!refresh && alreadyLoaded) return;

      dispatch({ type: A.SET_LOADING_MSGS, payload: { convId, value: true } });
      try {
        const res = await apiService.getMessages(convId, { limit: 30 });
        const { messages, hasMore } = res.data;
        // Filter out any locally deleted messages so they never come back
        const filtered = messages.filter((m) => !deletedMsgIdsRef.current.has(m.id));
        dispatch({ type: A.SET_MESSAGES, payload: { convId, messages: filtered } });
        dispatch({ type: A.SET_HAS_MORE, payload: { convId, value: hasMore } });
      } catch (err) {
        console.error('loadMessages error:', err);
        dispatch({ type: A.SET_LOADING_MSGS, payload: { convId, value: false } });
      }
    },
    [] // stable — uses messagesRef and deletedMsgIdsRef (both refs, never stale)
  );

  const loadMoreMessages = useCallback(
    async (convId) => {
      // Use refs so this stays stable and doesn't cause openConversation to re-create
      const msgs = messagesRef.current[convId] || [];
      const hasMore = state.hasMoreMessages[convId];
      if (!hasMore || msgs.length === 0) return;
      const cursor = msgs[0].id;

      dispatch({ type: A.SET_LOADING_MSGS, payload: { convId, value: true } });
      try {
        const res = await apiService.getMessages(convId, { before: cursor, limit: 30 });
        const { messages, hasMore: more } = res.data;
        dispatch({ type: A.PREPEND_MESSAGES, payload: { convId, messages } });
        dispatch({ type: A.SET_HAS_MORE, payload: { convId, value: more } });
      } catch (err) {
        console.error('loadMoreMessages error:', err);
        dispatch({ type: A.SET_LOADING_MSGS, payload: { convId, value: false } });
      }
    },
    [state.hasMoreMessages]
  );

  const openConversation = useCallback(
    async (convId) => {
      dispatch({ type: A.SET_ACTIVE, payload: convId });
      socketService.joinDMRoom(convId);
      await loadMessages(convId);
      // Mark as read
      try {
        await apiService.markConversationRead(convId);
        dispatch({ type: A.MARK_CONV_READ, payload: convId });
      } catch (_) {}
    },
    [loadMessages]
  );

  const closeConversation = useCallback(() => {
    if (state.activeConversationId) {
      socketService.leaveDMRoom(state.activeConversationId);
    }
    dispatch({ type: A.SET_ACTIVE, payload: null });
  }, [state.activeConversationId]);

  const startConversation = useCallback(async (recipientId) => {
    try {
      const res = await apiService.getOrCreateConversation(recipientId);
      const conv = res.data.conversation;
      dispatch({ type: A.ADD_OR_UPDATE_CONVERSATION, payload: conv });
      return conv;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start conversation');
      throw err;
    }
  }, []);

  const sendMessage = useCallback(
    async (convId, text, imageFile = null, replyTo = null) => {
      if (!user) return;

      // Optimistic message
      const tempId = `temp_${Date.now()}`;
      const optimistic = {
        id: tempId,
        senderId: user.uid,
        text: text || '',
        imageUrl: null,
        type: imageFile ? 'image' : 'text',
        replyTo: replyTo ? {
          id: replyTo.id,
          senderName: replyTo.senderName || replyTo.senderId,
          text: replyTo.text || '',
          imageUrl: replyTo.imageUrl || null,
        } : null,
        readBy: [user.uid],
        deletedFor: [],
        createdAt: new Date().toISOString(),
        _pending: true,
      };

      dispatch({ type: A.APPEND_MESSAGE, payload: { convId, message: optimistic } });

      try {
        let payload;
        if (imageFile) {
          payload = new FormData();
          if (text) payload.append('text', text);
          payload.append('image', imageFile);
          if (replyTo) payload.append('replyTo', JSON.stringify(optimistic.replyTo));
        } else {
          payload = { text, replyTo: optimistic.replyTo };
        }

        const res = await apiService.sendMessage(convId, payload);
        const confirmed = res.data.message;

        // Ensure confirmed includes local replyTo if backend didn't save it
        if (optimistic.replyTo && !confirmed.replyTo) {
          confirmed.replyTo = optimistic.replyTo;
        }

        // Replace optimistic with confirmed message
        dispatch({ type: A.REPLACE_OPTIMISTIC, payload: { convId, tempId, message: confirmed } });

        // Refresh conversation list ordering
        loadConversations();
      } catch (err) {
        // Roll back optimistic message
        dispatch({ type: A.REMOVE_MESSAGE, payload: { convId, messageId: tempId } });
        toast.error('Failed to send message');
      }
    },
    [user, loadConversations]
  );

  const deleteMessage = useCallback(async (convId, messageId, deleteForBoth = false) => {
    // Optimistically remove from local state immediately
    deletedMsgIdsRef.current.add(messageId);
    dispatch({ type: A.REMOVE_MESSAGE, payload: { convId, messageId } });

    // Optimistically clear lastMessage in conversation preview if it was the deleted msg
    dispatch({
      type: A.ADD_OR_UPDATE_CONVERSATION,
      payload: { id: convId, lastMessage: null, updatedAt: new Date().toISOString() },
    });

    try {
      await apiService.deleteMessage(convId, messageId, deleteForBoth);
      if (deleteForBoth) {
        toast.success('Message unsent', { duration: 2000 });
      }
      // Refresh conversation list so lastMessage preview reflects deletion
      loadConversations();
    } catch (err) {
      // Rollback
      deletedMsgIdsRef.current.delete(messageId);
      await loadMessages(convId, true);
      loadConversations();
      toast.error(err.response?.data?.error || 'Could not delete message');
    }
  }, [loadMessages, loadConversations]);


  const emitTypingStart = useCallback(
    (convId) => {
      if (user) socketService.emitDMTypingStart(convId, user.uid, user.username);
    },
    [user]
  );

  const emitTypingStop = useCallback(
    (convId) => {
      if (user) socketService.emitDMTypingStop(convId, user.uid);
    },
    [user]
  );

  const toggleReaction = useCallback((convId, messageId, emoji) => {
    if (!user) return;
    dispatch({
      type: A.TOGGLE_REACTION,
      payload: { convId, messageId, emoji, uid: user.uid },
    });
  }, [user]);

  // ── Value ──────────────────────────────────────────────────────────────────
  const value = {
    // State
    conversations: state.conversations,
    messages: state.messages,
    typingUsers: state.typingUsers,
    activeConversationId: state.activeConversationId,
    totalUnread: state.totalUnread,
    loadingConversations: state.loadingConversations,
    loadingMessages: state.loadingMessages,
    hasMoreMessages: state.hasMoreMessages,
    error: state.error,
    soundEnabled,

    // Actions
    loadConversations,
    loadMessages,
    loadMoreMessages,
    openConversation,
    closeConversation,
    startConversation,
    sendMessage,
    deleteMessage,
    toggleReaction,
    toggleSound,
    emitTypingStart,
    emitTypingStop,
  };

  return <DMContext.Provider value={value}>{children}</DMContext.Provider>;
};

export const useDM = () => {
  const ctx = useContext(DMContext);
  if (!ctx) throw new Error('useDM must be used within a DMProvider');
  return ctx;
};

export default DMContext;
