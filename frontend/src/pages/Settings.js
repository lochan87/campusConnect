import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import {
  FiUser,
  FiLock,
  FiMail,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiX,
  FiLoader,
  FiSave
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('username');

  // Username change state
  const [usernameData, setUsernameData] = useState({
    newUsername: '',
    currentUsername: ''
  });
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameError, setUsernameError] = useState('');

  // Email change state
  const [emailData, setEmailData] = useState({
    newEmail: '',
    currentEmail: '',
    password: '' // Required for email change verification
  });
  const [emailError, setEmailError] = useState('');

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    // Fetch current user profile to get username
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await apiService.getUserProfile(user.uid);
      if (response.data.success) {
        setUsernameData(prev => ({
          ...prev,
          currentUsername: response.data.profile.username || ''
        }));
        setEmailData(prev => ({
          ...prev,
          currentEmail: response.data.profile.email || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkUsernameAvailability = async (username) => {
    try {
      setUsernameChecking(true);
      setUsernameError('');
      
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(username)) {
        setUsernameError('Username can only contain letters, numbers, and underscores');
        setUsernameAvailable(false);
        return;
      }

      if (username.length < 3) {
        setUsernameError('Username must be at least 3 characters');
        setUsernameAvailable(false);
        return;
      }

      if (username.length > 20) {
        setUsernameError('Username must be less than 20 characters');
        setUsernameAvailable(false);
        return;
      }

      // Don't check if it's the same as current username
      if (username.toLowerCase() === usernameData.currentUsername.toLowerCase()) {
        setUsernameAvailable(true);
        return;
      }

      // Check availability with backend
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/check-username/${username}`);
      const data = await response.json();
      
      if (data.success) {
        setUsernameAvailable(data.available);
        if (!data.available) {
          setUsernameError('Username is already taken');
        }
      } else {
        setUsernameError('Error checking username availability');
        setUsernameAvailable(false);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('Error checking username availability');
      setUsernameAvailable(false);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleUsernameChange = (e) => {
    const { value } = e.target;
    setUsernameData(prev => ({ ...prev, newUsername: value }));
    
    setUsernameAvailable(null);
    setUsernameError('');
    
    if (value.trim().length >= 3) {
      checkUsernameAvailability(value.trim());
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailChange = (field, value) => {
    setEmailData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'newEmail') {
      setEmailError('');
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setEmailError('Please enter a valid email address');
      }
    }
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    
    if (!usernameData.newUsername.trim()) {
      toast.error('Please enter a new username');
      return;
    }

    if (usernameAvailable === false) {
      toast.error('Please choose a different username');
      return;
    }

    if (usernameData.newUsername.toLowerCase() === usernameData.currentUsername.toLowerCase()) {
      toast.error('New username must be different from current username');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.updateUserProfile(user.uid, {
        username: usernameData.newUsername
      });

      if (response.data.success) {
        toast.success('Username updated successfully!');
        setUsernameData(prev => ({
          currentUsername: prev.newUsername,
          newUsername: ''
        }));
      } else {
        toast.error(response.data.error || 'Failed to update username');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      toast.error(error.response?.data?.error || 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!emailData.newEmail.trim()) {
      toast.error('Please enter a new email address');
      return;
    }

    if (!emailData.password) {
      toast.error('Please enter your current password to verify email change');
      return;
    }

    if (emailError) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (emailData.newEmail.toLowerCase() === emailData.currentEmail.toLowerCase()) {
      toast.error('New email must be different from current email');
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiService.changeEmail({
        userId: user.uid,
        newEmail: emailData.newEmail,
        password: emailData.password
      });

      if (response.data.success) {
        toast.success('Email updated successfully!');
        setEmailData(prev => ({
          currentEmail: prev.newEmail,
          newEmail: '',
          password: ''
        }));
      } else {
        toast.error(response.data.error || 'Failed to update email');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error(error.response?.data?.error || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    try {
      setLoading(true);
      
      // This would need to be implemented in the backend
      const response = await apiService.changePassword({
        userId: user.uid,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        toast.success('Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(response.data.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const tabs = [
    { id: 'username', label: 'Change Username', icon: FiUser },
    { id: 'password', label: 'Change Password', icon: FiLock },
    { id: 'email', label: 'Change Email', icon: FiMail }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </motion.div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'username' && (
              <motion.div
                key="username"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Change Username</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Your username is how other users will identify you on the platform.
                    </p>
                  </div>

                  <form onSubmit={handleUsernameSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Username
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={usernameData.currentUsername}
                          disabled
                          className="pl-10 w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                          placeholder="No username set"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Username
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={usernameData.newUsername}
                          onChange={handleUsernameChange}
                          className={`pl-10 pr-10 w-full px-3 py-3 border rounded-lg transition-colors ${
                            usernameError
                              ? 'border-red-500 focus:border-red-500'
                              : usernameAvailable === true
                              ? 'border-green-500 focus:border-green-500'
                              : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="Enter new username"
                        />
                        
                        {/* Status indicator */}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {usernameChecking && (
                            <FiLoader className="w-5 h-5 text-gray-400 animate-spin" />
                          )}
                          {!usernameChecking && usernameAvailable === true && (
                            <FiCheck className="w-5 h-5 text-green-500" />
                          )}
                          {!usernameChecking && usernameAvailable === false && (
                            <FiX className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      {/* Feedback messages */}
                      {usernameError && (
                        <p className="mt-1 text-sm text-red-600">{usernameError}</p>
                      )}
                      {!usernameError && usernameAvailable === true && (
                        <p className="mt-1 text-sm text-green-600">Username is available!</p>
                      )}
                      {usernameData.newUsername.length > 0 && usernameData.newUsername.length < 3 && (
                        <p className="mt-1 text-sm text-gray-500">Username must be at least 3 characters</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading || usernameAvailable !== true || !usernameData.newUsername.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {loading ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiSave className="w-4 h-4" />
                        )}
                        <span>{loading ? 'Updating...' : 'Update Username'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'password' && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Change Password</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Choose a strong password to keep your account secure.
                    </p>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          className="pl-10 pr-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          className="pl-10 pr-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                        </button>
                      </div>
                      {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                        <p className="mt-1 text-sm text-gray-500">Password must be at least 6 characters</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          className="pl-10 pr-10 w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                        </button>
                      </div>
                      {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {loading ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiSave className="w-4 h-4" />
                        )}
                        <span>{loading ? 'Updating...' : 'Update Password'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'email' && (
              <motion.div
                key="email"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Change Email Address</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Update your email address. You'll need to enter your current password to verify this change.
                    </p>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Email
                      </label>
                      <input
                        type="email"
                        value={emailData.currentEmail}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Email Address
                      </label>
                      <input
                        type="email"
                        value={emailData.newEmail}
                        onChange={(e) => handleEmailChange('newEmail', e.target.value)}
                        placeholder="Enter new email address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {emailError && (
                        <p className="mt-1 text-sm text-red-600">{emailError}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={emailData.password}
                          onChange={(e) => handleEmailChange('password', e.target.value)}
                          placeholder="Enter your current password"
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading || !emailData.newEmail || !emailData.password || emailError}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {loading ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiSave className="w-4 h-4" />
                        )}
                        <span>{loading ? 'Updating...' : 'Update Email'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;
