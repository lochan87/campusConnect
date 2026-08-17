import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowLeft, FiChevronDown } from 'react-icons/fi';
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
  } = useDM();

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const conv = conversations.find((c) => c.id === activeConversationId);
  const convMessages = messages[activeConversationId] || [];
  const isLoading = loadingMessages[activeConversationId];
  const hasMore = hasMoreMessages[activeConversationId];
  const convTyping = typingUsers[activeConversationId] || {};
  const grouped = withSeparators(convMessages);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) scrollToBottom();
  }, [convMessages.length, scrollToBottom]);

  useEffect(() => {
    scrollToBottom('instant');
  }, [activeConversationId, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = fromBottom < 100;
    setShowScrollBtn(fromBottom > 220);

    if (el.scrollTop < 80 && hasMore && !isLoading) {
      const prev = el.scrollHeight;
      loadMoreMessages(activeConversationId).then(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prev;
        });
      });
    }
  };

  if (!conv) return null;
  const other = conv.otherUser;

  return (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(135deg, #f5f7ff 0%, #f0f2fc 100%)' }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-700 shadow-sm z-10">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Avatar */}
        {other?.avatar ? (
          <img src={other.avatar} alt={other.username}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-indigo-100 dark:ring-indigo-900"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-md">
            {(other?.username || '?').charAt(0).toUpperCase()}
          </div>
        )}

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white text-sm truncate leading-tight">
            {other?.username || 'Unknown'}
          </p>
          {(other?.department || other?.course) && (
            <p className="text-xs text-indigo-400 dark:text-indigo-400 truncate font-medium">
              {other.department || other.course}
            </p>
          )}
        </div>
      </div>

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
              <div className="w-5 h-5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
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
              Everything you share stays between you two.
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
                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
                  {item.label}
                </span>
                <div className="flex-1 h-px bg-gray-200/80 dark:bg-gray-700/80" />
              </div>
            ) : (
              <MessageBubble
                key={item.id}
                message={item}
                isMine={item.senderId === user?.uid}
                onDelete={(msgId, forBoth) => deleteMessage(activeConversationId, msgId, forBoth)}
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
      <MessageInput conversationId={activeConversationId} disabled={!activeConversationId} />
    </div>
  );
};

export default ChatWindow;
