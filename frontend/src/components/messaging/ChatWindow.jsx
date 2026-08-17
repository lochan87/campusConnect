import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiMoreVertical, FiUser } from 'react-icons/fi';
import { useDM } from '../../context/DMContext';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

// Group messages by date for date-separator display
const groupByDate = (messages) => {
  const groups = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const d = msg.createdAt?.toDate?.() || new Date(msg.createdAt);
    const label = isNaN(d)
      ? ''
      : d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    if (label !== lastDate) {
      groups.push({ type: 'separator', label, key: `sep_${label}` });
      lastDate = label;
    }
    groups.push({ type: 'message', ...msg });
  });
  return groups;
};

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

  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const conv = conversations.find((c) => c.id === activeConversationId);
  const convMessages = messages[activeConversationId] || [];
  const convTyping = typingUsers[activeConversationId] || {};
  const isLoading = loadingMessages[activeConversationId];
  const hasMore = hasMoreMessages[activeConversationId];
  const grouped = groupByDate(convMessages);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [convMessages.length, autoScroll]);

  // Detect when user scrolls up (pause auto-scroll) or back to bottom (resume)
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAutoScroll(nearBottom);

    // Infinite scroll — load older messages when scrolling to top
    if (el.scrollTop < 60 && hasMore && !isLoading) {
      loadMoreMessages(activeConversationId);
    }
  };

  const handleDelete = (msgId, deleteForBoth) => {
    deleteMessage(activeConversationId, msgId, deleteForBoth);
  };

  if (!conv) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Back button (mobile) */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Avatar */}
        {conv.otherUser?.avatar ? (
          <img
            src={conv.otherUser.avatar}
            alt={conv.otherUser.username}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-900"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <FiUser className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {conv.otherUser?.username || 'Unknown'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {conv.otherUser?.department || conv.otherUser?.course || 'CampusConnect'}
          </p>
        </div>

        {/* More options placeholder */}
        <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <FiMoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 scroll-smooth"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Load more spinner */}
        <AnimatePresence>
          {isLoading && convMessages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-8"
            >
              <div className="w-7 h-7 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
          {isLoading && convMessages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 28 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-center py-1"
            >
              <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty thread */}
        {!isLoading && convMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Say hello to {conv.otherUser?.username || 'your contact'}!
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              This is the beginning of your conversation.
            </p>
          </div>
        )}

        {/* Message items with date separators */}
        <AnimatePresence initial={false}>
          {grouped.map((item) =>
            item.type === 'separator' ? (
              <div key={item.key} className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {item.label}
                </span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>
            ) : (
              <MessageBubble
                key={item.id}
                message={item}
                isMine={item.senderId === user?.uid}
                onDelete={handleDelete}
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

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <MessageInput conversationId={activeConversationId} disabled={!activeConversationId} />
    </div>
  );
};

export default ChatWindow;
