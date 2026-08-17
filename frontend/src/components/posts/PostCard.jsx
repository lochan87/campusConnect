import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiShare2, FiMapPin, FiClock, FiMoreHorizontal, FiEdit2, FiTrash2, FiFlag } from 'react-icons/fi';
import confetti from 'canvas-confetti';
import ReportPostModal from './ReportPostModal';
import { formatTimeAgo } from '../../utils/formatTimeAgo';

const REACTIONS = [
  { emoji: '❤️', label: 'Like' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '😂', label: 'Funny' },
  { emoji: '👀', label: 'Interesting' },
  { emoji: '💡', label: 'Helpful' },
  { emoji: '😲', label: 'Wow' },
];

const PostCard = ({ post, currentUser, onLike, onShare, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState(post.userHasLiked || false);
  const [optimisticLikes, setOptimisticLikes] = useState(post.likes || 0);
  const [reportModal, setReportModal] = useState({ isOpen: false });
  const menuRef = useRef(null);
  const likeButtonRef = useRef(null);
  const [selectedReaction, setSelectedReaction] = useState('❤️');
  const [showReactions, setShowReactions] = useState(false);
  const reactionHideTimer = useRef(null);

  const fireConfetti = () => {
    if (!likeButtonRef.current) return;
    const rect = likeButtonRef.current.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      particleCount: 25,
      spread: 55,
      origin: { x, y },
      colors: ['#ef4444', '#f97316', '#ec4899', '#a855f7'],
      startVelocity: 20,
      gravity: 0.8,
      ticks: 80,
      scalar: 0.75,
    });
  };


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

  // Sync optimistic state with actual post data when server updates arrive
  // Note: intentionally excludes optimisticLiked/optimisticLikes to avoid self-triggering loop
  useEffect(() => {
    if (!isLiking) {
      setOptimisticLiked(post.userHasLiked || false);
      setOptimisticLikes(post.likes || 0);
    }
  }, [post.userHasLiked, post.likes, isLiking, post.id]);

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

      // Store original values for rollback
      const previousLiked = optimisticLiked;
      const previousLikes = optimisticLikes;

      // Optimistic update
      const newLikes = optimisticLiked ? Math.max(0, optimisticLikes - 1) : optimisticLikes + 1;
      const newLiked = !optimisticLiked;

      setOptimisticLiked(newLiked);
      setOptimisticLikes(newLikes);

      // Fire confetti only when liking (not unliking)
      if (newLiked) fireConfetti();

      try {
        const result = await onLike(id);

        // Update with actual server response if available
        if (result && result.success) {
          setOptimisticLiked(result.userHasLiked);
          setOptimisticLikes(result.likes);
        }
      } catch (error) {
        console.error('Error liking post:', error);
        // Revert optimistic update on error
        setOptimisticLiked(previousLiked);
        setOptimisticLikes(previousLikes);
      } finally {
        setTimeout(() => setIsLiking(false), 300);
      }
    }
  };

  // Feature #9 — Reaction picker: selects emoji and calls like if not yet liked
  const handleReactionSelect = async (reaction) => {
    clearTimeout(reactionHideTimer.current);
    setShowReactions(false);
    setSelectedReaction(reaction.emoji);
    // Only trigger the like API if the post isn't already liked
    if (!optimisticLiked) {
      await handleLike();
    }
  };

  // formatTimeAgo is imported from utils/formatTimeAgo

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

  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const clickTimeoutRef = useRef(null);
  const lastClickTimeRef = useRef(0);

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
    if (isClickableElement || isInsideClickable) return;

    const now = Date.now();
    const timeDiff = now - lastClickTimeRef.current;
    lastClickTimeRef.current = now;

    if (timeDiff < 280) {
      // Double click detected — cancel navigation timer & trigger heart animation + like!
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      setShowDoubleTapHeart(true);
      if (!optimisticLiked) {
        handleLike();
      } else {
        fireConfetti();
      }
      setTimeout(() => setShowDoubleTapHeart(false), 900);
    } else {
      // Single click — set timer for page navigation
      clickTimeoutRef.current = setTimeout(() => {
        navigate(`/post/${id}`);
      }, 280);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ rotateY: 2, rotateX: -1, scale: 1.01, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-shadow duration-200 cursor-pointer will-change-transform overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Floating double-tap heart overlay animation */}
      <AnimatePresence>
        {showDoubleTapHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1.1, 1.2, 0], opacity: [0, 1, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none drop-shadow-2xl"
          >
            <div className="w-24 h-24 bg-red-500/90 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm border-4 border-white/40">
              <span className="text-5xl leading-none select-none animate-pulse">❤️</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
                  {formatTimeAgo(createdAt)}
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
            {/* Reaction Picker Wrapper */}
            <div
              className="relative"
              onMouseEnter={() => {
                clearTimeout(reactionHideTimer.current);
                setShowReactions(true);
              }}
              onMouseLeave={() => {
                reactionHideTimer.current = setTimeout(() => setShowReactions(false), 250);
              }}
            >
              {/* Reaction emoji row — springs in above the button on hover */}
              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                    className="absolute bottom-full left-0 mb-2 flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 px-2 py-1.5 z-20"
                  >
                    {REACTIONS.map((reaction, i) => (
                      <motion.button
                        key={reaction.emoji}
                        initial={{ scale: 0, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: 'spring', delay: i * 0.04, stiffness: 400, damping: 14 }}
                        whileHover={{ scale: 1.45, y: -5 }}
                        onClick={(e) => { e.stopPropagation(); handleReactionSelect(reaction); }}
                        title={reaction.label}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-xl leading-none transition-colors"
                      >
                        {reaction.emoji}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Like / reaction button */}
              <motion.button
                ref={likeButtonRef}
                whileTap={{ scale: 0.85 }}
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
                  animate={optimisticLiked
                    ? { scale: [1, 1.4, 0.9, 1.15, 1], rotate: [0, -15, 10, -5, 0] }
                    : { scale: 1, rotate: 0 }
                  }
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                >
                  {optimisticLiked ? (
                    <span className="text-base leading-none select-none">{selectedReaction}</span>
                  ) : (
                    <FiHeart className="w-4 h-4" />
                  )}
                </motion.div>
                <span className="text-sm font-medium">{optimisticLikes}</span>
              </motion.button>
            </div>
            
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
// Wrap in memo — prevents re-render when parent state changes but this post's data hasn't changed
export default memo(PostCard, (prev, next) => {
  return (
    prev.post.id === next.post.id &&
    prev.post.likes === next.post.likes &&
    prev.post.userHasLiked === next.post.userHasLiked &&
    prev.post.commentCount === next.post.commentCount &&
    prev.post.content === next.post.content &&
    prev.currentUser?.uid === next.currentUser?.uid
  );
});
