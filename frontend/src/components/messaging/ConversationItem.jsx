import React from 'react';
import { motion } from 'framer-motion';
import { FiUser } from 'react-icons/fi';
import { useDM } from '../../context/DMContext';
import { useAuth } from '../../context/AuthContext';

const formatRelativeTime = (ts) => {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return '';
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const ConversationItem = ({ conversation, isActive, onClick }) => {
  const { typingUsers } = useDM();
  const { user } = useAuth();
  const convTyping = typingUsers[conversation.id] || {};
  const isTyping = Object.keys(convTyping).length > 0;
  const hasUnread = conversation.unreadCount > 0;

  const lastMsg = conversation.lastMessage;

  // Build preview text
  let previewText = '';
  if (isTyping) {
    previewText = null; // handled separately
  } else if (lastMsg) {
    const isMe = lastMsg.senderId === user?.uid;
    const msgText = lastMsg.type === 'image' ? '📷 Photo' : (lastMsg.text || '');
    previewText = isMe ? `You: ${msgText}` : msgText;
  } else {
    previewText = 'Start a conversation';
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left relative ${
        isActive
          ? 'bg-indigo-50 dark:bg-indigo-900/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
      }`}
    >
      {/* Active indicator bar */}
      {isActive && (
        <motion.div
          layoutId="activeBar"
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 rounded-r-full"
        />
      )}

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {conversation.otherUser?.avatar ? (
          <img
            src={conversation.otherUser.avatar}
            alt={conversation.otherUser?.username}
            className={`w-12 h-12 rounded-full object-cover transition-all ${
              isActive ? 'ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-gray-800' : ''
            }`}
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-base transition-all ${
              isActive ? 'ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-gray-800' : ''
            }`}
          >
            {(conversation.otherUser?.username || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <p
            className={`text-sm truncate ${
              hasUnread
                ? 'font-bold text-gray-900 dark:text-white'
                : 'font-semibold text-gray-700 dark:text-gray-200'
            }`}
          >
            {conversation.otherUser?.username || 'Unknown'}
          </p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
            {formatRelativeTime(lastMsg?.timestamp || conversation.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {isTyping ? (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1 h-1 rounded-full bg-indigo-400"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                  />
                ))}
              </div>
              <span className="text-xs text-indigo-500 dark:text-indigo-400 italic">typing…</span>
            </div>
          ) : (
            <p
              className={`text-xs truncate ${
                hasUnread
                  ? 'text-gray-700 dark:text-gray-300 font-medium'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {previewText}
            </p>
          )}

          {/* Unread badge */}
          {hasUnread && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center"
            >
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </motion.span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default ConversationItem;
