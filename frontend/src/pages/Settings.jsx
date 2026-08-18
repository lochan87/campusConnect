import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StudentIdModal from '../components/ui/StudentIdModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import AvatarUploader from '../components/profile/AvatarUploader';
import {
  FiUser,
  FiLock,
  FiMail,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiX,
  FiLoader,
  FiSave,
  FiCreditCard,
  FiTrash2,
  FiAlertTriangle,
  FiCamera
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateAvatar, removeAvatar } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('photo');

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

  // Student ID change state
  const [studentIdData, setStudentIdData] = useState({
    newStudentId: '',
    currentStudentId: '',
    password: '' // Required for student ID change verification
  });
  const [studentIdError, setStudentIdError] = useState('');

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showStudentIdModal, setShowStudentIdModal] = useState(false);

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
        setStudentIdData(prev => ({
          ...prev,
          currentStudentId: response.data.profile.studentId || ''
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/check-username/${username}`);
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

  const handleStudentIdChange = (field, value) => {
    setStudentIdData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'newStudentId') {
      setStudentIdError('');
      // Basic student ID validation
      if (value && value.length < 3) {
        setStudentIdError('Student ID must be at least 3 characters');
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

  const handleStudentIdSubmit = async (e) => {
    e.preventDefault();

    if (!studentIdData.newStudentId.trim()) {
      toast.error('Please enter a new Student ID');
      return;
    }

    if (!studentIdData.password) {
      toast.error('Please enter your current password to verify this change');
      return;
    }

    if (studentIdData.newStudentId === studentIdData.currentStudentId) {
      toast.error('New Student ID must be different from current Student ID');
      return;
    }

    try {
      setLoading(true);
      
      // This would need to be implemented in the backend
      const response = await apiService.changeStudentId({
        userId: user.uid,
        newStudentId: studentIdData.newStudentId,
        password: studentIdData.password
      });

      if (response.data.success) {
        let successMessage = 'Student ID updated successfully!';
        
        // Show auto-updated course and department info
        const { autoUpdated } = response.data;
        if (autoUpdated && (autoUpdated.course || autoUpdated.department)) {
          const autoUpdatedItems = [];
          if (autoUpdated.course) autoUpdatedItems.push(`Course: ${autoUpdated.course}`);
          if (autoUpdated.department) autoUpdatedItems.push(`Department: ${autoUpdated.department}`);
          
          if (autoUpdatedItems.length > 0) {
            successMessage += ` Auto-updated: ${autoUpdatedItems.join(', ')}`;
          }
        }
        
        toast.success(successMessage);
        setStudentIdData({
          newStudentId: '',
          currentStudentId: response.data.newStudentId || studentIdData.newStudentId,
          password: ''
        });
        
        // Refresh user profile to show updated course/department
        fetchUserProfile();
      } else {
        toast.error(response.data.error || 'Failed to update Student ID');
      }
    } catch (error) {
      console.error('Error updating Student ID:', error);
      toast.error(error.response?.data?.error || 'Failed to update Student ID');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error('User not found');
      return;
    }

    try {
      setDeleteLoading(true);
      
      // Call the delete account API
      await apiService.deleteUserAccount();
      
      toast.success('Account deleted successfully');
      
      // Log out the user
      logout();
      
      // Navigate to home page
      navigate('/', { replace: true });
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete account';
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const tabs = [
    { id: 'photo',     label: 'Profile Photo',     mobileLabel: 'Photo',     icon: FiCamera },
    { id: 'username',  label: 'Change Username',   mobileLabel: 'Username',  icon: FiUser },
    { id: 'password',  label: 'Change Password',   mobileLabel: 'Password',  icon: FiLock },
    { id: 'email',     label: 'Change Email',      mobileLabel: 'Email',     icon: FiMail },
    { id: 'studentId', label: 'Change Student ID', mobileLabel: 'Student ID', icon: FiCreditCard },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your account settings and preferences</p>
      </motion.div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5
                    px-1 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors
                    ${
                      isActive
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="sm:hidden text-[10px] leading-tight text-center">{tab.mobileLabel}</span>
                  <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">

            {/* ── Profile Photo tab ── */}
            {activeTab === 'photo' && (
              <motion.div
                key="photo"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Profile Photo</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Your profile photo is visible to everyone on your campus. Upload a clear, square photo for best results.
                    </p>
                  </div>

                  <div className="flex flex-col items-center py-6 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <AvatarUploader
                      currentAvatar={user?.avatar || null}
                      displayName={user?.displayName || user?.username || '?'}
                      size={120}
                      editable={true}
                      onUpload={async (file) => {
                        await updateAvatar(file);
                      }}
                      onRemove={async () => {
                        await removeAvatar();
                      }}
                    />
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
                    <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-2">Tips</h4>
                    <ul className="text-xs text-indigo-600/80 dark:text-indigo-400 space-y-1">
                      <li>• Use a square image for best results (it will be cropped to a circle)</li>
                      <li>• Supported formats: JPEG, PNG, WebP · Max file size: 5 MB</li>
                      <li>• Your image is resized to 300×300 px before upload to keep it fast</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'username' && (
              <motion.div
                key="username"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Change Username</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Your username is how other users will identify you on the platform.
                    </p>
                  </div>

                  <form onSubmit={handleUsernameSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Username
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <input
                          type="text"
                          value={usernameData.currentUsername}
                          disabled
                          className="pl-10 w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                          placeholder="No username set"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Username
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <input
                          type="text"
                          value={usernameData.newUsername}
                          onChange={handleUsernameChange}
                          className={`pl-10 pr-10 w-full px-3 py-2.5 border rounded-lg transition-colors text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                            usernameError
                              ? 'border-red-500 focus:border-red-500'
                              : usernameAvailable === true
                              ? 'border-green-500 focus:border-green-500'
                              : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400'
                          }`}
                          placeholder="Enter new username"
                        />
                        
                        {/* Status indicator */}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {usernameChecking && (
                            <FiLoader className="w-4 h-4 text-gray-400 dark:text-gray-500 animate-spin" />
                          )}
                          {!usernameChecking && usernameAvailable === true && (
                            <FiCheck className="w-4 h-4 text-green-500 dark:text-green-400" />
                          )}
                          {!usernameChecking && usernameAvailable === false && (
                            <FiX className="w-4 h-4 text-red-500 dark:text-red-400" />
                          )}
                        </div>
                      </div>
                      
                      {/* Feedback messages */}
                      {usernameError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{usernameError}</p>
                      )}
                      {!usernameError && usernameAvailable === true && (
                        <p className="mt-1 text-sm text-green-600 dark:text-green-400">Username is available!</p>
                      )}
                      {usernameData.newUsername.length > 0 && usernameData.newUsername.length < 3 && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Username must be at least 3 characters</p>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={loading || usernameAvailable !== true || !usernameData.newUsername.trim()}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm"
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
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Change Password</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Choose a strong password to keep your account secure.
                    </p>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          className="pl-10 pr-10 w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPasswords.current ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          className="pl-10 pr-10 w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPasswords.new ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Password must be at least 6 characters</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          className="pl-10 pr-10 w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPasswords.confirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">Passwords do not match</p>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm"
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
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 sm:mb-4">Change Email Address</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
                      Update your email address. You'll need to enter your current password to verify this change.
                    </p>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Email
                      </label>
                      <input
                        type="email"
                        value={emailData.currentEmail}
                        disabled
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Email Address
                      </label>
                      <input
                        type="email"
                        value={emailData.newEmail}
                        onChange={(e) => handleEmailChange('newEmail', e.target.value)}
                        placeholder="Enter new email address"
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      {emailError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{emailError}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={emailData.password}
                          onChange={(e) => handleEmailChange('password', e.target.value)}
                          placeholder="Enter your current password"
                          className="w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPasswords.current ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={loading || !emailData.newEmail || !emailData.password || emailError}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm"
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

            {activeTab === 'studentId' && (
              <motion.div
                key="studentId"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 sm:mb-4">Change Student ID</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
                      Update your Student ID. You'll need to enter your current password to verify this change.
                      <br />
                      <span className="text-blue-600 dark:text-blue-400 font-medium">Note: Course and department will be automatically updated based on your new Student ID.</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowStudentIdModal(true)}
                      className="mb-4 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-semibold transition-colors flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                      View ID Directory &amp; Builder
                    </button>
                  </div>

                  <form onSubmit={handleStudentIdSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Student ID
                      </label>
                      <input
                        type="text"
                        value={studentIdData.currentStudentId || 'Not set'}
                        disabled
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                        placeholder="No Student ID currently set"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Student ID
                      </label>
                      <input
                        type="text"
                        value={studentIdData.newStudentId}
                        onChange={(e) => handleStudentIdChange('newStudentId', e.target.value)}
                        placeholder="Enter new Student ID"
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      {studentIdError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{studentIdError}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={studentIdData.password}
                          onChange={(e) => handleStudentIdChange('password', e.target.value)}
                          placeholder="Enter your current password"
                          className="w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPasswords.current ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={loading || !studentIdData.newStudentId || !studentIdData.password || studentIdError}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm"
                      >
                        {loading ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiSave className="w-4 h-4" />
                        )}
                        <span>{loading ? 'Updating...' : 'Update Student ID'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Danger Zone */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700 overflow-hidden"
      >
        <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-200 dark:border-red-700">
          <div className="flex items-center space-x-2">
            <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-300">Danger Zone</h2>
          </div>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            Irreversible and destructive actions
          </p>
        </div>
        
        <div className="p-4 sm:p-6">
          <div className="border border-red-300 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">Delete Account</h3>
                <p className="text-red-800 dark:text-red-400 text-sm mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 mb-4 sm:mb-0">
                  <h4 className="font-medium text-red-900 dark:text-red-300 mb-2 text-sm">What will be permanently deleted:</h4>
                  <ul className="text-xs text-red-800 dark:text-red-400 space-y-1">
                    <li>• Your profile and personal information</li>
                    <li>• All your posts and comments</li>
                    <li>• All your polls and votes</li>
                    <li>• Your reputation and activity history</li>
                    <li>• All associated data from our servers</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-center sm:justify-start sm:ml-6">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors flex items-center justify-center space-x-2 font-medium text-sm"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <FiAlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Delete Account</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you absolutely sure you want to delete your account? This will permanently remove all your data.
              </p>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                This action is irreversible and cannot be undone.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {deleteLoading ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4" />
                    <span>Delete Account</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Student ID Directory & Builder Modal */}
      {showStudentIdModal && (
        <StudentIdModal
          onClose={() => setShowStudentIdModal(false)}
        />
      )}
    </div>
  );
};

export default Settings;
