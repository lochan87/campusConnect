import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import ThemeToggle from '../ui/ThemeToggle';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import {
  FiBell,
  FiMenu,
  FiSearch,
  FiUser,
  FiLogOut,
  FiSettings,
  FiTrendingUp,
  FiWifi,
  FiWifiOff
} from 'react-icons/fi';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const {
    unreadCount,
    isConnected,
    notifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications
  } = useNotifications();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getNotificationIcon = (type) => {
    const icons = {
      post: '📝', poll: '📊', event: '🎉', event_update: '🔔',
      vote: '👍', announcement: '📢', lost_found: '🔍',
      food: '🍔', meme: '😂', system: '🔔'
    };
    return icons[type] || '🔔';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowNotifications(false);
      setShowUserMenu(false);
    }
  };

  /* Reusable search bar — rendered in both rows */
  const SearchBar = () => (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search posts, polls, events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 transition-colors placeholder-gray-500 dark:placeholder-gray-400 text-sm"
        />
      </div>
    </form>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 z-50">

      {/* ── Row 1: always visible on all screens ── */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center h-16 px-3 sm:px-4 gap-3">

        {/* Left: hamburger + logo + wifi */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <img src="/icon.png" alt="CC" className="h-8 w-8 rounded-xl object-cover shadow-sm flex-shrink-0" />
            <span
              className="hidden sm:block text-base font-bold tracking-tight whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              CampusConnect
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            {isConnected
              ? <><FiWifi className="w-3.5 h-3.5 text-green-500" /><span>Live</span></>
              : <><FiWifiOff className="w-3.5 h-3.5 text-red-500" /><span>Offline</span></>
            }
          </div>
        </div>

        {/* Center: search bar — desktop only (md+) */}
        <div className="hidden md:flex">
          <SearchBar />
        </div>

        {/* Right: trending + notifications + user */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Link
            to="/leaderboard"
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm text-gray-600 dark:text-gray-300"
          >
            <FiTrendingUp className="w-4 h-4" />
            <span className="hidden lg:inline">Trending</span>
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Notifications"
            >
              <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                </div>

                {notifications.length > 0 && (
                  <div className="flex justify-between items-center px-4 py-1.5 border-b border-gray-50 dark:border-gray-700/50">
                    <button onClick={markAllAsRead} className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors">Mark all read</button>
                    <button onClick={clearAllNotifications} className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">Clear all</button>
                  </div>
                )}

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <FiBell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 20).map(notification => (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors last:border-b-0 ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-base mt-0.5 flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(notification.timestamp)}</p>
                          </div>
                          {!notification.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">{user?.firstName?.charAt(0) || 'U'}</span>
              </div>
              <span className="hidden md:block text-sm text-gray-700 dark:text-gray-300 max-w-[80px] truncate">
                {user?.firstName || 'User'}
              </span>
            </button>

            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{user?.displayName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setShowUserMenu(false)}>
                    <FiUser className="w-4 h-4" /><span>Profile</span>
                  </Link>
                  <ThemeToggle />
                  <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setShowUserMenu(false)}>
                    <FiSettings className="w-4 h-4" /><span>Settings</span>
                  </Link>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <FiLogOut className="w-4 h-4" /><span>Sign out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: mobile-only full-width search bar ── */}
      <div className="md:hidden h-12 flex items-center px-3">
        <SearchBar />
      </div>

      {/* Click-outside handler */}
      {(showUserMenu || showNotifications) && (
        <div className="fixed inset-0 z-30" onClick={() => { setShowUserMenu(false); setShowNotifications(false); }} />
      )}
    </nav>
  );
};

export default Navbar;
