import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import CreatePoll from './pages/CreatePoll';
import CreateEvent from './pages/CreateEvent';
import PostDetail from './pages/PostDetail';
import EventDetail from './pages/EventDetail';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import Search from './pages/Search';

// Services
import { socketService } from './services/socket';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { PostProvider } from './context/PostContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';

// Styles
import './App.css';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Keyboard navigation for sidebar
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);




  useEffect(() => {
    if (user) {
      // Initialize socket connection when user logs in
      socketService.connect();
      
      // Join campus room after connection is established
      const handleConnectionEstablished = (connected) => {
        if (connected && user.campusId) {
          socketService.joinCampus(user.campusId);
        }
      };
      
      // Listen for connection status changes
      socketService.on('connectionStatusChanged', handleConnectionEstablished);
      
      // If already connected, join immediately
      if (socketService.isSocketConnected() && user.campusId) {
        socketService.joinCampus(user.campusId);
      }
      
      return () => {
        socketService.off('connectionStatusChanged', handleConnectionEstablished);
      };
    }

    return () => {
      if (!user) {
        socketService.disconnect();
      }
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading CampusConnect...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Navbar - fixed at top */}
      <Navbar 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      
      {/* Main layout container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-28 md:top-16 bottom-0 left-0 z-40 w-64 backdrop-blur-xl bg-white/75 dark:bg-gray-900/80 shadow-[4px_0_30px_rgba(99,102,241,0.12)] border-r border-indigo-100/60 dark:border-white/10"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay — closes sidebar on click-outside OR any scroll attempt */}
        {sidebarOpen && (
          <div 
            className="fixed top-28 md:top-16 inset-x-0 bottom-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarOpen(false)}
            onWheel={() => setSidebarOpen(false)}
            onTouchMove={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content - independent scroll area with navbar spacing */}
        <main
          className="flex-1 overflow-y-auto pt-28 md:pt-16 bg-gray-50 dark:bg-gray-900"
          onScroll={() => sidebarOpen && setSidebarOpen(false)}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/create-post" element={<CreatePost />} />
                <Route path="/create-poll" element={<CreatePoll />} />
                <Route path="/create-event" element={<CreateEvent />} />
                <Route path="/events/edit/:eventId" element={<CreateEvent />} />
                <Route path="/event/:eventId" element={<EventDetail />} />
                <Route path="/post/:postId" element={<PostDetail />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/search" element={<Search />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PostProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </PostProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
