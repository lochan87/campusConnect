import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowLeft, FiChevronDown, FiSearch, FiX, FiVolume2, FiVolumeX, FiInfo, FiUser, FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDM } from '../../context/DMContext';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

/* ── Date separator helper ──────────────────────────────────────────────── */
const getDateLabel = (ts) => {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return '';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
};

/* ── Inject date separators between messages ────────────────────────────── */
const withSeparators = (messages) => {
  const out = [];
  let lastLabel = null;
  messages.forEach((msg) => {
    const label = getDateLabel(msg.createdAt);
    if (label && label !== lastLabel) {
      out.push({ _type: 'sep', label, key: `sep_${label}` });
      lastLabel = label;
    }
    out.push({ _type: 'msg', ...msg });
  });
  return out;
};

/* ── Loading skeleton ───────────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="flex flex-col gap-3 px-4 pt-6 pb-2">
    {[
      { mine: false, w: '55%' },
      { mine: true,  w: '40%' },
      { mine: false, w: '65%' },
      { mine: true,  w: '50%' },
      { mine: true,  w: '35%' },
    ].map((s, i) => (
      <div key={i} className={`flex ${s.mine ? 'justify-end' : 'justify-start'}`}>
        <div
          className="h-10 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse"
          style={{ width: s.w }}
        />
      </div>
    ))}
  </div>
);

/* ── User Profile Drawer Modal ──────────────────────────────────────────── */
const ProfileModal = ({ user, onClose }) => {
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center pt-2">
          {/* Avatar */}
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-24 h-24 rounded-full object-cover shadow-xl ring-4 ring-indigo-100 dark:ring-indigo-900/50 mb-4"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl mb-4">
              {(user.username || '?').charAt(0).toUpperCase()}
            </div>
          )}

          <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            {user.username}
          </h3>
          {user.department && (
            <p className="text-sm font-medium text-indigo-500 dark:text-indigo-400 mt-0.5">
              {user.department}
            </p>
          )}
          {user.course && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {user.course}
            </p>
          )}

          <div className="w-full mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/80 flex flex-col gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-2xl text-left">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Campus</span>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mt-0.5">
                {user.campusId || 'CampusConnect'}
              </p>
            </div>

            <button
              onClick={() => {
                onClose();
                navigate(`/profile/${user.uid}`);
              }}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
            >
              <FiUser className="w-4 h-4" />
              View Full Profile
              <FiExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Chat window ────────────────────────────────────────────────────────── */
const ChatWindow = ({ onBack }) => {
  const { user } = useAuth();
  const {
    activeConversationId,
    conversations,
    messages,
    typingUsers,
    loadingMessages,
    hasMoreMessages,
    loadMoreMessages,
    deleteMessage,
    toggleReaction,
    soundEnabled,
    toggleSound,
  } = useDM();

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const isNearBottomRef = useRef(true);

  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const conv = conversations.find((c) => c.id === activeConversationId);
  const convMessages = messages[activeConversationId] || [];
  const isLoading = loadingMessages[activeConversationId];
  const hasMore = hasMoreMessages[activeConversationId];
  const convTyping = typingUsers[activeConversationId] || {};

  // In-chat search filter
  const displayedMessages = chatSearchQuery.trim()
    ? convMessages.filter((m) =>
        m.text?.toLowerCase().includes(chatSearchQuery.toLowerCase().trim())
      )
    : convMessages;

  const grouped = withSeparators(displayedMessages);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) scrollToBottom();
  }, [convMessages.length, scrollToBottom]);

  useEffect(() => {
    scrollToBottom('instant');
    setReplyingTo(null);
    setShowInChatSearch(false);
    setChatSearchQuery('');
  }, [activeConversationId, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = fromBottom < 100;
    setShowScrollBtn(fromBottom > 220);

    if (el.scrollTop < 80 && hasMore && !isLoading && !chatSearchQuery) {
      const prev = el.scrollHeight;
      loadMoreMessages(activeConversationId).then(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prev;
        });
      });
    }
  };

  const handleReplyMessage = (msg) => {
    const senderName = msg.senderId === user?.uid ? 'Yourself' : (conv?.otherUser?.username || 'Message');
    setReplyingTo({
      id: msg.id,
      senderName,
      text: msg.text,
      imageUrl: msg.imageUrl,
    });
  };

  if (!conv) return null;
  const other = conv.otherUser;

  return (
    <div className="flex flex-col h-full relative" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      
      {/* ── Profile Drawer Modal ── */}
      <AnimatePresence>
        {showProfile && (
          <ProfileModal user={other} onClose={() => setShowProfile(false)} />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-700 shadow-xs z-10">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Avatar & User click */}
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 text-left group min-w-0"
          >
            <div className="relative flex-shrink-0">
              {other?.avatar ? (
                <img src={other.avatar} alt={other.username}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-900 group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-md group-hover:scale-105 transition-transform">
                  {(other?.username || '?').charAt(0).toUpperCase()}
                </div>
              )}
              {/* Online status indicator */}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-white text-sm truncate leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {other?.username || 'Unknown'}
              </p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400 truncate font-medium flex items-center gap-1">
                <span>{other?.department || other?.course || 'Campus Peer'}</span>
              </p>
            </div>
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              !soundEnabled ? 'text-gray-300 dark:text-gray-600' : 'text-indigo-500'
            }`}
            title={soundEnabled ? 'Mute notification sound' : 'Enable notification sound'}
          >
            {soundEnabled ? <FiVolume2 className="w-4 h-4" /> : <FiVolumeX className="w-4 h-4" />}
          </button>

          {/* Search toggle */}
          <button
            onClick={() => setShowInChatSearch((v) => !v)}
            className={`p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              showInChatSearch ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : ''
            }`}
            title="Search in chat"
          >
            <FiSearch className="w-4 h-4" />
          </button>

          {/* Profile info button */}
          <button
            onClick={() => setShowProfile(true)}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Recipient details"
          >
            <FiInfo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Slide-down In-Chat Search Bar ── */}
      <AnimatePresence>
        {showInChatSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-indigo-50/80 dark:bg-gray-800/80 backdrop-blur-md px-4 py-2 border-b border-indigo-100 dark:border-gray-700 flex items-center gap-2 z-10"
          >
            <FiSearch className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <input
              type="text"
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              placeholder="Search messages in this thread…"
              className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none"
              autoFocus
            />
            {chatSearchQuery && (
              <span className="text-xs text-indigo-500 font-semibold px-2">
                {displayedMessages.length} found
              </span>
            )}
            <button
              onClick={() => { setShowInChatSearch(false); setChatSearchQuery(''); }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FiX className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Messages area ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-3"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Load-more spinner */}
        <AnimatePresence>
          {isLoading && convMessages.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex justify-center py-3">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initial skeleton */}
        {isLoading && convMessages.length === 0 && <Skeleton />}

        {/* Empty thread */}
        {!isLoading && convMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-24 px-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center mb-5 shadow-inner">
              <span className="text-4xl">👋</span>
            </div>
            <p className="font-bold text-gray-800 dark:text-gray-200 text-base mb-1">
              Say hello to {other?.username || 'your contact'}!
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm leading-relaxed">
              This is the beginning of your conversation.<br />
              Everything you share stays private and secure.
            </p>
          </div>
        )}

        {/* Messages + date separators */}
        <AnimatePresence initial={false}>
          {grouped.map((item) =>
            item._type === 'sep' ? (
              /* Date separator */
              <div key={item.key} className="flex items-center gap-3 my-5 px-6">
                <div className="flex-1 h-px bg-gray-200/80 dark:bg-gray-700/80" />
                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-xs border border-gray-200 dark:border-gray-700">
                  {item.label}
                </span>
                <div className="flex-1 h-px bg-gray-200/80 dark:bg-gray-700/80" />
              </div>
            ) : (
              <MessageBubble
                key={item.id}
                message={item}
                isMine={item.senderId === user?.uid}
                currentUserId={user?.uid}
                onDelete={(msgId, forBoth) => deleteMessage(activeConversationId, msgId, forBoth)}
                onReply={handleReplyMessage}
                onReactionToggle={(msgId, emoji) => toggleReaction(activeConversationId, msgId, emoji)}
              />
            )
          )}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {Object.keys(convTyping).length > 0 && (
            <TypingIndicator key="typing" typers={convTyping} />
          )}
        </AnimatePresence>

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Scroll-to-bottom FAB */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-20 right-5 w-9 h-9 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-lg flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 hover:text-indigo-500 transition-all z-20"
          >
            <FiChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Input ── */}
      <MessageInput
        conversationId={activeConversationId}
        disabled={!activeConversationId}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
};

export default ChatWindow;

