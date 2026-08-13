import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { usePosts } from '../context/PostContext';
import { useAuth } from '../context/AuthContext';
import { 
  FiArrowLeft, 
  FiHeart, 
  FiMessageCircle, 
  FiShare2, 
  FiMapPin, 
  FiClock, 
  FiUser, 
  FiEdit2, 
  FiTrash2,
  FiFlag
} from 'react-icons/fi';
import ReportPostModal from '../components/posts/ReportPostModal';
import EditPostModal from '../components/posts/EditPostModal';
import DeletePostModal from '../components/posts/DeletePostModal';
import DeleteCommentModal from '../components/posts/DeleteCommentModal';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { getPost, deletePost, likePost, getComments, createComment, deleteComment } from '../services/api';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import toast from 'react-hot-toast';

// timeAgo is imported from utils/formatTimeAgo

const formatLocation = (location) => {
  if (!location) return '';
  if (typeof location === 'string') return location;
  if (location.name) return location.name;
  return 'Unknown location';
};

const getCategoryColor = (category) => {
  const colors = {
    'academic': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'social': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'sports': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'clubs': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'events': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    'housing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'jobs': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    'general': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };
  return colors[category] || colors.general;
};

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { likePost, posts } = usePosts();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportModal, setReportModal] = useState({ isOpen: false });
  const [editModal, setEditModal] = useState({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false });
  const [deleteCommentModal, setDeleteCommentModal] = useState({ isOpen: false, comment: null, userRole: null });
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const hasFetchedComments = useRef(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // First check if the post exists in PostContext
        const contextPost = posts.find(p => p.id === postId);
        if (contextPost) {
          console.log('Found post in context:', contextPost);
          setPost(contextPost);
          setLoading(false);
          return;
        }
        
        // If not found in context, fetch from API
        const response = await getPost(postId, user?.uid);
        console.log('Post response:', response.data); // Debug log
        console.log('Post commentCount from Firestore:', response.data.post?.commentCount); // Debug comment count
        setPost(response.data.post); // Access the post property
      } catch (error) {
        console.error('Error fetching post:', error);
        toast.error('Failed to load post');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      if (!postId || hasFetchedComments.current) return;
      
      try {
        setLoadingComments(true);
        hasFetchedComments.current = true;
        const response = await getComments(postId);
        if (response.data.success) {
          const commentsData = response.data.comments || [];
          console.log('Comments fetched:', commentsData);
          console.log('Comments count:', commentsData.length);
          console.log('Comment IDs:', commentsData.map(c => c.id));
          
          // Filter out any duplicate comments by ID
          const uniqueComments = commentsData.filter((comment, index, self) => 
            index === self.findIndex(c => c.id === comment.id)
          );
          
          if (uniqueComments.length !== commentsData.length) {
            console.warn('Duplicate comments detected and filtered out');
          }
          
          setComments(uniqueComments);
        } else {
          console.error('Failed to fetch comments:', response.data.error);
          toast.error('Failed to load comments');
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setLoadingComments(false);
      }
    };

    if (postId) {
      hasFetchedComments.current = false; // Reset flag for new post
      fetchPost();
      fetchComments();
    }
  }, [postId, navigate, posts]);

  // Update local post state when the corresponding post in context changes
  useEffect(() => {
    if (postId && posts.length > 0) {
      const contextPost = posts.find(p => p.id === postId);
      if (contextPost && post && (
        contextPost.userHasLiked !== post.userHasLiked || 
        contextPost.likes !== post.likes ||
        contextPost.likesCount !== post.likesCount
      )) {
        console.log('Updating post from context:', {
          old: { userHasLiked: post.userHasLiked, likes: post.likes },
          new: { userHasLiked: contextPost.userHasLiked, likes: contextPost.likes }
        });
        setPost(prev => ({
          ...prev,
          userHasLiked: contextPost.userHasLiked,
          likes: contextPost.likes,
          likesCount: contextPost.likesCount || contextPost.likes
        }));
      }
    }
  }, [postId, posts, post]);

  const handleLike = async () => {
    if (isVoting || !user) return;
    
    setIsVoting(true);
    try {
      const result = await likePost(postId);
      
      // Update local state with the result
      if (result && result.success) {
        setPost(prev => ({
          ...prev,
          likes: result.likes,
          userHasLiked: result.userHasLiked,
          likesCount: result.likes
        }));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    } finally {
      setIsVoting(false);
    }
  };

  const handleEdit = () => {
    setEditModal({ isOpen: true });
  };

  const handleDelete = () => {
    setDeleteModal({ isOpen: true });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePost(postId, user.uid);
      toast.success('Post deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false });
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      toast.success('Post link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !user || isSubmittingComment) return;

    setIsSubmittingComment(true);
    
    // Optimistic comment with temporary ID
    const optimisticComment = {
      id: 'temp-' + Date.now(),
      content: commentText.trim(),
      userId: user.uid,
      userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      createdAt: new Date(),
      isAnonymous: false,
      isOptimistic: true
    };

    // Add optimistic comment immediately
    setComments(prev => [optimisticComment, ...prev]);
    
    // Don't update comment count optimistically - let backend handle it

    const currentComment = commentText.trim();
    setCommentText(''); // Clear input immediately

    try {
      const response = await createComment(postId, {
        content: currentComment,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        isAnonymous: false
      });

      console.log('Comment creation response:', response); // Debug log

      // Check if response exists and has data
      if (response && response.data) {
        if (response.data.success && response.data.comment) {
          // Replace optimistic comment with real one from backend
          const realComment = response.data.comment;
          setComments(prev => 
            prev.map(c => c.id === optimisticComment.id ? realComment : c)
          );
          
          // Refresh post data to get the updated commentCount from Firestore
          const postResponse = await getPost(postId, user?.uid);
          if (postResponse.data.post) {
            console.log('Updated commentCount from Firestore after comment creation:', postResponse.data.post.commentCount);
            setPost(postResponse.data.post);
          }
          
          toast.success('Comment added successfully!');
        } else {
          // Backend returned an error
          throw new Error(response.data.error || response.data.message || 'Failed to create comment');
        }
      } else {
        // No response or response.data
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // For network errors or timeouts, the comment might still have been created
      // Check if it's a network error vs actual server error
      const isNetworkError = !error.response || error.code === 'NETWORK_ERROR' || error.message.includes('timeout');
      
      if (isNetworkError) {
        // Don't remove optimistic comment immediately for network errors
        toast.error('Network error - please check if your comment was posted');
        
        // Give user option to refresh
        setTimeout(() => {
          toast('Refresh the page to see if your comment was posted', {
            duration: 5000,
            icon: '🔄'
          });
        }, 2000);
      } else {
        // Remove optimistic comment for actual server errors
        setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
        
        // Restore comment text
        setCommentText(currentComment);
        
        // Show specific error message
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to add comment';
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

      const handleDeleteComment = async (commentId) => {
    const commentToDelete = comments.find(c => c.id === commentId);
    if (!commentToDelete) return;

    const isOwnComment = commentToDelete.userId === user?.uid;
    const isPostOwner = user?.uid === post.userId;
    
    const userRole = isOwnComment ? 'commenter' : isPostOwner ? 'owner' : 'other';

    // Show the delete comment modal
    setDeleteCommentModal({
      isOpen: true,
      comment: commentToDelete,
      userRole
    });
  };

  const handleConfirmDeleteComment = async (commentId) => {
    const commentToDelete = comments.find(c => c.id === commentId);
    if (!commentToDelete) return;

    setIsDeletingComment(true);
    
    // Optimistically remove comment
    setComments(prev => prev.filter(c => c.id !== commentId));

    try {
      // Call the actual delete comment API
      await deleteComment(postId, commentId, user.uid);
      
      // Refresh post data to get updated commentCount from Firestore
      const postResponse = await getPost(postId, user?.uid);
      if (postResponse.data.post) {
        console.log('Updated commentCount from Firestore after comment deletion:', postResponse.data.post.commentCount);
        setPost(postResponse.data.post);
      }
      
      toast.success('Comment deleted successfully!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      
      // Restore comment on error
      setComments(prev => [commentToDelete, ...prev]);
      
      toast.error('Failed to delete comment');
    } finally {
      setIsDeletingComment(false);
      setDeleteCommentModal({ isOpen: false, comment: null, userRole: null });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmitComment();
    }
  };

  // Image modal handlers
  const handleImageClick = () => {
    setShowImageModal(true);
  };

  const handleImageModalClose = () => {
    setShowImageModal(false);
  };

  const handleModalKeyPress = (e) => {
    if (e.key === 'Escape') {
      handleImageModalClose();
    }
  };

  // Add keyboard event listener for modal
  useEffect(() => {
    if (showImageModal) {
      document.addEventListener('keydown', handleModalKeyPress);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleModalKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal]);


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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSkeleton type="post" count={1} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Post not found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">The post you're looking for doesn't exist or has been removed.</p>
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

  const isOwner = user?.uid === post.userId;

  // Debug info for report button visibility
  console.log('PostDetail Debug:', {
    user: user?.uid,
    postUserId: post.userId,
    isOwner,
    canReport: user && post,
    userHasLiked: post.userHasLiked
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Post Details</h1>
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
          {user && !isOwner && (
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

      {/* Post Content */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Post with image - separated containers */}
        {(post.imageData || post.imageUrl) ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[400px]">
            {/* Post Content Container */}
            <motion.div 
              className="lg:col-span-3 p-6 flex flex-col"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Post Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    {post.isAnonymous ? (
                      <span className="text-lg">👤</span>
                    ) : (
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {post.userName?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {post.isAnonymous ? 'Anonymous' : post.userName || 'Unknown User'}
                      </p>
                      {isOwner && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                          Your Post
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <FiClock className="w-3 h-3 mr-1" />
                        {formatTimeAgo(post.createdAt)}
                      </span>
                      {post.location && (
                        <span className="flex items-center">
                          <FiMapPin className="w-3 h-3 mr-1" />
                          {formatLocation(post.location)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {post.category && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(post.category)}`}>
                    {post.category.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {/* Post Title */}
              {post.title && (
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{post.title}</h2>
              )}

              {/* Post Content */}
              <div className="flex-1 mb-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
                <div className="flex items-center space-x-4">
                  <motion.button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                      post.userHasLiked
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isVoting}
                    whileHover={{ scale: post.userHasLiked ? 1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiHeart className={`w-4 h-4 ${post.userHasLiked ? 'fill-current' : ''}`} />
                    <span className="font-medium">{post.likes || 0}</span>
                  </motion.button>

                  <motion.button
                    onClick={() => {
                      document.getElementById('comments-section')?.scrollIntoView({ 
                        behavior: 'smooth' 
                      });
                    }}
                    className="flex items-center space-x-1 px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiMessageCircle className="w-4 h-4" />
                    <span className="font-medium">{post.commentCount || 0}</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Post Image Container */}
            <motion.div 
              className="lg:col-span-2 relative group cursor-pointer bg-gray-50 dark:bg-gray-700"
              onClick={handleImageClick}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative h-full min-h-[300px] lg:min-h-[400px] overflow-hidden">
                <img 
                  src={post.imageData || post.imageUrl} 
                  alt="Post content"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 rounded-full p-3">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Post without image - single container */
          <div className="p-6">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  {post.isAnonymous ? (
                    <span className="text-lg">👤</span>
                  ) : (
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {post.userName?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {post.isAnonymous ? 'Anonymous' : post.userName || 'Unknown User'}
                    </p>
                    {isOwner && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                        Your Post
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <FiClock className="w-3 h-3 mr-1" />
                      {formatTimeAgo(post.createdAt)}
                    </span>
                    {post.location && (
                      <span className="flex items-center">
                        <FiMapPin className="w-3 h-3 mr-1" />
                        {formatLocation(post.location)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {post.category && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(post.category)}`}>
                  {post.category.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            {/* Post Title */}
            {post.title && (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{post.title}</h2>
            )}

            {/* Post Content */}
            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <motion.button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    post.userHasLiked
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isVoting}
                  whileHover={{ scale: post.userHasLiked ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiHeart className={`w-4 h-4 ${post.userHasLiked ? 'fill-current' : ''}`} />
                  <span className="font-medium">{post.likes || 0}</span>
                </motion.button>

                <motion.button
                  onClick={() => {
                    document.getElementById('comments-section')?.scrollIntoView({ 
                      behavior: 'smooth' 
                    });
                  }}
                  className="flex items-center space-x-1 px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiMessageCircle className="w-4 h-4" />
                  <span className="font-medium">{post.commentCount || 0}</span>
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Comments Section */}
      <motion.div
        id="comments-section"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mt-6 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Comments ({post.commentCount || 0})
        </h3>
        
        {/* Comment Input */}
        {user ? (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="What are your thoughts?"
                    className="w-full p-3 pb-6 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                    rows={2}
                    maxLength={500}
                    disabled={isSubmittingComment}
                  />
                  
                  {/* Character count */}
                  <div className={`absolute bottom-2 right-3 text-xs ${
                    commentText.length > 400 
                      ? 'text-red-500' 
                      : commentText.length > 300 
                        ? 'text-yellow-500' 
                        : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {commentText.length}/500
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Press Ctrl+Enter to submit
                  </div>
                  <motion.button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || isSubmittingComment}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      commentText.trim() && !isSubmittingComment
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={commentText.trim() && !isSubmittingComment ? { scale: 1.05 } : {}}
                    whileTap={commentText.trim() && !isSubmittingComment ? { scale: 0.95 } : {}}
                  >
                    {isSubmittingComment ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <FiMessageCircle className="w-3 h-3" />
                        <span>Post</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
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
          {loadingComments ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-300">Loading comments...</span>
            </div>
          ) : comments.length > 0 ? (
            <>
              {comments.map((comment, index) => {
                return (
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
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-xs ${
                          comment.isAnonymous 
                            ? 'bg-gradient-to-br from-gray-500 to-gray-600' 
                            : comment.userId === post.userId
                              ? 'bg-gradient-to-br from-green-500 to-green-600'
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}
                      >
                        {comment.isAnonymous ? '🎭' : (comment.userName?.charAt(0)?.toUpperCase() || 'U')}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Comment Header */}
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {comment.isAnonymous ? 'Anonymous' : comment.userName || 'Unknown User'}
                            </h4>
                            
                            {/* User badges */}
                            <div className="flex items-center space-x-1">
                              {comment.userId === post.userId && !comment.isAnonymous && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                  Author
                                </span>
                              )}
                              {comment.isOptimistic && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                  Posting...
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Timestamp */}
                          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                            {/* Use shared formatTimeAgo for consistency */}
                            <span>{formatTimeAgo(comment.createdAt)}</span>
                          </div>
                        </div>
                        
                        {/* Delete Button */}
                        {!comment.isOptimistic && user && (
                          (comment.userId === user.uid || user.uid === post.userId) && (
                            <motion.button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </motion.button>
                          )
                        )}
                      </div>
                      
                      {/* Comment Content */}
                      <div className="mt-1">
                        <p className="text-gray-800 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 via-blue-200 to-indigo-200 dark:from-blue-900/30 dark:via-blue-800/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiMessageCircle className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">Start the conversation</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {user ? 'Be the first to share your thoughts!' : 'Sign in to start the conversation!'}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Image Modal */}
      {showImageModal && (post.imageData || post.imageUrl) && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={handleImageModalClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <img
              src={post.imageData || post.imageUrl}
              alt="Post content"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <motion.button
              onClick={handleImageModalClose}
              className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
              Click outside or press ESC to close
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Report Modal */}
      <ReportPostModal
        post={post}
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false })}
      />

      {/* Edit Modal */}
      <EditPostModal
        post={post}
        isOpen={editModal.isOpen}
        onClose={() => {
          setEditModal({ isOpen: false });
          // Refresh post data after editing
          if (postId) {
            getPost(postId, user?.uid).then(response => {
              if (response.data.post) {
                setPost(response.data.post);
              }
            }).catch(error => {
              console.error('Error refreshing post after edit:', error);
            });
          }
        }}
      />

      {/* Delete Modal */}
      <DeletePostModal
        post={post}
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
      {/* Delete Comment Modal */}
      <DeleteCommentModal
        comment={deleteCommentModal.comment}
        userRole={deleteCommentModal.userRole}
        isOpen={deleteCommentModal.isOpen}
        onClose={() => setDeleteCommentModal({ isOpen: false, comment: null, userRole: null })}
        onConfirm={() => handleConfirmDeleteComment(deleteCommentModal.comment?.id)}
        isDeleting={isDeletingComment}
      />
    </motion.div>
  );
};

export default PostDetail;
