import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiShare2, FiMapPin, FiClock, FiMoreHorizontal, FiEdit2, FiTrash2, FiFlag } from 'react-icons/fi';
import ReportPostModal from './ReportPostModal';

const PostCard = ({ post, currentUser, onLike, onShare, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState(post.userHasLiked || false);
  const [optimisticLikes, setOptimisticLikes] = useState(post.likes || 0);
  const [reportModal, setReportModal] = useState({ isOpen: false });
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

  // Sync optimistic state with actual post data
  useEffect(() => {
    if (!isLiking) {
      console.log('PostCard syncing state for post', post.id, ':', {
        userHasLiked: post.userHasLiked,
        likes: post.likes,
        optimisticLiked,
        optimisticLikes
      });
      setOptimisticLiked(post.userHasLiked || false);
      setOptimisticLikes(post.likes || 0);
    }
  }, [post.userHasLiked, post.likes, isLiking, post.id, optimisticLiked, optimisticLikes]);

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

  const handleLike = async () => {
    if (onLike && !isLiking && currentUser) {
      setIsLiking(true);
      
      console.log('PostCard handleLike - Before:', {
        postId: id,
        currentLiked: optimisticLiked,
        currentLikes: optimisticLikes
      });
      
      // Store original values for rollback
      const previousLiked = optimisticLiked;
      const previousLikes = optimisticLikes;
      
      // Optimistic update
      let newLikes = optimisticLiked ? Math.max(0, optimisticLikes - 1) : optimisticLikes + 1;
      let newLiked = !optimisticLiked;
      
      setOptimisticLiked(newLiked);
      setOptimisticLikes(newLikes);
      
      console.log('PostCard handleLike - Optimistic update:', {
        newLiked,
        newLikes
      });
      
      try {
        const result = await onLike(id);
        
        console.log('PostCard handleLike - Server result:', result);
        
        // Update with actual server response if available
        if (result && result.success) {
          console.log('PostCard handleLike - Updating with server data:', {
            userHasLiked: result.userHasLiked,
            likes: result.likes
          });
          setOptimisticLiked(result.userHasLiked);
          setOptimisticLikes(result.likes);
        }
      } catch (error) {
        console.error('Error liking post:', error);
        // Revert optimistic update on error
        console.log('PostCard handleLike - Reverting due to error');
        setOptimisticLiked(previousLiked);
        setOptimisticLikes(previousLikes);
      } finally {
        setTimeout(() => setIsLiking(false), 300);
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
      events: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      lost_found: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      food: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      memes: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      announcements: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      general: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    };
    return colors[category?.toLowerCase()] || colors.general;
  };

  const formatLocation = (loc) => {
    if (!loc) return '';
    return loc.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isOwner = currentUser && (currentUser.uid === userId || currentUser.id === userId);

  const handleCardClick = (e) => {
    // Don't navigate if clicking on interactive elements
    const clickableElements = ['button', 'a', 'input', 'textarea'];
    const isClickableElement = clickableElements.includes(e.target.tagName.toLowerCase());
    const isInsideClickable = e.target.closest('button, a, input, textarea');
    
    if (!isClickableElement && !isInsideClickable) {
      navigate(`/post/${id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              {isAnonymous ? (
                <span className="text-xs">👤</span>
              ) : (
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {userName?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {isAnonymous ? 'Anonymous' : userName || 'Unknown User'}
                </p>
                {isOwner && (
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                    Your Post
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
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
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <FiMoreHorizontal className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
              
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                >
                  <div className="py-1">
                    {isOwner && (
                      <>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onEdit && onEdit(post);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FiEdit2 className="w-4 h-4 mr-2" />
                          Edit Post
                        </button>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onDelete && onDelete(id);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <FiTrash2 className="w-4 h-4 mr-2" />
                          Delete Post
                        </button>
                      </>
                    )}
                    {!isOwner && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setReportModal({ isOpen: true });
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FiFlag className="w-4 h-4 mr-2" />
                        Report Post
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-words leading-tight">
            {title}
          </h3>
          {content && (
            <p className="text-gray-700 dark:text-gray-300 mt-2 break-words whitespace-pre-wrap leading-relaxed">
              {content}
            </p>
          )}
        </div>
        
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
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {imageMetadata.originalName} • {Math.round(imageMetadata.size / 1024)}KB
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              disabled={isLiking || !currentUser}
              className={`flex items-center space-x-1 transition-colors ${
                optimisticLiked
                  ? 'text-red-500' 
                  : isLiking 
                    ? 'text-red-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
              }`}
            >
              <motion.div
                animate={isLiking ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <FiHeart className={`w-4 h-4 ${optimisticLiked ? 'fill-current' : ''}`} />
              </motion.div>
              <span className="text-sm font-medium">{optimisticLikes}</span>
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/post/${id}`);
              }}
              className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
            >
              <FiMessageCircle className="w-4 h-4" />
              <span className="text-sm">{commentCount || 0}</span>
            </motion.button>
          </div>
          
          <button
            onClick={() => onShare && onShare(id)}
            className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-green-500 transition-colors"
          >
            <FiShare2 className="w-4 h-4" />
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>

      {/* Report Post Modal */}
      <ReportPostModal
        post={post}
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false })}
      />
    </motion.div>
  );
};

export default PostCard;
