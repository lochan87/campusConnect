import React from 'react';
import { motion } from 'framer-motion';
import { FiMessageSquare } from 'react-icons/fi';

const EmptyChatState = ({ onNewChat }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 20 }}
      className="flex flex-col items-center text-center max-w-xs"
    >
      {/* Decorative icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
          <FiMessageSquare className="w-12 h-12 text-white" />
        </div>
        {/* Ping rings */}
        <div className="absolute inset-0 rounded-3xl animate-ping bg-indigo-400/20" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Your Messages
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
        Send private messages to your campus peers. Start a conversation and connect directly.
      </p>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onNewChat}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow"
      >
        + Start a Conversation
      </motion.button>
    </motion.div>
  </div>
);

export default EmptyChatState;
