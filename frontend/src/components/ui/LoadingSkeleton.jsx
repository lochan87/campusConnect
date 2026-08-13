import React from 'react';
import { motion } from 'framer-motion';

const LoadingSkeleton = ({ type = 'post', count = 3 }) => {
  // Shimmer wave skeleton line — bright highlight sweeps left-to-right via CSS
  const SkeletonLine = ({ width, height = 'h-4' }) => (
    <div className={`shimmer-wave ${height} rounded ${width}`} />
  );

  const PostSkeleton = ({ index }) => (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className="flex items-center space-x-4 mb-6">
        <div className="shimmer-wave w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="w-1/4" />
          <SkeletonLine width="w-1/3" height="h-3" />
        </div>
        <SkeletonLine width="w-16" height="h-6" />
      </div>

      <div className="space-y-3 mb-6">
        <SkeletonLine width="w-full" height="h-5" />
        <SkeletonLine width="w-4/5" />
        <SkeletonLine width="w-3/5" />
      </div>

      <div className="flex items-center space-x-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <SkeletonLine width="w-12" />
        <SkeletonLine width="w-16" />
        <SkeletonLine width="w-12" />
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
        <div className="shimmer-wave w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="w-1/3" />
          <SkeletonLine width="w-1/4" height="h-3" />
        </div>
        <SkeletonLine width="w-16" />
      </div>

      <SkeletonLine width="w-2/3" height="h-5" />

      <div className="space-y-4 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="shimmer-wave h-12 rounded-lg" />
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
          <div className="shimmer-wave w-6 h-6 rounded flex-shrink-0" />
          <SkeletonLine width="w-1/2" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3 p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
              <div className="shimmer-wave w-8 h-8 rounded flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonLine width="w-3/4" height="h-3" />
                <SkeletonLine width="w-1/2" height="h-2" />
              </div>
            </div>
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
