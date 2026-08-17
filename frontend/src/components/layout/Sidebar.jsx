import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { usePosts } from '../../context/PostContext';
import { useDM } from '../../context/DMContext';
import { 
  FiHome, 
  FiPlus, 
  FiTrendingUp, 
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiBarChart2,
  FiX,
  FiSmile,
  FiSearch,
  FiBox,
  FiSpeaker,
  FiPackage,
  FiMessageSquare
} from 'react-icons/fi';

const Sidebar = ({ onClose }) => {
  const { user } = useAuth();
  const { filters, updateFilters } = usePosts();
  const { totalUnread: dmUnread } = useDM();
  const location = useLocation();

  const navigationItems = [
    { name: 'Home', path: '/', icon: FiHome },
    { name: 'Messages', path: '/messages', icon: FiMessageSquare, badge: dmUnread },
    { name: 'Create Post', path: '/create-post', icon: FiPlus },
    { name: 'Create Poll', path: '/create-poll', icon: FiBarChart2 },
    { name: 'Create Event', path: '/create-event', icon: FiCalendar },
    { name: 'Leaderboard', path: '/leaderboard', icon: FiTrendingUp },
    { name: 'Profile', path: '/profile', icon: FiUsers }
  ];

  const categories = [
    { id: 'all', name: 'All Posts', icon: FiHome, color: 'text-gray-600' },
    { id: 'lost_found', name: 'Lost & Found', icon: FiSearch, color: 'text-yellow-600' },
    { id: 'food', name: 'Food', icon: FiPackage, color: 'text-green-600' },
    { id: 'memes', name: 'Memes', icon: FiSmile, color: 'text-purple-600' },
    { id: 'announcements', name: 'Announcements', icon: FiSpeaker, color: 'text-red-600' },
    { id: 'general', name: 'General', icon: FiBox, color: 'text-gray-600' }
  ];

  const locations = [
    { id: 'all', name: 'All Locations', icon: FiMapPin },
    { id: 'heritage_building', name: 'Heritage Building', icon: FiMapPin },
    { id: 'auditorium', name: 'Auditorium', icon: FiMapPin },
    { id: 'library', name: 'Library', icon: FiMapPin },
    { id: 'parking', name: 'Parking', icon: FiMapPin },
    { id: 'canteen', name: 'Canteen', icon: FiMapPin },
    { id: 'conveno', name: 'Conveno', icon: FiMapPin },
    { id: 'iem_block', name: 'IEM Block', icon: FiMapPin },
    { id: 'grounds', name: 'Grounds', icon: FiMapPin },
    { id: 'amphitheater', name: 'Amphitheater', icon: FiMapPin },
    { id: 'bb_block', name: 'BB Block', icon: FiMapPin },
    { id: 'rock_garden', name: 'Rock Garden', icon: FiMapPin }
  ];

  const handleCategoryChange = (categoryId) => {
    updateFilters({ category: categoryId });
  };

  const handleLocationChange = (locationId) => {
    updateFilters({ location: locationId });
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="h-full bg-transparent flex flex-col relative">


      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-2 pb-6 space-y-4">

          {/* User card + close button in same row */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center space-x-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium">
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.department || 'Student'}
                </p>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0 ml-2"
              aria-label="Close sidebar"
            >
              <FiX className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Navigation
            </h3>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-r-2 border-blue-700 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium flex-1">{item.name}</span>
                  {item.badge > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Current Filters Status */}
          {(filters.category !== 'all' || filters.location !== 'all') && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">Active Filters</h4>
              <div className="space-y-1">
                {filters.category !== 'all' && (
                  <div className="text-xs text-blue-700 dark:text-blue-400 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Category: {categories.find(c => c.id === filters.category)?.name}
                  </div>
                )}
                {filters.location !== 'all' && (
                  <div className="text-xs text-blue-700 dark:text-blue-400 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Location: {locations.find(l => l.id === filters.location)?.name}
                  </div>
                )}
              </div>
              <button
                onClick={() => updateFilters({ category: 'all', location: 'all' })}
                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Categories Filter */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Categories
            </h3>
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = filters.category === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700 dark:text-blue-400' : category.color}`} />
                  <span className="text-sm">{category.name}</span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto w-2 h-2 bg-blue-700 dark:bg-blue-400 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Locations
            </h3>
            {locations.map((location) => {
              const Icon = location.icon;
              const isActive = filters.location === location.id;
              
              return (
                <button
                  key={location.id}
                  onClick={() => handleLocationChange(location.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span className="text-sm">{location.name}</span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto w-2 h-2 bg-green-700 dark:bg-green-400 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Your Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                  {user?.postCount || 0}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500">Posts</p>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                <p className="text-lg font-semibold text-purple-700 dark:text-purple-400">
                  {user?.reputation || 0}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-500">Reputation</p>
              </div>
            </div>
          </div>

          {/* Campus Info */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
              <h4 className="font-semibold text-sm mb-1">Campus Community</h4>
              <p className="text-xs opacity-90">
                Stay connected with your campus community in real-time
              </p>
              <div className="flex items-center space-x-4 mt-3 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Live Updates</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiUsers className="w-3 h-3" />
                  <span>Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
