import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRightIcon, TrophyIcon, FireIcon, StarIcon, UserIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Leaderboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('reputation');
  const [leaderboardData, setLeaderboardData] = useState({
    topReputation: [],
    mostActive: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching leaderboard data...');
      
      const response = await apiService.getLeaderboardData();
      console.log('📊 Leaderboard data received:', response.data);
      
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
            ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500' 
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getRankIcon(index)}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className={`font-semibold ${isCurrentUser ? 'text-blue-900' : 'text-gray-900'}`}>
                  {userData.displayName}
                  {isCurrentUser && <span className="text-xs text-blue-600 ml-1">(You)</span>}
                </h3>
                {userData.department && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {userData.department}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {userData.year && `${userData.year} • `}
                {userData.email}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${isCurrentUser ? 'text-blue-700' : 'text-gray-900'}`}>
              {getValue()}
            </div>
            <div className="text-xs text-gray-500">{getLabel()}</div>
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
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="flex space-x-4 mb-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded flex-1"></div>
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded mb-4"></div>
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
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          Campus Leaderboard
        </motion.h1>
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600"
        >
          See who's leading the way in campus engagement and contributions
        </motion.p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {currentData.length > 0 ? (
          currentData.map((userData, index) => 
            renderLeaderboardItem(userData, index, activeTab)
          )
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
            <p className="text-gray-600">
              Be the first to contribute and appear on the leaderboard!
            </p>
          </motion.div>
        )}
      </div>

      {/* Refresh Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <span>Refresh Leaderboard</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Leaderboard;
