import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PencilIcon, 
  UserIcon, 
  CalendarIcon, 
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDM } from '../context/DMContext';
import toast from 'react-hot-toast';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import ActivityGraph from '../components/profile/ActivityGraph';
import AvatarUploader from '../components/profile/AvatarUploader';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, updateAvatar, removeAvatar } = useAuth();
  const { startConversation } = useDM();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [sendingDM, setSendingDM] = useState(false);
  const [editData, setEditData] = useState({
    displayName: '',
    course: '',
    department: '',
    year: '',
    bio: ''
  });

  const currentUserId = userId || user?.uid;
  const isOwnProfile = user && currentUserId === user.uid;

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await apiService.getUserProfile(currentUserId);
      
      if (response.data.success) {
        setProfile(response.data.profile);
        setEditData({
          displayName: response.data.profile.displayName || '',
          course: response.data.profile.course || '',
          department: response.data.profile.department || '',
          year: response.data.profile.year || '',
          bio: response.data.profile.bio || ''
        });
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      // More detailed error handling
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.error || 'Server error occurred';
        toast.error(`Failed to load profile: ${errorMessage}`);
      } else if (error.request) {
        // Request was made but no response received
        toast.error('Network error: Unable to connect to server');
      } else {
        // Something else happened
        toast.error('Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchProfile();
    }
  }, [currentUserId, fetchProfile]);

  const handleSaveProfile = async () => {
    try {
      const response = await apiService.updateUserProfile(currentUserId, editData);
      
      if (response.data.success) {
        toast.success('Profile updated successfully');
        setEditing(false);
        fetchProfile(); // Refresh profile data
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return 'Unknown';
    }
    
    try {
      // Handle different date formats
      let dateObj;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string' || typeof date === 'number') {
        dateObj = new Date(date);
      } else if (date.seconds) {
        // Firestore timestamp format
        dateObj = new Date(date.seconds * 1000);
      } else if (date.toDate && typeof date.toDate === 'function') {
        // Firestore timestamp with toDate method
        dateObj = date.toDate();
      } else {
        return 'Unknown';
      }
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Unknown';
      }
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex space-x-4 mb-6">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <UserIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Profile not found</h3>
          <p className="text-gray-600 dark:text-gray-300">The requested user profile could not be found.</p>
        </div>
      </div>
    );
  }

  // Filter out expired polls from recent polls
  const activeRecentPolls = profile.recentPolls ? profile.recentPolls.filter(poll => {
    if (!poll.expiresAt) return true; // No expiration date means active
    return new Date() <= new Date(poll.expiresAt);
  }) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-6"
    >
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
        >
          {isOwnProfile ? 'My Profile' : `${profile.displayName}'s Profile`}
        </motion.h1>
      </div>

      {/* Profile Info Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6"
      >
        {/* Profile Header */}
        <div className="space-y-4">
          {/* Mobile/Desktop Header with Edit Button */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            {/* Profile Info */}
            <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
              {/* Avatar */}
              <AvatarUploader
                currentAvatar={profile.avatar || null}
                displayName={profile.displayName}
                size={isOwnProfile ? 88 : 80}
                editable={isOwnProfile && editing}
                onUpload={async (file) => {
                  await updateAvatar(file);
                  setProfile((prev) => ({ ...prev, avatar: URL.createObjectURL(file) }));
                }}
                onRemove={async () => {
                  await removeAvatar();
                  setProfile((prev) => ({ ...prev, avatar: null }));
                }}
              />
              
              {/* Basic Info */}
              <div className="flex-1 min-w-0">
                {editing ? (
                  <input
                    type="text"
                    value={editData.displayName}
                    onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                    className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-transparent w-full mb-1"
                    placeholder="Display Name"
                  />
                ) : (
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{profile.displayName}</h2>
                )}
                
                {profile.username && (
                  <p className="text-blue-600 dark:text-blue-400 font-medium text-sm sm:text-base break-words">@{profile.username}</p>
                )}
                
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base break-words">{profile.email}</p>
                
                {/* Student ID - Display only, no editing */}
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base mt-1">
                  Student ID: {profile.studentId || 'Not provided'}
                </p>
              </div>
            </div>
            
            {/* Action Buttons (own = edit, other = message) */}
            {isOwnProfile && !editing ? (
              <div className="flex justify-center sm:justify-end">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-md w-full sm:w-auto justify-center"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span className="font-medium">Edit Profile</span>
                </button>
              </div>
            ) : !isOwnProfile && (
              <div className="flex justify-center sm:justify-end">
                <button
                  disabled={sendingDM}
                  onClick={async () => {
                    setSendingDM(true);
                    try {
                      const conv = await startConversation(currentUserId);
                      navigate(`/messages/${conv.id}`);
                    } finally {
                      setSendingDM(false);
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md w-full sm:w-auto justify-center disabled:opacity-60"
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  <span className="font-medium">{sendingDM ? 'Opening…' : 'Send Message'}</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Academic Info */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            {editing ? (
              <div className="space-y-4">
                {/* Course and Department - Display only, auto-selected from Student ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Course</label>
                    <div className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                      {profile.course || 'Auto-selected from Student ID'}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Auto-selected from Student ID</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                    <div className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                      {profile.department || 'Auto-selected from Student ID'}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Auto-selected from Student ID</p>
                  </div>
                </div>
                
                {/* Year - Editable */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                    <select
                      value={editData.year}
                      onChange={(e) => setEditData({...editData, year: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Post Graduate">Post Graduate</option>
                      <option value="Ph.D">Ph.D</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {profile.course && (
                  <span className="flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs sm:text-sm mb-4">
                    <AcademicCapIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {profile.course}
                  </span>
                )}
                {profile.department && (
                  <span className="flex items-center bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs sm:text-sm mb-4">
                    <AcademicCapIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {profile.department}
                  </span>
                )}
                {profile.year && (
                  <span className="flex items-center bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-xs sm:text-sm mb-4">
                    <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {profile.year}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</h3>
              {editing ? (
                <>
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData({...editData, bio: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                  
                  {/* Save/Cancel buttons for editing mode */}
                  {isOwnProfile && (
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                      <button
                        onClick={() => setEditing(false)}
                        className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-center text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors font-medium text-center text-sm sm:text-base"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">
                  {profile.bio || 'No bio available.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <TrophyIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              <AnimatedCounter end={profile.reputation || 0} />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Reputation</div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              <AnimatedCounter end={profile.stats?.totalPosts || 0} />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Posts</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              <AnimatedCounter end={profile.stats?.totalPolls || 0} />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Polls</div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <FireIcon className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              <AnimatedCounter end={profile.stats?.recentActivity || 0} />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Recent Activity</div>
          </div>
        </div>

        {/* Feature #15 — Activity Graph */}
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <span>📅</span> Post Activity
          </h3>
          <ActivityGraph posts={profile.recentPosts || []} />
        </div>
      </motion.div>

      {/* Recent Posts */}
      {profile.recentPosts?.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Posts</h3>
          <div className="space-y-3">
            {profile.recentPosts.slice(0, 5).map((post, index) => (
              <div key={post.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white">{post.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{post.content}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatDate(post.createdAt)}</span>
                  <span>{post.likes} likes</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Polls */}
      {activeRecentPolls.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Polls</h3>
          <div className="space-y-3">
            {activeRecentPolls.slice(0, 5).map((poll, index) => (
              <div key={poll.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white">{poll.question}</h4>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatDate(poll.createdAt)}</span>
                  <span>{poll.totalVotes} votes</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Join Date */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400"
      >
        Member since {formatDate(profile.joinedAt)}
      </motion.div>
    </motion.div>
  );
};

export default Profile;
