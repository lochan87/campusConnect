import React from 'react';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiShield, FiZap } from 'react-icons/fi';

const EmptyChatState = ({ onNewChat }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 relative overflow-hidden">
    
    {/* Decorative background glow circles */}
    <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

    <motion.div
      initial={{ scale: 0.88, opacity: 0, y: 16 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className="flex flex-col items-center text-center max-w-sm relative z-10"
    >
      {/* Decorative icon box */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
          <FiMessageSquare className="w-11 h-11 text-white" />
        </div>
        {/* Animated outer ring */}
        <div className="absolute -inset-2 rounded-3xl border border-indigo-300/40 dark:border-indigo-500/30 animate-pulse pointer-events-none" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
        Campus Direct Messaging
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
        Send real-time private messages to students & peers across your campus.
      </p>

      {/* Highlights pills */}
      <div className="flex items-center justify-center gap-4 mb-7 text-xs font-semibold text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-xs border border-gray-100 dark:border-gray-700">
          <FiZap className="w-3.5 h-3.5 text-amber-500" />
          <span>Real-time</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-xs border border-gray-100 dark:border-gray-700">
          <FiShield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Private</span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNewChat}
        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all flex items-center gap-2"
      >
        <span>+ Start a Conversation</span>
      </motion.button>
    </motion.div>
  </div>
);

export default EmptyChatState;

