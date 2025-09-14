import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '../context/PostContext';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiRefreshCw, FiBarChart2, FiCalendar, FiStar } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import PostCard from '../components/posts/PostCard';
import PollCard from '../components/polls/PollCard';
import EventCard from '../components/events/EventCard';
import EditPostModal from '../components/posts/EditPostModal';
import DeletePostModal from '../components/posts/DeletePostModal';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';

const Home = () => {
  const { posts, polls, events, loading, fetchPosts, fetchPolls, fetchEvents, refreshPosts, likePost, voteOnPoll, deletePost, deleteEvent } = usePosts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editModal, setEditModal] = useState({ isOpen: false, post: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, post: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (user && !hasInitialized) {
      fetchPosts();
      fetchPolls();
      fetchEvents();
      setHasInitialized(true);
    }
  }, [user?.uid, hasInitialized]); // Only run once when user is available

  const handleRefresh = async () => {
    if (user) {
      // Add a small delay between calls to prevent concurrent request issues
      refreshPosts();
      setTimeout(() => fetchPolls(), 100);
      setTimeout(() => fetchEvents(), 200);
    }
  };

  const handleLike = async (postId) => {
    try {
      await likePost(postId);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handlePollVote = async (pollId, optionIndex) => {
    try {
      await voteOnPoll(pollId, [optionIndex]); // Backend expects array of option indexes
    } catch (error) {
      console.error('Error voting on poll:', error);
    }
  };

  const handleEditEvent = (event) => {
    // Navigate to edit event page
    navigate(`/events/edit/${event.id}`);
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
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

  const handleEdit = (post) => {
    setEditModal({ isOpen: true, post });
  };

  const handleDelete = (postId) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setDeleteModal({ isOpen: true, post });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.post) return;
    
    setIsDeleting(true);
    try {
      await deletePost(deleteModal.post.id);
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, post: null });
    }
  };

  // Filter out expired polls and upcoming events
  const activePolls = polls.filter(poll => {
    if (!poll.expiresAt) return true; // No expiration date means active
    return new Date() <= new Date(poll.expiresAt);
  });

  const upcomingEvents = events.filter(event => {
    return new Date(event.date) >= new Date(); // Future events
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-full 2xl:max-w-[1600px] mx-auto space-y-8 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6"
    >
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Campus Feed 🎓
            </h1>
            <p className="text-blue-100 text-base sm:text-lg opacity-90">
              Stay updated with your campus community
            </p>
          </motion.div>
          
          <motion.div 
            className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.button
              onClick={handleRefresh}
              className="flex items-center justify-center space-x-2 px-4 py-3 sm:px-5 bg-white bg-opacity-10 backdrop-blur-sm hover:bg-opacity-20 rounded-xl transition-all duration-300 font-medium border border-white border-opacity-20 hover:border-opacity-40 w-full sm:w-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={loading ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
              >
                <FiRefreshCw className="w-5 h-5" />
              </motion.div>
              <span className="text-sm sm:text-base">Refresh</span>
            </motion.button>
            
            <Link
              to="/create-post"
              className="flex items-center justify-center space-x-3 px-4 py-3 sm:px-6 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white rounded-xl transition-all duration-300 font-medium border border-white border-opacity-20 hover:border-opacity-40 group w-full sm:w-auto"
            >
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <FiPlus className="w-5 h-5" />
              </motion.div>
              <span className="text-sm sm:text-base font-semibold">New Post</span>
              <motion.div
                className="w-2 h-2 bg-white rounded-full opacity-60"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {[
          { 
            icon: FiBarChart2, 
            value: activePolls.length, 
            label: "Active Polls", 
            bgColor: "bg-gradient-to-br from-green-50 to-emerald-50", 
            iconBg: "bg-gradient-to-br from-green-100 to-emerald-100",
            iconColor: "text-green-600",
            delay: 0.1
          },
          { 
            icon: FiCalendar, 
            value: upcomingEvents.length, 
            label: "Upcoming Events", 
            bgColor: "bg-gradient-to-br from-purple-50 to-violet-50", 
            iconBg: "bg-gradient-to-br from-purple-100 to-violet-100",
            iconColor: "text-purple-600",
            delay: 0.2
          },
          { 
            icon: FiStar, 
            value: user?.reputation || 0, 
            label: "Reputation", 
            bgColor: "bg-gradient-to-br from-amber-50 to-orange-50", 
            iconBg: "bg-gradient-to-br from-amber-100 to-orange-100",
            iconColor: "text-amber-600",
            delay: 0.3
          },
          { 
            icon: FiBarChart2, 
            value: posts.length, 
            label: "Total Posts", 
            bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50", 
            iconBg: "bg-gradient-to-br from-blue-100 to-indigo-100",
            iconColor: "text-blue-600",
            delay: 0.4
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            className={`${stat.bgColor} rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: stat.delay }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-4">
              <motion.div 
                className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </motion.div>
              <div>
                <motion.p 
                  className="text-3xl font-bold text-gray-900"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: stat.delay + 0.2, type: "spring", stiffness: 200 }}
                >
                  {stat.value}
                </motion.p>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-6 lg:gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {/* Left Sidebar - Active Polls */}
        <motion.div 
          className="lg:order-first xl:col-span-2 2xl:col-span-2"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                <motion.span 
                  className="text-2xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  📊
                </motion.span>
                <span>Active Polls</span>
                <span className="ml-auto bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {activePolls.length}
                </span>
              </h3>
            </div>
            <div className="p-8">
              {activePolls.length === 0 ? (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="text-4xl">📊</span>
                  </motion.div>
                  <p className="text-gray-600 font-medium">No active polls</p>
                  <p className="text-gray-500 text-sm mt-2">Check back later for new polls!</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {activePolls.slice(0, 4).map((poll, index) => (
                    <motion.div
                      key={poll.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="transform hover:scale-[1.02] transition-transform duration-200"
                    >
                      <PollCard
                        poll={poll}
                        onVote={handlePollVote}
                        hasVoted={poll.hasVoted}
                      />
                    </motion.div>
                  ))}
                  {activePolls.length > 4 && (
                    <motion.div 
                      className="text-center pt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                    >
                      <motion.button 
                        className="text-blue-600 hover:text-blue-700 font-medium px-6 py-3 rounded-xl hover:bg-blue-50 transition-all duration-200 border border-blue-200 hover:border-blue-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        View All Polls ({activePolls.length})
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Feed */}
        <motion.div 
          className="lg:col-span-1 xl:col-span-1 2xl:col-span-2"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                <motion.span 
                  className="text-2xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  📝
                </motion.span>
                <span>Recent Posts</span>
                <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {posts.length}
                </span>
              </h2>
            </div>
            <div className="p-8">
              {loading ? (
                <LoadingSkeleton type="post" count={3} />
              ) : posts.length === 0 ? (
                <motion.div 
                  className="text-center py-16"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.div 
                    className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                  >
                    <span className="text-4xl">📝</span>
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">No posts yet</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    Be the first to share something with your campus community!
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/create-post"
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                    >
                      <FiPlus className="w-5 h-5" />
                      <span>Create First Post</span>
                    </Link>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {posts.slice(0, 5).map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <PostCard
                        post={post}
                        currentUser={user}
                        onLike={handleLike}
                        onShare={handleShare}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  ))}
                  {posts.length > 5 && (
                    <motion.div 
                      className="text-center py-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                    >
                      <motion.button 
                        className="text-blue-600 hover:text-blue-700 font-medium px-6 py-3 rounded-xl hover:bg-blue-50 transition-all duration-200 border border-blue-200 hover:border-blue-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        View More Posts ({posts.length})
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <motion.div 
          className="xl:col-span-2 2xl:col-span-2 space-y-8"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                <motion.span 
                  className="text-2xl"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  📅
                </motion.span>
                <span>Upcoming Events</span>
                <span className="ml-auto bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {upcomingEvents.length}
                </span>
              </h3>
            </div>
            <div className="p-8">
              {upcomingEvents.length === 0 ? (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="text-4xl">📅</span>
                  </motion.div>
                  <p className="text-gray-600 font-medium">No upcoming events</p>
                  <p className="text-gray-500 text-sm mt-2">Stay tuned for exciting events!</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {upcomingEvents.slice(0, 4).map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="transform hover:scale-[1.02] transition-transform duration-200"
                    >
                      <EventCard
                        event={event}
                        currentUser={user}
                        onEdit={handleEditEvent}
                        onDelete={handleDeleteEvent}
                      />
                    </motion.div>
                  ))}
                  {upcomingEvents.length > 4 && (
                    <motion.div 
                      className="text-center pt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                    >
                      <motion.button 
                        className="text-blue-600 hover:text-blue-700 font-medium px-6 py-3 rounded-xl hover:bg-blue-50 transition-all duration-200 border border-blue-200 hover:border-blue-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        View All Events ({upcomingEvents.length})
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                <motion.span 
                  className="text-2xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  ⚡
                </motion.span>
                <span>Quick Actions</span>
              </h3>
            </div>
            <div className="p-8 space-y-4">
              {[
                { to: "/create-post", icon: "📝", label: "Create Post", color: "hover:bg-blue-50", gradient: "from-blue-500 to-indigo-600" },
                { to: "/create-poll", icon: "📊", label: "Create Poll", color: "hover:bg-green-50", gradient: "from-green-500 to-emerald-600" },
                { to: "/create-event", icon: "📅", label: "Create Event", color: "hover:bg-purple-50", gradient: "from-purple-500 to-violet-600" },
                { to: "/leaderboard", icon: "🏆", label: "View Leaderboard", color: "hover:bg-amber-50", gradient: "from-amber-500 to-orange-600" }
              ].map((action, index) => (
                <motion.div
                  key={index}
                  whileHover={{ x: 8, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Link
                    to={action.to}
                    className={`block w-full text-left px-6 py-4 text-gray-700 ${action.color} rounded-xl transition-all duration-200 flex items-center space-x-4 group border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md`}
                  >
                    <div className={`w-10 h-10 bg-gradient-to-r ${action.gradient} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                      <span className="text-lg filter drop-shadow-sm">{action.icon}</span>
                    </div>
                    <span className="font-medium group-hover:text-gray-900">{action.label}</span>
                    <motion.div
                      className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      whileHover={{ x: 5 }}
                    >
                      <span className="text-gray-400">→</span>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Campus Info */}
          <motion.div 
            className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-xl p-8 text-white shadow-lg hover:shadow-xl transition-shadow duration-300"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="font-bold text-xl mb-4 flex items-center space-x-3">
              <motion.span 
                className="text-3xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                🌟
              </motion.span>
              <span>Campus Community</span>
            </h3>
            <p className="opacity-90 mb-6 leading-relaxed text-base">
              Welcome to CampusConnect! Share, discover, and stay connected with your campus community.
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div 
                  className="w-4 h-4 bg-green-400 rounded-full shadow-lg"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                ></motion.div>
                <span className="font-medium">Real-time updates active</span>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-75">Online now</p>
                <p className="font-bold text-lg">🔥 Live</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Edit Post Modal */}
      <EditPostModal
        post={editModal.post}
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, post: null })}
      />

      {/* Delete Post Modal */}
      <DeletePostModal
        post={deleteModal.post}
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, post: null })}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Floating Action Button for Mobile */}
      <motion.div
        className="fixed bottom-6 right-6 xl:hidden z-50"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <Link
          to="/create-post"
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 group"
        >
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <FiPlus className="w-6 h-6" />
          </motion.div>
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default Home;
