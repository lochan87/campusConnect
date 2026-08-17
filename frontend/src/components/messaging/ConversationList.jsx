import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiSearch } from 'react-icons/fi';
import { useDM } from '../../context/DMContext';
import ConversationItem from './ConversationItem';

const ConversationList = ({ onNewChat, searchQuery, onSearchChange }) => {
  const { conversations, activeConversationId, openConversation, loadingConversations } = useDM();

  const filtered = conversations.filter((c) => {
    if (!searchQuery) return true;
    const name = c.otherUser?.username?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Messages</h2>
            {conversations.length > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onNewChat}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow"
            title="New conversation"
          >
            <FiEdit2 className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-700/80 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 rounded-2xl outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
          />
        </div>
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Skeleton */}
        {loadingConversations && filtered.length === 0 && (
          <div className="flex flex-col gap-1 px-3 pt-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" style={{ width: `${55 + i * 5}%` }} />
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-700/60 rounded-full animate-pulse" style={{ width: `${35 + i * 4}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingConversations && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4 text-3xl shadow-inner">
              {searchQuery ? '🔍' : '💬'}
            </div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
              {searchQuery ? 'No matches found' : 'No conversations yet'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              {searchQuery
                ? `Nothing matches "${searchQuery}"`
                : 'Start a conversation with a campus mate'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewChat}
                className="px-4 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-shadow"
              >
                New Message
              </button>
            )}
          </div>
        )}

        {/* Conversation items */}
        <AnimatePresence>
          {filtered.map((conv, i) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.03 }}
            >
              <ConversationItem
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onClick={() => openConversation(conv.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConversationList;
