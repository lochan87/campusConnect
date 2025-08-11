import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiSend, FiMessageCircle, FiTrash2, FiClock } from 'react-icons/fi';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CommentModal = ({ post, isOpen, onClose, onSubmitComment }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Fetch comments when modal opens
  useEffect(() => {
    if (isOpen && post) {
      fetchComments();
    }
  }, [isOpen, post]);

  const fetchComments = async () => {
    if (!post) return;
    
    setLoading(true);
    try {
      const response = await apiService.getComments(post.id);
      if (response.data.success) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        content: newComment.trim(),
        userId: user?.uid || user?.id,
        userName: user?.displayName || user?.name || user?.email,
        isAnonymous: false
      };

      const response = await apiService.createComment(post.id, commentData);
      
      if (response.data.success) {
        setNewComment('');
        setComments([response.data.comment, ...comments]);
        toast.success('Comment added successfully!');
        
        // Call the parent handler to update comment count
        if (onSubmitComment) {
          onSubmitComment(post.id, newComment.trim());
        }
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await apiService.deleteComment(post.id, commentId, user?.uid || user?.id);
      
      if (response.data.success) {
        setComments(comments.filter(comment => comment.id !== commentId));
        toast.success('Comment deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const timeAgo = (timestamp) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffMs = now - commentTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <FiMessageCircle className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Comments</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Post Preview */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {post.isAnonymous ? '👤' : (post.userName?.charAt(0) || 'U')}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {post.isAnonymous ? 'Anonymous' : post.userName || 'Unknown User'}
              </p>
              {post.title && (
                <h4 className="font-semibold text-gray-900 mt-1">{post.title}</h4>
              )}
              <p className="text-gray-700 text-sm mt-1 line-clamp-3">{post.content}</p>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 max-h-64">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-600">
                      {comment.isAnonymous ? '👤' : (comment.userName?.charAt(0) || 'U')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {comment.isAnonymous ? 'Anonymous' : comment.userName || 'Unknown User'}
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <FiClock className="w-3 h-3" />
                          <span>{timeAgo(comment.createdAt)}</span>
                        </div>
                      </div>
                      {!comment.isAnonymous && comment.userId === (user?.uid || user?.id) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Delete comment"
                        >
                          <FiTrash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <FiMessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No comments yet.</p>
              <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {user?.displayName?.charAt(0) || user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {newComment.length}/500
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiSend className="w-4 h-4" />
                  <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CommentModal;
