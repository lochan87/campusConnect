import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRightIcon, TrophyIcon, FireIcon, StarIcon, UserIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Leaderboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reputation');
  const [leaderboardData, setLeaderboardData] = useState({
    topReputation: [],
    mostActive: []
  });
  const [loading, setLoading] = useState(true);

  // Check if current user is a demo user
  const isDemoUser = () => {
    if (!user) return false;
    return (
      user.uid?.startsWith('demo-') || 
      user.uid?.includes('demo') ||
      user.email?.includes('demo-user-') ||
      user.displayName === 'Demo User'
    );
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Handler for Create Account button
  const handleCreateAccount = async () => {
    try {
      await logout(); // Log out the demo user
      toast.success('Demo session ended. Please create your account.');
      navigate('/register'); // Navigate to register page
    } catch (error) {
      console.error('Error logging out demo user:', error);
      navigate('/register'); // Navigate anyway
    }
  };

  // Handler for Sign In button  
  const handleSignIn = async () => {
    try {
      await logout(); // Log out the demo user
      toast.success('Demo session ended. Please sign in to your account.');
      navigate('/login'); // Navigate to login page
    } catch (error) {
      console.error('Error logging out demo user:', error);
      navigate('/login'); // Navigate anyway
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      const response = await apiService.getLeaderboardData(user?.campusId);

      if (response.data.success) {
        setLeaderboardData(response.data.leaderboard);
      } else {
        toast.error('Failed to load leaderboard');
      }
    } catch (error) {
      console.error('❌ Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const renderLeaderboardItem = (userData, index, type) => {
    const isCurrentUser = user && userData.id === user.uid;
    const getRankIcon = (position) => {
      if (position === 0) return <TrophyIcon className="w-6 h-6 text-yellow-500" />;
      if (position === 1) return <TrophyIcon className="w-6 h-6 text-gray-400" />;
      if (position === 2) return <TrophyIcon className="w-6 h-6 text-orange-600" />;
      return <span className="w-6 h-6 flex items-center justify-center text-sm font-semibold text-gray-600">#{position + 1}</span>;
    };

    const getValue = () => {
      return type === 'reputation' ? userData.reputation : userData.postCount;
    };

    const getLabel = () => {
      return type === 'reputation' ? 'reputation' : 'posts';
    };

    return (
      <motion.div
        key={userData.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
          isCurrentUser 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 ring-2 ring-blue-500 dark:ring-blue-400' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getRankIcon(index)}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className={`font-semibold ${isCurrentUser ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>
                  {userData.displayName}
                  {isCurrentUser && <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">(You)</span>}
                </h3>
                {userData.department && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                    {userData.department}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {userData.year && `${userData.year} • `}
                {userData.email}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${isCurrentUser ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
              {getValue()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{getLabel()}</div>
          </div>
        </div>
      </motion.div>
    );
  };

  const tabs = [
    { id: 'reputation', label: 'Top Reputation', icon: StarIcon },
    { id: 'activity', label: 'Most Active', icon: FireIcon }
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="flex space-x-4 mb-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  const currentData = activeTab === 'reputation' ? leaderboardData.topReputation : leaderboardData.mostActive;

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
          Campus Leaderboard
        </motion.h1>
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 dark:text-gray-400"
        >
          See who's leading the way in campus engagement and contributions
        </motion.p>
      </div>

      {/* Demo User Account Creation Prompt */}
      {isDemoUser() && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Create Your Account to Join the Leaderboard!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You're currently using a demo account. Create a real account to:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-4">
                <li>• Earn reputation points for your posts and contributions</li>
                <li>• Appear on the campus leaderboard rankings</li>
                <li>• Track your activity and engagement over time</li>
                <li>• Connect with real campus community members</li>
              </ul>
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateAccount}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
                >
                  Create Account
                </button>
                <button
                  onClick={handleSignIn}
                  className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Leaderboard Podium & List */}
      {currentData.length > 0 ? (
        <div className="space-y-8">
          {/* Top 3 Winners Podium Block */}
          <div className="bg-gradient-to-b from-indigo-50/50 via-white to-gray-50 dark:from-indigo-950/30 dark:via-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-indigo-100/70 dark:border-gray-700/60 shadow-sm">
            <h2 className="text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6">
              🏆 Top Champions
            </h2>
            <div className="flex items-end justify-center gap-3 sm:gap-6 pt-4">
              {/* 2nd Place (Left) */}
              {currentData[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex-1 max-w-[170px] flex flex-col items-center text-center"
                >
                  <div className="relative mb-2">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl z-10">🥈</span>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-1 bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500 shadow-md">
                      <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200 text-lg">
                        {currentData[1].displayName?.charAt(0) || 'U'}
                      </div>
                    </div>
                  </div>
                  <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate max-w-full">
                    {currentData[1].displayName}
                  </p>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mb-2">
                    {activeTab === 'reputation' ? `${currentData[1].reputation} pts` : `${currentData[1].postCount} posts`}
                  </p>
                  <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-slate-300/40 to-slate-200/20 dark:from-slate-800 dark:to-slate-700/40 rounded-t-xl border-t-2 border-slate-400 dark:border-slate-500 flex items-center justify-center shadow-inner">
                    <span className="text-xl font-extrabold text-slate-500 dark:text-slate-300">#2</span>
                  </div>
                </motion.div>
              )}

              {/* 1st Place (Center - Tallest) */}
              {currentData[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex-1 max-w-[190px] flex flex-col items-center text-center z-10"
                >
                  <div className="relative mb-2">
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl z-10 animate-bounce">👑</span>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 shadow-xl ring-4 ring-yellow-400/30">
                      <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center font-black text-amber-600 dark:text-amber-400 text-xl sm:text-2xl">
                        {currentData[0].displayName?.charAt(0) || 'U'}
                      </div>
                    </div>
                  </div>
                  <p className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white truncate max-w-full">
                    {currentData[0].displayName}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-extrabold mb-2">
                    {activeTab === 'reputation' ? `${currentData[0].reputation} pts` : `${currentData[0].postCount} posts`}
                  </p>
                  <div className="w-full h-32 sm:h-36 bg-gradient-to-t from-amber-400/40 via-yellow-300/20 to-amber-100/30 dark:from-amber-900/60 dark:to-amber-700/30 rounded-t-xl border-t-4 border-amber-400 dark:border-amber-500 flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-300">🥇 #1</span>
                  </div>
                </motion.div>
              )}

              {/* 3rd Place (Right) */}
              {currentData[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex-1 max-w-[170px] flex flex-col items-center text-center"
                >
                  <div className="relative mb-2">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl z-10">🥉</span>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-1 bg-gradient-to-br from-amber-600 via-orange-700 to-amber-800 shadow-md">
                      <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center font-bold text-amber-700 dark:text-amber-400 text-lg">
                        {currentData[2].displayName?.charAt(0) || 'U'}
                      </div>
                    </div>
                  </div>
                  <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate max-w-full">
                    {currentData[2].displayName}
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-500 font-semibold mb-2">
                    {activeTab === 'reputation' ? `${currentData[2].reputation} pts` : `${currentData[2].postCount} posts`}
                  </p>
                  <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-orange-400/30 to-amber-200/20 dark:from-orange-950/60 dark:to-orange-800/30 rounded-t-xl border-t-2 border-amber-600 dark:border-amber-700 flex items-center justify-center shadow-inner">
                    <span className="text-xl font-extrabold text-amber-700 dark:text-amber-400">#3</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Full Rankings List (starting from #4 onwards or complete list) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
              Full Rankings
            </h3>
            {currentData.map((userData, index) => 
              renderLeaderboardItem(userData, index, activeTab)
            )}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <UserIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No data available</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Be the first to contribute and appear on the leaderboard!
          </p>
        </motion.div>
      )}

      {/* Refresh Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <span>Refresh Leaderboard</span>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Leaderboard;
