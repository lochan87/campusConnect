import React from 'react';
import { motion } from 'framer-motion';

const dotVariants = {
  start: { y: 0 },
  end: { y: -6 },
};

const TypingIndicator = ({ typers = {} }) => {
  const names = Object.values(typers);
  if (names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : 'Several people are typing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="flex items-center gap-2 px-4 py-1"
    >
      {/* Animated dots */}
      <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded-2xl px-3 py-2 shadow-sm border border-gray-100 dark:border-gray-600">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo-400"
            variants={dotVariants}
            initial="start"
            animate="end"
            transition={{
              repeat: Infinity,
              repeatType: 'reverse',
              duration: 0.4,
              delay: i * 0.12,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500 italic">{label}</span>
    </motion.div>
  );
};

export default TypingIndicator;
