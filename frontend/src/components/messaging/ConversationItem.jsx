import React from 'react';
import { motion } from 'framer-motion';
import { FiUser } from 'react-icons/fi';
import { useDM } from '../../context/DMContext';

const formatRelativeTime = (ts) => {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return '';
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const ConversationItem = ({ conversation, isActive, onClick }) => {
  const { typingUsers } = useDM();
  const convTyping = typingUsers[conversation.id] || {};
  const isTyping = Object.keys(convTyping).length > 0;
  const hasUnread = conversation.unreadCount > 0;

  const lastMsg = conversation.lastMessage;
  let preview = isTyping
    ? 'typing…'
    : lastMsg
    ? lastMsg.type === 'image'
      ? '📷 Image'
      : lastMsg.text
    : 'Start a conversation';

  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left ${
        isActive
          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-r-2 border-indigo-500'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {conversation.otherUser?.avatar ? (
          <img
            src={conversation.otherUser.avatar}
            alt={conversation.otherUser?.username}
            className={`w-11 h-11 rounded-full object-cover ${
              isActive ? 'ring-2 ring-indigo-400' : ''
            }`}
          />
        ) : (
          <div
            className={`w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center ${
              isActive ? 'ring-2 ring-indigo-400' : ''
            }`}
          >
            <FiUser className="w-5 h-5 text-white" />
          </div>
        )}
        {/* Online dot placeholder — can be activated with presence tracking */}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p
            className={`text-sm font-semibold truncate ${
              hasUnread
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            {conversation.otherUser?.username || 'Unknown'}
          </p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap ml-1 flex-shrink-0">
            {formatRelativeTime(lastMsg?.timestamp || conversation.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p
            className={`text-xs truncate ${
              isTyping
                ? 'text-indigo-500 dark:text-indigo-400 italic'
                : hasUnread
                ? 'text-gray-700 dark:text-gray-300 font-medium'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {preview}
          </p>

          {/* Unread badge */}
          {hasUnread && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex-shrink-0 ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center"
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
