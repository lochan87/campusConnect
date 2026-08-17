import React, { useState, useRef, useEffect } from 'react';
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
  FiAward,
  FiTrendingUp,
  FiWifi,
  FiWifiOff,
  FiMessageSquare
} from 'react-icons/fi';
import { useDM } from '../../context/DMContext';

/* Extracted outside Navbar so React doesn't treat it as a new component type
   on every render — prevents the input from unmounting/remounting and losing focus */
const SearchBar = ({ searchQuery, onChange, onSubmit }) => (
  <form onSubmit={onSubmit} className="w-full">
    <div className="relative">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
      <input
        type="text"
        placeholder="Search posts, polls, events..."
        value={searchQuery}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 transition-colors placeholder-gray-500 dark:placeholder-gray-400 text-sm"
      />
    </div>
  </form>
);

/**
 * Feature #10 — Swipe-to-dismiss notification item (mobile-first).
 * Drag left ≥ 80px to dismiss. Red reveal underneath. Uses native Pointer Events.
 */
const SwipeableNotification = ({ notification, onRead, onDismiss, icon }) => {
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  const handlePointerDown = (e) => {
    startX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    const delta = e.clientX - startX.current;
    // Only allow left swipe
    if (delta < 0) setTranslateX(delta);
  };

  const handlePointerUp = () => {
    setDragging(false);
    if (translateX < -80) {
      // Fly out
      setTranslateX(-500);
      setTimeout(() => onDismiss(notification.id), 280);
    } else {
      // Snap back
      setTranslateX(0);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Red dismiss layer underneath */}
      <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-4">
        <span className="text-white text-xs font-semibold">Dismiss</span>
      </div>
      {/* Swipeable content */}
      <div
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? 'none' : 'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => onRead(notification.id)}
        className={`relative px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors last:border-b-0 touch-pan-y ${
          !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-800'
        }`}
      >
        <div className="flex items-start gap-2 pointer-events-none">
          <span className="text-base mt-0.5 flex-shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{notification.message}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(notification.timestamp)}</p>
          </div>
          {!notification.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const {
    unreadCount,
    isConnected,
    notifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    removeNotification
  } = useNotifications();
  const { totalUnread: dmTotalUnread } = useDM();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  // Close popups when main content is scrolled — same UX as sidebar
  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (!container) return;
    const handleScroll = () => {
      if (showUserMenu) setShowUserMenu(false);
      if (showNotifications) setShowNotifications(false);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [showUserMenu, showNotifications]);

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

  return (
    <nav className="fixed top-0 left-0 right-0 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 shadow-[0_2px_20px_rgba(99,102,241,0.15)] border-b border-indigo-100/60 dark:border-white/10 z-50">

      {/* ── Row 1: always visible on all screens ── */}
      <div className="flex items-center justify-between h-16 px-3 sm:px-6 max-w-7xl mx-auto gap-2 sm:gap-4">

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
              ? <><FiWifi className="w-3.5 h-3.5 text-green-500" /><span className="font-medium text-green-600 dark:text-green-400">Live</span></>
              : <><FiWifiOff className="w-3.5 h-3.5 text-red-500" /><span>Offline</span></>
            }
          </div>
        </div>

        {/* Center: search bar — desktop only (md+) */}
        <div className="hidden md:flex flex-1 max-w-md mx-2">
          <SearchBar
            searchQuery={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSubmit={handleSearch}
          />
        </div>

        {/* Right: champions + notifications + user */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Link
            to="/leaderboard"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-amber-600 dark:text-amber-400"
          >
            <FiAward className="w-4 h-4 text-amber-500" />
            <span className="hidden lg:inline">Champions</span>
          </Link>

          {/* Direct Messages icon */}
          <Link
            to="/messages"
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Messages"
          >
            <FiMessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {dmTotalUnread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-xs rounded-full flex items-center justify-center leading-none">
                {dmTotalUnread > 9 ? '9+' : dmTotalUnread}
              </span>
            )}
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
                onClick={(e) => e.stopPropagation()}
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
                      <SwipeableNotification
                        key={notification.id}
                        notification={notification}
                        onRead={markAsRead}
                        onDismiss={removeNotification}
                        icon={getNotificationIcon(notification.type)}
                      />
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
              {/* Avatar — real photo if set, else gradient initial */}
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.displayName || user?.firstName || 'User'}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-indigo-200 dark:ring-indigo-700"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-semibold">
                    {(user?.displayName || user?.firstName || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="hidden md:block text-sm text-gray-700 dark:text-gray-300 max-w-[80px] truncate">
                {user?.displayName || user?.firstName || 'User'}
              </span>
            </button>

            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
              >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-indigo-100 dark:ring-indigo-800" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-base font-bold">
                        {(user?.displayName || user?.firstName || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">{user?.displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
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
        <SearchBar
          searchQuery={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSubmit={handleSearch}
        />
      </div>

      {/* Click-outside handler */}
      {(showUserMenu || showNotifications) && (
        <div className="fixed inset-0 z-30" onClick={() => { setShowUserMenu(false); setShowNotifications(false); }} />
      )}
    </nav>
  );
};

export default Navbar;
