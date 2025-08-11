import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usePosts } from '../context/PostContext';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiTrendingUp, FiRefreshCw } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import PostCard from '../components/posts/PostCard';
import PollCard from '../components/polls/PollCard';
import CommentModal from '../components/posts/CommentModal';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';

const Home = () => {
  const { posts, polls, loading, fetchPosts, fetchPolls, refreshPosts, voteOnPost, deletePost, editPost } = usePosts();
  const { user } = useAuth();
  const [commentModal, setCommentModal] = useState({ isOpen: false, post: null });

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchPolls();
    }
  }, [user]);

  const handleRefresh = () => {
    refreshPosts();
  };

  const handleVote = async (postId, voteType) => {
    try {
      await voteOnPost(postId, voteType);
    } catch (error) {
      console.error('Error voting on post:', error);
    }
  };

  const handleComment = (postId) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setCommentModal({ isOpen: true, post });
    }
  };

  const handleShare = (postId) => {
    // Copy link to clipboard
    const postUrl = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      toast.success('Post link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const handleSubmitComment = async (postId, comment) => {
    // The CommentModal now handles the submission internally
    // This is just for compatibility, the actual work is done in the modal
    console.log('Comment submitted:', postId, comment);
  };

  const handleEdit = (post) => {
    // TODO: Open edit modal or navigate to edit page
    console.log('Edit post:', post);
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(postId);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campus Feed</h1>
          <p className="text-gray-600">Stay updated with your campus community</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
          <Link
            to="/create-post"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            <span className="text-sm">New Post</span>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold">📝</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
              <p className="text-sm text-gray-600">Posts Today</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-semibold">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{polls.length}</p>
              <p className="text-sm text-gray-600">Active Polls</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{user?.reputation || 0}</p>
              <p className="text-sm text-gray-600">Your Reputation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
            </div>
            <div className="p-4">
              {loading ? (
                <LoadingSkeleton type="post" count={3} />
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-600 mb-4">Be the first to share something with your campus!</p>
                  <Link
                    to="/create-post"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Create First Post</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.slice(0, 5).map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUser={user}
                      onVote={handleVote}
                      onComment={handleComment}
                      onShare={handleShare}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                  {posts.length > 5 && (
                    <div className="text-center py-4">
                      <button className="text-blue-600 hover:text-blue-700 font-medium">
                        View More Posts
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Active Polls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Active Polls</h3>
            </div>
            <div className="p-4">
              {polls.length === 0 ? (
                <div className="text-center py-6">
                  <span className="text-2xl mb-2 block">📊</span>
                  <p className="text-gray-600 text-sm">No active polls</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {polls.slice(0, 3).map((poll) => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      onVote={(pollId, optionIndex) => {
                        // Handle poll voting
                        console.log('Poll vote:', pollId, optionIndex);
                      }}
                      hasVoted={false} // This would come from user context
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-4 space-y-3">
              <Link
                to="/create-post"
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                📝 Create Post
              </Link>
              <Link
                to="/create-poll"
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                📊 Create Poll
              </Link>
              <Link
                to="/leaderboard"
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                🏆 View Leaderboard
              </Link>
            </div>
          </div>

          {/* Campus Info */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-4 text-white">
            <h3 className="font-semibold mb-2">Campus Community</h3>
            <p className="text-sm opacity-90 mb-3">
              Welcome to CampusConnect! Share, discover, and stay connected with your campus community.
            </p>
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Real-time updates active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      <CommentModal
        post={commentModal.post}
        isOpen={commentModal.isOpen}
        onClose={() => setCommentModal({ isOpen: false, post: null })}
        onSubmitComment={handleSubmitComment}
      />
    </motion.div>
  );
};

export default Home;
