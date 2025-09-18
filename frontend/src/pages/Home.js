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
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const Home = () => {
  const { posts, polls, events, loading, fetchPosts, fetchPolls, fetchEvents, refreshPosts, likePost, likeEvent, voteOnPoll, deletePost, deleteEvent } = usePosts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editModal, setEditModal] = useState({ isOpen: false, post: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, post: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // Add active tab state
  const [quickStats, setQuickStats] = useState({ posts: 0, polls: 0, events: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch quick stats first for immediate display
  useEffect(() => {
    const fetchQuickStats = async () => {
      if (!user?.campusId) return;
      
      try {
        setStatsLoading(true);
        const response = await apiService.getStats({
          campusId: user.campusId,
          userId: user.uid
        });
        
        if (response.data.success) {
          setQuickStats(response.data.stats);
        }
      } catch (error) {
        console.error('Error fetching quick stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchQuickStats();
  }, [user?.campusId, user?.uid]);

  useEffect(() => {
    if (user && !hasInitialized) {
      // Stagger the API calls to prevent overwhelming the server
      fetchPosts();
      // Delay polls and events fetching to reduce concurrent load
      setTimeout(() => fetchPolls(), 150);
      setTimeout(() => fetchEvents(), 300);
      setHasInitialized(true);
    }
  }, [user?.uid, hasInitialized]); // Only run once when user is available

  const handleRefresh = async () => {
    if (user) {
      // Stagger refresh calls to prevent overwhelming the server
      refreshPosts();
      setTimeout(() => fetchPolls(), 150);
      setTimeout(() => fetchEvents(), 300);
    }
  };

  const handleLike = async (postId) => {
    try {
      await likePost(postId);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleLikeEvent = async (eventId) => {
    try {
      await likeEvent(eventId);
    } catch (error) {
      console.error('Error liking event:', error);
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
      className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-6"
    >
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Campus Feed 🎓
            </h1>
            <p className="text-blue-100">
              Stay connected with your campus community
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              onClick={handleRefresh}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={loading ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
              >
                <FiRefreshCw className="w-4 h-4" />
              </motion.div>
              <span>Refresh</span>
            </motion.button>
            
            <Link
              to="/create-post"
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
            >
              <FiPlus className="w-4 h-4" />
              <span>New Post</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {[
          { 
            icon: FiBarChart2, 
            value: statsLoading ? '...' : (posts.length > 0 ? posts.length : quickStats.posts || 0), 
            label: "Posts", 
            color: "from-blue-500 to-blue-600",
            isLoading: statsLoading && posts.length === 0
          },
          { 
            icon: FiBarChart2, 
            value: statsLoading ? '...' : (activePolls.length > 0 ? activePolls.length : quickStats.polls || 0), 
            label: "Active Polls", 
            color: "from-green-500 to-green-600",
            isLoading: statsLoading && activePolls.length === 0
          },
          { 
            icon: FiCalendar, 
            value: statsLoading ? '...' : (events.length > 0 ? events.length : quickStats.events || 0), 
            label: "Events", 
            color: "from-purple-500 to-purple-600",
            isLoading: statsLoading && events.length === 0
          },
          { 
            icon: FiStar, 
            value: user?.reputation || 0, 
            label: "Reputation", 
            color: "from-amber-500 to-amber-600",
            isLoading: false
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className={`text-2xl font-bold text-gray-900 ${stat.isLoading ? 'animate-pulse' : ''}`}>
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        className="bg-white rounded-lg shadow-sm border p-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex space-x-1">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'posts' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📝 Posts
          </button>
          <button 
            onClick={() => setActiveTab('polls')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'polls' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📊 Polls
          </button>
          <button 
            onClick={() => setActiveTab('events')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'events' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📅 Events
          </button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* Main Content - Dynamic based on active tab */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                {activeTab === 'posts' && (
                  <>
                    <span>📝</span>
                    <span>Posts</span>
                    <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {posts.length}
                    </span>
                  </>
                )}
                {activeTab === 'polls' && (
                  <>
                    <span>📊</span>
                    <span>Polls</span>
                    <span className="ml-auto bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      {polls.length}
                    </span>
                  </>
                )}
                {activeTab === 'events' && (
                  <>
                    <span>📅</span>
                    <span>Events</span>
                    <span className="ml-auto bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                      {events.length}
                    </span>
                  </>
                )}
              </h2>
            </div>
            <div className="p-6">
              {/* Posts Content */}
              {activeTab === 'posts' && (
                <>
                  {loading ? (
                    <LoadingSkeleton type="post" count={3} />
                  ) : posts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📝</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                      <p className="text-gray-600 mb-4">
                        Be the first to share something with your campus community!
                      </p>
                      <Link
                        to="/create-post"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <FiPlus className="w-4 h-4" />
                        <span>Create First Post</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {posts.map((post, index) => (
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
                    </div>
                  )}
                </>
              )}

              {/* Polls Content */}
              {activeTab === 'polls' && (
                <>
                  {loading ? (
                    <LoadingSkeleton type="poll" count={3} />
                  ) : polls.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📊</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No polls yet</h3>
                      <p className="text-gray-600 mb-4">
                        Create a poll to gather opinions from your campus community!
                      </p>
                      <Link
                        to="/create-poll"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <FiPlus className="w-4 h-4" />
                        <span>Create First Poll</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {polls.map((poll, index) => (
                        <motion.div
                          key={poll.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <PollCard
                            poll={poll}
                            onVote={handlePollVote}
                            hasVoted={poll.hasVoted}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Events Content */}
              {activeTab === 'events' && (
                <>
                  {loading ? (
                    <LoadingSkeleton type="event" count={3} />
                  ) : events.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📅</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
                      <p className="text-gray-600 mb-4">
                        Create an event to bring your campus community together!
                      </p>
                      <Link
                        to="/create-event"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        <FiPlus className="w-4 h-4" />
                        <span>Create First Event</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {events.map((event, index) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <EventCard
                            event={event}
                            currentUser={user}
                            onEdit={handleEditEvent}
                            onDelete={handleDeleteEvent}
                            onLike={handleLikeEvent}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <span>⚡</span>
                <span>Quick Actions</span>
              </h3>
            </div>
            <div className="p-4 space-y-1">
              {[
                { to: "/create-post", icon: "📝", label: "Create Post" },
                { to: "/create-poll", icon: "📊", label: "Create Poll" },
                { to: "/create-event", icon: "📅", label: "Create Event" }
              ].map((action, index) => (
                <Link
                  key={index}
                  to={action.to}
                  className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-lg">{action.icon}</span>
                  <span className="font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Active Polls */}
          {activePolls.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <span>📊</span>
                  <span>Active Polls</span>
                  <span className="ml-auto bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    {activePolls.length}
                  </span>
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {activePolls.slice(0, 2).map((poll, index) => (
                  <motion.div
                    key={poll.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <PollCard
                      poll={poll}
                      onVote={handlePollVote}
                      hasVoted={poll.hasVoted}
                    />
                  </motion.div>
                ))}
                {activePolls.length > 2 && (
                  <button className="w-full text-center text-blue-600 hover:text-blue-700 font-medium py-2">
                    View All Polls ({activePolls.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <span>📅</span>
                  <span>Upcoming Events</span>
                  <span className="ml-auto bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                    {upcomingEvents.length}
                  </span>
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {upcomingEvents.slice(0, 2).map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <EventCard
                      event={event}
                      currentUser={user}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                      onLike={handleLikeEvent}
                    />
                  </motion.div>
                ))}
                {upcomingEvents.length > 2 && (
                  <button className="w-full text-center text-blue-600 hover:text-blue-700 font-medium py-2">
                    View All Events ({upcomingEvents.length})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
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
