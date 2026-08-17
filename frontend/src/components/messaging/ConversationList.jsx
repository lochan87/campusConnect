import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit, FiSearch } from 'react-icons/fi';
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Messages</h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNewChat}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30"
            title="New conversation"
          >
            <FiEdit className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Search filter */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 rounded-xl outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loadingConversations && filtered.length === 0 && (
          <div className="flex flex-col gap-3 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingConversations && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewChat}
                className="mt-3 text-xs text-indigo-500 hover:text-indigo-600 font-medium"
              >
                Start one →
              </button>
            )}
          </div>
        )}

        <AnimatePresence>
          {filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onClick={() => openConversation(conv.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConversationList;
