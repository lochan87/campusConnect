import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiMessageCircle, FiShare2, FiMapPin, FiClock, FiMoreHorizontal, FiEdit2, FiTrash2 } from 'react-icons/fi';

const PostCard = ({ post, currentUser, onVote, onComment, onShare, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const {
    id,
    title,
    content,
    userName,
    userId,
    category,
    location,
    createdAt,
    upvotes,
    commentCount,
    isAnonymous,
    imageUrl, // Legacy field for backward compatibility
    imageData, // New Base64 data field
    imageMetadata
  } = post;

  const handleVote = async (type) => {
    if (onVote && !isLiking) {
      setIsLiking(true);
      try {
        await onVote(id, type);
      } catch (error) {
        console.error('Error voting:', error);
      } finally {
        setTimeout(() => setIsLiking(false), 300); // Brief delay for visual feedback
      }
    }
  };

  const timeAgo = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffMs = now - postTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      events: 'bg-blue-100 text-blue-800',
      lost_found: 'bg-yellow-100 text-yellow-800',
      food: 'bg-green-100 text-green-800',
      memes: 'bg-purple-100 text-purple-800',
      announcements: 'bg-red-100 text-red-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category?.toLowerCase()] || colors.general;
  };

  const formatLocation = (loc) => {
    if (!loc) return '';
    return loc.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isOwner = currentUser && (currentUser.uid === userId || currentUser.id === userId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200"
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              {isAnonymous ? (
                <span className="text-xs">👤</span>
              ) : (
                <span className="text-xs font-medium text-gray-600">
                  {userName?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-900">
                  {isAnonymous ? 'Anonymous' : userName || 'Unknown User'}
                </p>
                {isOwner && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Your Post
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="flex items-center">
                  <FiClock className="w-3 h-3 mr-1" />
                  {timeAgo(createdAt)}
                </span>
                {location && (
                  <span className="flex items-center">
                    <FiMapPin className="w-3 h-3 mr-1" />
                    {formatLocation(location)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {category && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(category)}`}>
                {category.replace(/_/g, ' ')}
              </span>
            )}
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <FiMoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
              
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10"
                >
                  <div className="py-1">
                    {isOwner && (
                      <>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onEdit && onEdit(post);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FiEdit2 className="w-4 h-4 mr-2" />
                          Edit Post
                        </button>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onDelete && onDelete(id);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <FiTrash2 className="w-4 h-4 mr-2" />
                          Delete Post
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        // TODO: Report functionality
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Report Post
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        )}
        <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
        
        {(imageData || imageUrl) && (
          <div className="mt-3">
            <img 
              src={imageData || imageUrl} 
              alt="Post content" 
              className="w-full h-64 object-cover rounded-lg"
              onError={(e) => {
                console.error('Failed to load image');
                e.target.style.display = 'none';
              }}
            />
            {imageMetadata && (
              <div className="text-xs text-gray-500 mt-1">
                {imageMetadata.originalName} • {Math.round(imageMetadata.size / 1024)}KB
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleVote('up')}
              disabled={isLiking}
              className={`flex items-center space-x-1 transition-colors ${
                isLiking 
                  ? 'text-red-500' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <motion.div
                animate={isLiking ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <FiHeart className={`w-4 h-4 ${isLiking ? 'fill-current' : ''}`} />
              </motion.div>
              <span className="text-sm font-medium">{upvotes || 0}</span>
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onComment && onComment(id)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <FiMessageCircle className="w-4 h-4" />
              <span className="text-sm">{commentCount || 0}</span>
            </motion.button>
          </div>
          
          <button
            onClick={() => onShare && onShare(id)}
            className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors"
          >
            <FiShare2 className="w-4 h-4" />
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;
