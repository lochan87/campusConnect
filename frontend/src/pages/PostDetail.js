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
import toast from 'react-hot-toast';

// Utility functions
const timeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown time';
  
  const now = new Date();
  const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return time.toLocaleDateString();
};

const formatLocation = (location) => {
  if (!location) return '';
  if (typeof location === 'string') return location;
  if (location.name) return location.name;
  return 'Unknown location';
};

const getCategoryColor = (category) => {
  const colors = {
    'academic': 'bg-blue-100 text-blue-800',
    'social': 'bg-green-100 text-green-800',
    'sports': 'bg-orange-100 text-orange-800',
    'clubs': 'bg-purple-100 text-purple-800',
    'events': 'bg-pink-100 text-pink-800',
    'housing': 'bg-yellow-100 text-yellow-800',
    'jobs': 'bg-indigo-100 text-indigo-800',
    'general': 'bg-gray-100 text-gray-800'
  };
  return colors[category] || colors.general;
};

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { likePost } = usePosts();
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
  const hasFetchedComments = useRef(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
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
  }, [postId, navigate]);

  const handleLike = async () => {
    if (isVoting || !user) return;
    
    setIsVoting(true);
    try {
      await likePost(postId);
      // Refresh post data to get updated like counts
      const response = await getPost(postId, user?.uid);
      setPost(response.data.post); // Access the post property
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

      if (response.data.success) {
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
        throw new Error(response.data.error || 'Failed to create comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      
      // Remove optimistic comment on error
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      
      // Restore comment text
      setCommentText(currentComment);
      
      // No need to revert comment count since we don't update it optimistically
      
      toast.error('Failed to add comment');
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Post not found</h3>
          <p className="text-gray-600 mb-4">The post you're looking for doesn't exist or has been removed.</p>
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
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <motion.button
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiArrowLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Post Details</h1>
          <p className="text-gray-600">View post and interact with the community</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={handleShare}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiShare2 className="w-4 h-4" />
            <span className="hidden sm:block">Share</span>
          </motion.button>
          {isOwner && (
            <>
              <motion.button
                onClick={handleEdit}
                className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiEdit2 className="w-4 h-4" />
                <span className="hidden sm:block">Edit</span>
              </motion.button>
              <motion.button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiTrash2 className="w-4 h-4" />
                <span className="hidden sm:block">Delete</span>
              </motion.button>
            </>
          )}
          {/* Report button available to all authenticated users */}
          {user && (
            <motion.button
              onClick={() => setReportModal({ isOpen: true })}
              className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={isOwner ? "Report this post (as moderator)" : "Report this post"}
            >
              <FiFlag className="w-4 h-4" />
              <span className="hidden sm:block">Report</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Post Content */}
      <motion.div
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="p-8">
          {/* Post Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                {post.isAnonymous ? (
                  <span className="text-lg">👤</span>
                ) : (
                  <span className="text-lg font-medium text-gray-600">
                    {post.userName?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-semibold text-gray-900">
                    {post.isAnonymous ? 'Anonymous' : post.userName || 'Unknown User'}
                  </p>
                  {isOwner && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Your Post
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <span className="flex items-center">
                    <FiClock className="w-4 h-4 mr-1" />
                    {timeAgo(post.createdAt)}
                  </span>
                  {post.location && (
                    <span className="flex items-center">
                      <FiMapPin className="w-4 h-4 mr-1" />
                      {formatLocation(post.location)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {post.category && (
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor(post.category)}`}>
                {post.category.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {/* Post Title */}
          {post.title && (
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{post.title}</h2>
          )}

          {/* Post Content */}
          <div className="prose prose-gray max-w-none mb-8">
            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Post Image */}
          {(post.imageData || post.imageUrl) && (
            <div className="mb-8">
              <img 
                src={post.imageData || post.imageUrl} 
                alt="Post content"
                className="w-full h-auto rounded-xl border border-gray-200 shadow-sm"
              />
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-6">
              <motion.button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  post.userHasLiked
                    ? 'bg-red-50 text-red-600'
                    : 'text-gray-600 hover:bg-gray-50'
                } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isVoting}
                whileHover={{ scale: post.userHasLiked ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiHeart className={`w-5 h-5 ${post.userHasLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{post.likes || 0}</span>
              </motion.button>

              <motion.button
                onClick={() => {
                  document.getElementById('comments-section')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                }}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiMessageCircle className="w-5 h-5" />
                <span className="font-medium">{post.commentCount || 0}</span>
              </motion.button>
            </div>

          </div>
        </div>
      </motion.div>

      {/* Comments Section */}
      <motion.div
        id="comments-section"
        className="bg-white rounded-2xl shadow-lg border border-gray-100 mt-8 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Comments ({post.commentCount || 0})
        </h3>
        
        {/* Comment Input */}
        {user ? (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-semibold">
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
                    className="w-full p-3 pb-8 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    rows={3}
                    maxLength={500}
                    disabled={isSubmittingComment}
                  />
                  
                  {/* Character count */}
                  <div className={`absolute bottom-2 right-3 text-xs font-medium ${
                    commentText.length > 400 
                      ? 'text-red-500' 
                      : commentText.length > 300 
                        ? 'text-yellow-500' 
                        : 'text-gray-400'
                  }`}>
                    {commentText.length}/500
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>💬</span>
                    <span>Press Ctrl+Enter to submit quickly</span>
                  </div>
                  <motion.button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || isSubmittingComment}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      commentText.trim() && !isSubmittingComment
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    whileHover={commentText.trim() && !isSubmittingComment ? { scale: 1.05 } : {}}
                    whileTap={commentText.trim() && !isSubmittingComment ? { scale: 0.95 } : {}}
                  >
                    {isSubmittingComment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <FiMessageCircle className="w-4 h-4" />
                        <span>Post Comment</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-gray-600">
              <button 
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </button>
              {' '}to join the conversation
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {loadingComments ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading comments...</span>
            </div>
          ) : comments.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <FiMessageCircle className="w-4 h-4" />
                  <span>{post?.commentCount || 0} {(post?.commentCount || 0) === 1 ? 'Comment' : 'Comments'}</span>
                </h4>
              </div>
              
              {/* Debug info */}
              {console.log('Rendering comments:', comments)}
              
              {comments.map((comment, index) => {
                console.log(`Rendering comment ${index}:`, comment.id, comment.content);
                return (
                <motion.div
                  key={comment.id}
                  className={`group relative bg-white rounded-lg p-4 border transition-all duration-200 hover:shadow-sm ${
                    comment.isOptimistic 
                      ? 'border-l-4 border-l-blue-400 bg-blue-50/50 animate-pulse border-blue-200' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex space-x-3">
                    {/* Enhanced Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm ${
                          comment.isAnonymous 
                            ? 'bg-gradient-to-br from-gray-500 to-gray-600' 
                            : comment.userId === post.userId
                              ? 'bg-gradient-to-br from-green-500 to-green-600'
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}
                      >
                        {comment.isAnonymous ? '🎭' : (comment.userName?.charAt(0)?.toUpperCase() || 'U')}
                      </div>
                      {/* Online indicator */}
                      {!comment.isAnonymous && !comment.isOptimistic && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Comment Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap mb-1">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {comment.isAnonymous ? 'Anonymous User' : comment.userName || 'Unknown User'}
                            </h4>
                            
                            {/* User badges */}
                            <div className="flex items-center space-x-1">
                              {comment.userId === post.userId && !comment.isAnonymous && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <span className="w-1 h-1 bg-green-400 rounded-full mr-1"></span>
                                  Author
                                </span>
                              )}
                              {comment.isAnonymous && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  <span className="w-1 h-1 bg-gray-400 rounded-full mr-1"></span>
                                  Anonymous
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Timestamp and status */}
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <FiClock className="w-3 h-3" />
                              <span>{timeAgo(comment.createdAt)}</span>
                            </div>
                            {comment.isOptimistic && (
                              <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                                <span>Posting...</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Delete Button */}
                        {!comment.isOptimistic && user && (
                          (comment.userId === user.uid || user.uid === post.userId) && (
                            <motion.button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50"
                              title={
                                comment.userId === user.uid 
                                  ? "Delete your comment" 
                                  : "Delete comment (as post owner)"
                              }
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </motion.button>
                          )
                        )}
                      </div>
                      
                      {/* Comment Content */}
                      <div className="mt-2">
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </div>
                      
                      {/* Comment Footer */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {comment.content.length} chars
                          </span>
                          {!comment.isOptimistic && (
                            <span className="text-xs text-green-500 font-medium">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 via-blue-200 to-indigo-200 rounded-full flex items-center justify-center shadow-lg mx-auto">
                  <FiMessageCircle className="w-8 h-8 text-blue-500" />
                </div>
                <div className="absolute -top-1 -right-1 text-2xl">💭</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Start the conversation</h3>
              <p className="text-gray-500 mb-4 max-w-xs mx-auto">
                {user ? 'Be the first to share your thoughts!' : 'Sign in to start the conversation!'}
              </p>
              <div className="flex items-center justify-center space-x-2 text-blue-500 text-sm font-medium">
                <span>✨</span>
                <span>Your voice matters</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

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
