import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiSend, FiMessageCircle, FiTrash2, FiClock, FiAlertTriangle } from 'react-icons/fi';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CommentModal = ({ post, isOpen, onClose, onSubmitComment }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, commentId: null, commentData: null });
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
    
    // Optimistically add the comment to local state and call parent handler
    const optimisticComment = {
      id: 'temp-' + Date.now(),
      content: newComment.trim(),
      userId: user?.uid || user?.id,
      userName: user?.displayName || user?.name || user?.email,
      isAnonymous: false,
      createdAt: new Date(),
      isOptimistic: true
    };
    
    // Update local comments immediately
    setComments([optimisticComment, ...comments]);
    
    // Call parent handler for optimistic post update
    if (onSubmitComment) {
      onSubmitComment(post.id, newComment.trim());
    }
    
    const currentComment = newComment.trim();
    setNewComment(''); // Clear input immediately
    
    try {
      const commentData = {
        content: currentComment,
        userId: user?.uid || user?.id,
        userName: user?.displayName || user?.name || user?.email,
        isAnonymous: false
      };

      const response = await apiService.createComment(post.id, commentData);
      
      if (response.data.success) {
        // Replace optimistic comment with real one
        setComments(prev => 
          prev.map(c => c.id === optimisticComment.id ? response.data.comment : c)
        );
        toast.success('Comment added successfully!');
      } else {
        throw new Error('Failed to create comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      
      // Remove optimistic comment on error
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      
      // Restore the comment text
      setNewComment(currentComment);
      
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const commentToDelete = comments.find(c => c.id === commentId);
    setDeleteConfirmation({ 
      isOpen: true, 
      commentId, 
      commentData: commentToDelete 
    });
  };

  const confirmDeleteComment = async () => {
    const { commentId } = deleteConfirmation;
    
    // Close confirmation modal
    setDeleteConfirmation({ isOpen: false, commentId: null, commentData: null });

    // Optimistically remove the comment from local state
    setComments(comments.filter(comment => comment.id !== commentId));

    try {
      const response = await apiService.deleteComment(post.id, commentId, user?.uid || user?.id);
      
      if (response.data.success) {
        toast.success('Comment deleted successfully!');
      } else {
        throw new Error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      
      // Restore the comment on error (find it from the original comments)
      const originalComment = post.comments?.find(c => c.id === commentId);
      if (originalComment) {
        setComments(prev => [originalComment, ...prev.filter(c => c.id !== commentId)]);
      }
      
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

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-4 sm:p-4" 
      style={{ 
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full max-w-md sm:max-w-2xl h-[85vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-4 border-b bg-white sticky top-0 z-10">
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
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-gray-600">
                {post.isAnonymous ? '👤' : (post.userName?.charAt(0) || 'U')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {post.isAnonymous ? 'Anonymous' : post.userName || 'Unknown User'}
              </p>
              {post.title && (
                <h4 className="font-semibold text-gray-900 mt-1 text-base line-clamp-2">{post.title}</h4>
              )}
              <p className="text-gray-700 text-sm mt-1 line-clamp-3">{post.content}</p>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-200 border-t-blue-600 mb-4"></div>
                <p className="text-gray-600 text-sm">Loading comments...</p>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <FiMessageCircle className="w-4 h-4" />
                    <span>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</span>
                  </h4>
                </div>
                {comments.map((comment, index) => (
                <div
                  key={comment.id}
                  className={`group relative bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm ${
                    comment.isOptimistic 
                      ? 'border-l-4 border-l-blue-400 bg-blue-50/50 animate-pulse' 
                      : 'hover:bg-gray-50'
                  }`}
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
                        
                        {/* Actions */}
                        <div className="flex items-center space-x-1">
                          {/* Delete Button */}
                          {!comment.isOptimistic && (
                            ((comment.isAnonymous && post.userId === (user?.uid || user?.id)) ||
                             (!comment.isAnonymous && comment.userId === (user?.uid || user?.id)) || 
                             (post.userId === (user?.uid || user?.id))) && (
                              <div className="relative">
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                                    (!comment.isAnonymous && comment.userId === (user?.uid || user?.id))
                                      ? "text-gray-400 hover:text-red-500 hover:bg-red-50" 
                                      : "text-orange-400 hover:text-red-500 hover:bg-red-50"
                                  }`}
                                  title={
                                    comment.isAnonymous 
                                      ? "Delete anonymous comment (as post owner)"
                                      : comment.userId === (user?.uid || user?.id) 
                                        ? "Delete your comment" 
                                        : "Delete comment (as post owner)"
                                  }
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                                
                                {/* Moderation indicator */}
                                {post.userId === (user?.uid || user?.id) && 
                                 comment.userId !== (user?.uid || user?.id) && (
                                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full border border-white"></div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                      
                      {/* Comment Content */}
                      <div className="mt-2">
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </div>
                      
                      {/* Comment Footer - Simplified for mobile */}
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
                </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 via-blue-200 to-indigo-200 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <FiMessageCircle className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="absolute -top-1 -right-1 text-xl">💭</div>
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-2">Start the conversation</h3>
                <p className="text-gray-500 text-sm text-center mb-4 max-w-xs">
                  No comments yet. Share your thoughts!
                </p>
                <div className="flex items-center space-x-2 text-blue-500 text-sm font-medium">
                  <span>✨</span>
                  <span>Your voice matters</span>
                </div>
              </div>
            )}
          </div>
        </div>        {/* Comment Input */}
        <div className="border-t bg-white p-4 sticky bottom-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Input Header */}
            <div className="flex items-center space-x-2 mb-2">
              <FiMessageCircle className="w-4 h-4 text-blue-500" />
              <h5 className="text-sm font-medium text-gray-700">Add a comment</h5>
            </div>
            
            <div className="flex space-x-3">
              {/* User Avatar */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-sm font-semibold">
                    {user?.displayName?.charAt(0) || user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              
              <div className="flex-1">
                {/* Textarea with enhanced styling */}
                <div className="relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="What are your thoughts?"
                    className="w-full px-3 py-2 pb-6 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all bg-gray-50 focus:bg-white text-sm placeholder-gray-400"
                    rows={2}
                    maxLength={500}
                    disabled={isSubmitting}
                  />
                  
                  {/* Character count with color coding */}
                  <div className={`absolute bottom-2 right-3 text-xs font-medium ${
                    newComment.length > 400 
                      ? 'text-red-500' 
                      : newComment.length > 300 
                        ? 'text-yellow-500' 
                        : 'text-gray-400'
                  }`}>
                    {newComment.length}/500
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer with info and submit */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <span>💬</span>
                <span>Public comment</span>
              </div>
              
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm ${
                  !newComment.trim() || isSubmitting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4" 
          style={{ 
            zIndex: 10000,
            backgroundColor: 'rgba(0, 0, 0, 0.6)'
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-3 bg-red-500 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <FiAlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-white truncate">Delete Comment</h3>
                  <p className="text-red-100 text-sm">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="mb-4">
                {(() => {
                  const commentData = deleteConfirmation.commentData;
                  const isOwnComment = commentData && !commentData.isAnonymous && commentData.userId === (user?.uid || user?.id);
                  const isPostOwner = post.userId === (user?.uid || user?.id);
                  
                  if (commentData?.isAnonymous && isPostOwner) {
                    return (
                      <div>
                        <p className="text-gray-700 mb-3 text-sm">
                          You are about to delete an <span className="font-semibold text-orange-600">anonymous comment</span> from your post.
                        </p>
                        <div className="bg-orange-50 border-l-4 border-orange-400 p-3 mb-3 rounded-r">
                          <p className="text-orange-800 text-sm">
                            <span className="font-semibold">As post owner</span>, you have moderation privileges.
                          </p>
                        </div>
                      </div>
                    );
                  } else if (!isOwnComment && isPostOwner) {
                    return (
                      <div>
                        <p className="text-gray-700 mb-3 text-sm">
                          You are about to delete a comment by <span className="font-semibold text-blue-600">{commentData?.userName || 'Unknown User'}</span>.
                        </p>
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3 rounded-r">
                          <p className="text-blue-800 text-sm">
                            <span className="font-semibold">As post owner</span>, you can moderate comments.
                          </p>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div>
                        <p className="text-gray-700 mb-3 text-sm">
                          You are about to delete <span className="font-semibold text-gray-600">your comment</span>.
                        </p>
                        <div className="bg-gray-50 border-l-4 border-gray-400 p-3 mb-3 rounded-r">
                          <p className="text-gray-800 text-sm">
                            This will permanently remove your comment.
                          </p>
                        </div>
                      </div>
                    );
                  }
                })()}
                
                {/* Comment Preview */}
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <p className="text-xs text-gray-500 mb-2">Comment to be deleted:</p>
                  <div className="bg-white rounded p-2 border">
                    <p className="text-gray-800 text-sm line-clamp-3">
                      "{deleteConfirmation.commentData?.content}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirmation({ isOpen: false, commentId: null, commentData: null })}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                
                <button
                  onClick={confirmDeleteComment}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors font-medium flex items-center justify-center space-x-2 text-sm"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
        )}
      </div>
    </div>,
    document.body
  );
};

export default CommentModal;
