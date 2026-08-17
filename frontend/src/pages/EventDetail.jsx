import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiMapPin, 
  FiClock, 
  FiEdit2, 
  FiTrash2,
  FiShare2,
  FiFlag,
  FiHeart,
  FiMessageCircle,
  FiSend
} from 'react-icons/fi';
import ReportEventModal from '../components/events/ReportEventModal';
import DeleteEventModal from '../components/events/DeleteEventModal';
import DeleteEventCommentModal from '../components/events/DeleteEventCommentModal';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { getEvent, deleteEvent, likeEvent, getEventComments, addEventComment, deleteEventComment } from '../services/api';
import toast from 'react-hot-toast';

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportModal, setReportModal] = useState({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false });
  const [deleteCommentModal, setDeleteCommentModal] = useState({ isOpen: false, comment: null, userRole: null });
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const commentsLoaded = useRef(false);

  const fetchComments = useCallback(async () => {
    if (!eventId) return;
    
    // Don't fetch if already loaded for this event
    if (commentsLoaded.current) return;
    
    setCommentsLoading(true);
    commentsLoaded.current = true;
    try {
      const response = await getEventComments(eventId);
      if (response.data.success) {
        setComments(response.data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
      commentsLoaded.current = false; // Reset on error so it can retry
    } finally {
      setCommentsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]); // commentsLoading is intentionally omitted to avoid dependency cycle

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await getEvent(eventId, user?.uid);
        setEvent(response.data.event);
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Failed to load event');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      // Reset comments loaded flag for new event
      commentsLoaded.current = false;
      fetchEvent();
      fetchComments(); // Fetch comments automatically
    }
  }, [eventId, navigate, user?.uid, fetchComments]);

  // Handle keyboard events for poster modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showPosterModal) {
        setShowPosterModal(false);
      }
    };

    if (showPosterModal) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showPosterModal]);

  const handleEdit = () => {
    navigate(`/events/edit/${eventId}`);
  };

  const handleDelete = () => {
    setDeleteModal({ isOpen: true });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEvent(eventId);
      toast.success('Event deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false });
    }
  };

  const handleShare = () => {
    const eventUrl = `${window.location.origin}/event/${eventId}`;
    navigator.clipboard.writeText(eventUrl).then(() => {
      toast.success('Event link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like events');
      return;
    }

    try {
      // Optimistically update UI
      const wasLiked = event.userHasLiked;
      const newLikeCount = wasLiked ? event.likesCount - 1 : event.likesCount + 1;
      
      setEvent(prev => ({
        ...prev,
        userHasLiked: !wasLiked,
        likesCount: newLikeCount
      }));

      await likeEvent(eventId, user.uid);
    } catch (error) {
      // Revert on error
      setEvent(prev => ({
        ...prev,
        userHasLiked: event.userHasLiked,
        likesCount: event.likesCount
      }));
      console.error('Error liking event:', error);
      toast.error('Failed to like event');
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    const currentComment = commentText.trim();
    
    // Create optimistic comment
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      content: currentComment,
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    try {
      // Add optimistic comment to UI
      setComments(prev => [optimisticComment, ...prev]);
      setCommentText('');

      // Submit comment
      const response = await addEventComment(eventId, currentComment, user.uid, false);
      
      if (response.data.success) {
        // Replace optimistic comment with real one
        setComments(prev => 
          prev.map(c => c.id === optimisticComment.id ? response.data.comment : c)
        );
        
        // Update event data
        setEvent(prev => ({
          ...prev,
          commentsCount: (prev.commentsCount || 0) + 1
        }));
        
        toast.success('Comment added successfully!');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      
      // Check if it's a network error vs actual server error
      const isNetworkError = !error.response || error.code === 'NETWORK_ERROR' || error.message.includes('timeout');
      
      if (isNetworkError) {
        toast.error('Network error - please check if your comment was posted');
        setTimeout(() => {
          toast('Refresh the page to see if your comment was posted', {
            duration: 5000,
            icon: '🔄'
          });
        }, 2000);
      } else {
        // Remove optimistic comment for actual server errors
        setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
        setCommentText(currentComment);
        
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to add comment';
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteComment = (comment) => {
    // Determine user role for this comment
    let userRole = null;
    const isCommentAuthor = user && comment.userId === user.uid;
    const isEventOwner = user && event && event.userId === user.uid;
    
    if (isCommentAuthor && isEventOwner) {
      userRole = 'author-owner';
    } else if (isCommentAuthor) {
      userRole = 'author';
    } else if (isEventOwner) {
      userRole = 'owner';
    }

    if (userRole) {
      setDeleteCommentModal({
        isOpen: true,
        comment,
        userRole
      });
    }
  };

  const handleConfirmDeleteComment = async (commentId) => {
    if (!commentId || !user) return;

    try {
      await deleteEventComment(eventId, commentId, user.uid);
      
      // Remove comment from local state
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      // Update event comment count
      setEvent(prev => ({
        ...prev,
        commentsCount: Math.max(0, (prev.commentsCount || 0) - 1)
      }));
      
      toast.success('Comment deleted successfully');
      setDeleteCommentModal({ isOpen: false, comment: null, userRole: null });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSkeleton type="post" count={1} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Event not found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">The event you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.uid === event.userId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6"
    >
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <motion.button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Event Details</h1>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={handleShare}
            className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center space-x-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiShare2 className="w-4 h-4" />
          </motion.button>
          {isOwner && (
            <>
              <motion.button
                onClick={handleEdit}
                className="px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex items-center space-x-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiEdit2 className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={handleDelete}
                className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center space-x-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiTrash2 className="w-4 h-4" />
              </motion.button>
            </>
          )}
          {!isOwner && user && (
            <motion.button
              onClick={() => setReportModal({ isOpen: true })}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiFlag className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Event Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side - Event Details Container */}
        <motion.div
          className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-6">
            {/* Event Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  {event.isAnonymous ? (
                    <span className="text-lg">👤</span>
                  ) : (
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {event.creator?.name?.charAt(0) || event.userName?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {event.isAnonymous ? 'Anonymous' : (event.creator?.name || event.userName || 'Unknown User')}
                    </p>
                    {isOwner && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                        Your Event
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <FiClock className="w-3 h-3 mr-1" />
                      {new Date(event.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <FiMapPin className="w-3 h-3 mr-1" />
                      {event.location}
                    </span>
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                Event
              </span>
            </div>

            <div className="space-y-6">
              {/* Event Title */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{event.title}</h2>
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <FiCalendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(event.date)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <FiClock className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Time</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatTime(event.time || event.startTime)}</p>
                  </div>
                </div>
              </div>

              {/* Event Description */}
              {event.description && event.description.trim() && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">About this Event</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {/* Event Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <motion.button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                      event.userHasLiked
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    disabled={!user}
                    whileHover={{ scale: event.userHasLiked ? 1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiHeart 
                      className={`w-4 h-4 ${event.userHasLiked ? 'fill-current' : ''}`} 
                    />
                    <span className="font-medium">{event.likesCount || 0}</span>
                  </motion.button>

                  <motion.button
                    onClick={() => {
                      document.getElementById('comments-section')?.scrollIntoView({ 
                        behavior: 'smooth' 
                      });
                    }}
                    className="flex items-center space-x-1 px-2 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiMessageCircle className="w-4 h-4" />
                    <span className="font-medium">{event.commentsCount || 0}</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Event Poster Container */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="sticky top-6">
            {(event.posterData || event.poster) ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Event Poster</h4>
                </div>
                <div className="bg-gray-100 dark:bg-gray-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                     onClick={() => setShowPosterModal(true)}>
                  <img
                    src={event.posterData || event.poster}
                    alt={event.title}
                    className="w-full h-80 sm:h-96 lg:h-[500px] object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Click to view full size</p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-8 text-center">
                  <FiCalendar className="w-16 h-16 text-blue-400 dark:text-blue-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Poster Available</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This event doesn't have a poster image</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Comments Section */}
      <motion.div
        id="comments-section"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mt-6 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Comments ({event.commentsCount || 0})
          </h3>
          
          {/* Comment Input */}
          {user ? (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <form onSubmit={handleSubmitComment}>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="What are your thoughts?"
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      rows={2}
                      maxLength={500}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className={`text-xs ${
                        commentText.length > 400 
                          ? 'text-red-500 dark:text-red-400' 
                          : commentText.length > 300 
                            ? 'text-yellow-500 dark:text-yellow-400' 
                            : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {commentText.length}/500
                      </div>
                      <motion.button
                        type="submit"
                        disabled={!commentText.trim()}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                          commentText.trim()
                            ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                        whileHover={commentText.trim() ? { scale: 1.05 } : {}}
                        whileTap={commentText.trim() ? { scale: 0.95 } : {}}
                      >
                        <FiSend className="w-3 h-3" />
                        <span>Post</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                <button 
                  onClick={() => navigate('/login')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Sign in
                </button>
                {' '}to join the conversation
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {commentsLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-300">Loading comments...</span>
              </div>
            ) : comments.length > 0 ? (
              <>
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    className={`group relative bg-white dark:bg-gray-800 rounded-lg p-3 border transition-all duration-200 hover:shadow-sm ${
                      comment.isOptimistic 
                        ? 'border-l-4 border-l-blue-400 bg-blue-50/50 dark:bg-blue-900/20 animate-pulse border-blue-200 dark:border-blue-700' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-xs bg-gradient-to-br from-green-500 to-blue-600">
                          {comment.userName?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {comment.userName || 'Anonymous'}
                            </p>
                            {user && comment.userId === user.uid && (
                              <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                            {/* Delete button for comment author or event owner */}
                            {user && !comment.isOptimistic && (
                              (comment.userId === user.uid || event.userId === user.uid)
                            ) && (
                              <button
                                onClick={() => handleDeleteComment(comment)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 rounded"
                                title="Delete comment"
                              >
                                <FiTrash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            ) : (
              <div className="text-center py-8">
                <FiMessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </motion.div>

      {/* Poster Modal */}
      {showPosterModal && (event.posterData || event.poster) && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowPosterModal(false)}
        >
          <motion.div
            className="relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowPosterModal(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-colors z-10 text-xl font-bold"
            >
              ✕
            </button>
            
            {/* Modal Header */}
            <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{event.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Event Poster</p>
            </div>
            
            {/* Full Size Image Container */}
            <div className="bg-gray-100 dark:bg-gray-900 flex items-center justify-center min-h-[60vh] max-h-[70vh] overflow-auto">
              <img
                src={event.posterData || event.poster}
                alt={event.title}
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: 'calc(70vh - 2rem)' }}
              />
            </div>
            
            {/* Modal Footer */}
            <div className="bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <FiCalendar className="w-4 h-4" />
                <span>{formatDate(event.date)} at {formatTime(event.time || event.startTime)}</span>
              </div>
              <button
                onClick={() => setShowPosterModal(false)}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Report Modal */}
      <ReportEventModal
        event={event}
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false })}
      />

      {/* Delete Event Modal */}
      <DeleteEventModal
        event={event}
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Delete Comment Modal */}
      <DeleteEventCommentModal
        comment={deleteCommentModal.comment}
        userRole={deleteCommentModal.userRole}
        isOpen={deleteCommentModal.isOpen}
        onClose={() => setDeleteCommentModal({ isOpen: false, comment: null, userRole: null })}
        onConfirm={() => handleConfirmDeleteComment(deleteCommentModal.comment?.id)}
      />
    </motion.div>
  );
};

export default EventDetail;