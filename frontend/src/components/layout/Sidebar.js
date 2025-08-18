import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { usePosts } from '../../context/PostContext';
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
  FiPackage
} from 'react-icons/fi';

const Sidebar = ({ onClose }) => {
  const { user } = useAuth();
  const { filters, updateFilters } = usePosts();
  const location = useLocation();

  const navigationItems = [
    { name: 'Home', path: '/', icon: FiHome },
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
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header - Fixed at top of sidebar, below navbar with proper mobile spacing */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm mt-16 lg:mt-0">
        <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close sidebar"
        >
          <FiX className="w-5 h-5 text-gray-600 hover:text-gray-800" />
        </button>
      </div>

      {/* Scrollable content - independent of header with mobile navbar spacing */}
      <div className="flex-1 overflow-y-auto bg-white lg:pt-0">
        <div className="p-4 space-y-6 pb-6">
          {/* Mobile Search Bar - only visible on mobile */}
          <div className="md:hidden">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts, polls, events..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors text-sm"
              />
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center space-x-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.firstName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.department || 'Student'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
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
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Current Filters Status */}
        {(filters.category !== 'all' || filters.location !== 'all') && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <h4 className="text-xs font-semibold text-blue-800 mb-2">Active Filters</h4>
            <div className="space-y-1">
              {filters.category !== 'all' && (
                <div className="text-xs text-blue-700 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Category: {categories.find(c => c.id === filters.category)?.name}
                </div>
              )}
              {filters.location !== 'all' && (
                <div className="text-xs text-blue-700 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Location: {locations.find(l => l.id === filters.location)?.name}
                </div>
              )}
            </div>
            <button
              onClick={() => updateFilters({ category: 'all', location: 'all' })}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Categories Filter */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
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
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : category.color}`} />
                <span className="text-sm">{category.name}</span>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 bg-blue-700 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Location Filter */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
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
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-green-700' : 'text-gray-500'}`} />
                <span className="text-sm">{location.name}</span>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 bg-green-700 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Your Stats
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-lg font-semibold text-blue-700">
                {user?.postCount || 0}
              </p>
              <p className="text-xs text-blue-600">Posts</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-lg font-semibold text-purple-700">
                {user?.reputation || 0}
              </p>
              <p className="text-xs text-purple-600">Reputation</p>
            </div>
          </div>
        </div>

        {/* Campus Info */}
        <div className="pt-4 border-t border-gray-200">
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
