import React from 'react';
import { motion } from 'framer-motion';

const LoadingSkeleton = ({ type = 'post', count = 3 }) => {
  const SkeletonLine = ({ width, height = 'h-4', delay = 0 }) => (
    <motion.div 
      className={`${height} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded ${width}`}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity, delay }}
    />
  );

  const PostSkeleton = ({ index }) => (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className="flex items-center space-x-4 mb-6">
        <motion.div 
          className="w-10 h-10 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
        />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="w-1/4" delay={index * 0.1} />
          <SkeletonLine width="w-1/3" height="h-3" delay={index * 0.1 + 0.1} />
        </div>
        <SkeletonLine width="w-16" height="h-6" delay={index * 0.1 + 0.2} />
      </div>
      
      <div className="space-y-3 mb-6">
        <SkeletonLine width="w-full" delay={index * 0.1 + 0.3} />
        <SkeletonLine width="w-4/5" delay={index * 0.1 + 0.4} />
        <SkeletonLine width="w-3/5" delay={index * 0.1 + 0.5} />
      </div>
      
      <div className="flex items-center space-x-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <SkeletonLine width="w-12" delay={index * 0.1 + 0.6} />
        <SkeletonLine width="w-16" delay={index * 0.1 + 0.7} />
        <SkeletonLine width="w-12" delay={index * 0.1 + 0.8} />
      </div>
    </motion.div>
  );

  const PollSkeleton = ({ index }) => (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className="flex items-center space-x-4 mb-6">
        <motion.div 
          className="w-10 h-10 bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-900/50 dark:to-emerald-900/50 rounded-full"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
        />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="w-1/3" delay={index * 0.1} />
          <SkeletonLine width="w-1/4" height="h-3" delay={index * 0.1 + 0.1} />
        </div>
        <SkeletonLine width="w-16" delay={index * 0.1 + 0.2} />
      </div>
      
      <SkeletonLine width="w-2/3" height="h-5" delay={index * 0.1 + 0.3} />
      
      <div className="space-y-4 mt-6">
        {[1, 2, 3].map((i) => (
          <motion.div 
            key={i} 
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 + i * 0.1 }}
          >
            <SkeletonLine width="w-1/2" delay={index * 0.1 + i * 0.1} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const SidebarSkeleton = ({ index }) => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <motion.div 
            className="w-6 h-6 bg-gradient-to-r from-purple-200 to-violet-200 dark:from-purple-900/50 dark:to-violet-900/50 rounded"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
          />
          <SkeletonLine width="w-1/2" delay={index * 0.1} />
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 + i * 0.1 }}
            >
              <div className="flex items-center space-x-3 p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                <motion.div 
                  className="w-8 h-8 bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-900/50 dark:to-indigo-900/50 rounded"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, delay: index * 0.1 + i * 0.2 }}
                />
                <div className="flex-1 space-y-2">
                  <SkeletonLine width="w-3/4" height="h-3" delay={index * 0.1 + i * 0.1} />
                  <SkeletonLine width="w-1/2" height="h-2" delay={index * 0.1 + i * 0.1 + 0.1} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderSkeleton = (index) => {
    switch (type) {
      case 'poll':
        return <PollSkeleton index={index} />;
      case 'sidebar':
        return <SidebarSkeleton index={index} />;
      default:
        return <PostSkeleton index={index} />;
    }
  };

  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton(index)}
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
