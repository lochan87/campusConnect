import React from 'react';

const LoadingSkeleton = ({ type = 'post', count = 3 }) => {
  const PostSkeleton = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/3"></div>
        </div>
        <div className="h-6 bg-gray-300 rounded-full w-16"></div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      </div>
      
      <div className="flex items-center space-x-4 pt-3 border-t border-gray-100">
        <div className="h-4 bg-gray-300 rounded w-12"></div>
        <div className="h-4 bg-gray-300 rounded w-16"></div>
        <div className="h-4 bg-gray-300 rounded w-12"></div>
      </div>
    </div>
  );

  const PollSkeleton = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-purple-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/4"></div>
        </div>
        <div className="h-4 bg-gray-300 rounded w-16"></div>
      </div>
      
      <div className="h-5 bg-gray-300 rounded w-2/3 mb-4"></div>
      
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 border border-gray-200 rounded-lg">
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const SidebarSkeleton = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
        <div className="h-5 bg-gray-300 rounded w-1/2 mb-3"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-300 rounded w-full"></div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'poll':
        return <PollSkeleton />;
      case 'sidebar':
        return <SidebarSkeleton />;
      default:
        return <PostSkeleton />;
    }
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
