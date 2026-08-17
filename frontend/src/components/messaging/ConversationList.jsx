import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiSearch, FiX } from 'react-icons/fi';
import { useDM } from '../../context/DMContext';
import ConversationItem from './ConversationItem';

const ConversationList = ({ onNewChat, searchQuery, onSearchChange }) => {
  const { conversations, activeConversationId, openConversation, loadingConversations } = useDM();
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'

  const filtered = conversations.filter((c) => {
    // Filter by search query
    if (searchQuery) {
      const name = c.otherUser?.username?.toLowerCase() || '';
      if (!name.includes(searchQuery.toLowerCase())) return false;
    }
    // Filter by tab
    if (filterTab === 'unread') {
      return (c.unreadCount || 0) > 0;
    }
    return true;
  });

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200/70 dark:border-gray-700/60">

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Messages
            </h2>
            {conversations.length > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 8 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNewChat}
            className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow"
            title="New conversation"
          >
            <FiEdit2 className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-9 pr-8 py-2.5 text-xs bg-gray-100/80 dark:bg-gray-800/80 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 focus:bg-white dark:focus:bg-gray-800 rounded-2xl outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-800/60 p-1 rounded-xl">
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'all'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterTab('unread')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              filterTab === 'unread'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <span>Unread</span>
            {unreadTotal > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadTotal}
              </span>
            )}
          </button>
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
              {searchQuery ? '🔍' : filterTab === 'unread' ? '✨' : '💬'}
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {searchQuery
                ? 'No matches found'
                : filterTab === 'unread'
                ? 'No unread messages'
                : 'No conversations yet'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              {searchQuery
                ? `Nothing matches "${searchQuery}"`
                : filterTab === 'unread'
                ? 'You are all caught up!'
                : 'Start a conversation with a campus peer'}
            </p>
            {!searchQuery && filterTab === 'all' && (
              <button
                onClick={onNewChat}
                className="px-4 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-shadow"
              >
                + New Message
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

