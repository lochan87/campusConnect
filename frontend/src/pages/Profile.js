import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
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
import toast from 'react-hot-toast';

const Profile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: '',
    username: '',
    department: '',
    year: '',
    bio: ''
  });

  const currentUserId = userId || user?.uid;
  const isOwnProfile = user && currentUserId === user.uid;

  useEffect(() => {
    if (currentUserId) {
      fetchProfile();
    }
  }, [currentUserId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('👤 Fetching profile for:', currentUserId);
      
      const response = await apiService.getUserProfile(currentUserId);
      console.log('✅ Profile data received:', response.data);
      
      if (response.data.success) {
        setProfile(response.data.profile);
        setEditData({
          displayName: response.data.profile.displayName || '',
          username: response.data.profile.username || '',
          department: response.data.profile.department || '',
          year: response.data.profile.year || '',
          bio: response.data.profile.bio || ''
        });
      } else {
        console.error('❌ Profile fetch failed:', response.data);
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
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
  };

  const handleSaveProfile = async () => {
    try {
      console.log('💾 Saving profile updates...');
      
      const response = await apiService.updateUserProfile(currentUserId, editData);
      
      if (response.data.success) {
        toast.success('Profile updated successfully');
        setEditing(false);
        fetchProfile(); // Refresh profile data
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex space-x-4 mb-6">
              <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
          <p className="text-gray-600">The requested user profile could not be found.</p>
        </div>
      </div>
    );
  }

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
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          {isOwnProfile ? 'My Profile' : `${profile.displayName}'s Profile`}
        </motion.h1>
      </div>

      {/* Profile Info Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-lg border border-gray-200 p-6 mb-6"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {profile.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editData.displayName}
                    onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                    className="text-2xl font-bold text-gray-900 border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent w-full"
                    placeholder="Display Name"
                  />
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => setEditData({...editData, username: e.target.value})}
                    className="text-blue-600 font-medium border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                    placeholder="username"
                  />
                </div>
              ) : (
                <h2 className="text-2xl font-bold text-gray-900">{profile.displayName}</h2>
              )}
              {!editing && profile.username && (
                <p className="text-blue-600 font-medium">@{profile.username}</p>
              )}
              <p className="text-gray-600">{profile.email}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                {editing ? (
                  <>
                    <select
                      value={editData.department}
                      onChange={(e) => setEditData({...editData, department: e.target.value})}
                      className="border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">Select Department</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Business">Business</option>
                      <option value="Arts">Arts</option>
                      <option value="Science">Science</option>
                    </select>
                    <select
                      value={editData.year}
                      onChange={(e) => setEditData({...editData, year: e.target.value})}
                      className="border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">Select Year</option>
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </>
                ) : (
                  <>
                    {profile.department && (
                      <span className="flex items-center">
                        <AcademicCapIcon className="w-4 h-4 mr-1" />
                        {profile.department}
                      </span>
                    )}
                    {profile.year && (
                      <span className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {profile.year}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          {isOwnProfile && (
            <div className="flex space-x-2">
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bio Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Bio</h3>
          {editing ? (
            <textarea
              value={editData.bio}
              onChange={(e) => setEditData({...editData, bio: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
              placeholder="Tell us about yourself..."
            />
          ) : (
            <p className="text-gray-600">
              {profile.bio || 'No bio available.'}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <TrophyIcon className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.reputation}</div>
            <div className="text-sm text-gray-600">Reputation</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <DocumentTextIcon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.stats.totalPosts}</div>
            <div className="text-sm text-gray-600">Posts</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.stats.totalPolls}</div>
            <div className="text-sm text-gray-600">Polls</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <FireIcon className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.stats.recentActivity}</div>
            <div className="text-sm text-gray-600">Recent Activity</div>
          </div>
        </div>
      </motion.div>

      {/* Recent Posts */}
      {profile.recentPosts.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Posts</h3>
          <div className="space-y-3">
            {profile.recentPosts.slice(0, 5).map((post, index) => (
              <div key={post.id} className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">{post.title}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>{formatDate(post.createdAt)}</span>
                  <span>{post.likes} likes</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Polls */}
      {profile.recentPolls.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Polls</h3>
          <div className="space-y-3">
            {profile.recentPolls.slice(0, 5).map((poll, index) => (
              <div key={poll.id} className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">{poll.question}</h4>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
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
        className="text-center mt-6 text-sm text-gray-500"
      >
        Member since {formatDate(profile.joinedAt)}
      </motion.div>
    </motion.div>
  );
};

export default Profile;
