import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Layout components (always needed — keep eager)
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import BackToTop from './components/ui/BackToTop';
import CommandPalette from './components/ui/CommandPalette';

// Pages — lazy loaded (each becomes a separate JS chunk)
const Home          = lazy(() => import('./pages/Home'));
const Login         = lazy(() => import('./pages/Login'));
const Register      = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Profile       = lazy(() => import('./pages/Profile'));
const CreatePost    = lazy(() => import('./pages/CreatePost'));
const CreatePoll    = lazy(() => import('./pages/CreatePoll'));
const CreateEvent   = lazy(() => import('./pages/CreateEvent'));
const PostDetail    = lazy(() => import('./pages/PostDetail'));
const EventDetail   = lazy(() => import('./pages/EventDetail'));
const Leaderboard   = lazy(() => import('./pages/Leaderboard'));
const Settings      = lazy(() => import('./pages/Settings'));
const Search        = lazy(() => import('./pages/Search'));
const Messages      = lazy(() => import('./pages/Messages'));

// Services
import { socketService } from './services/socket';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { PostProvider } from './context/PostContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { DMProvider } from './context/DMContext';

// Styles
import './App.css';

// Minimal page loader shown while a lazy chunk is downloading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
    </div>
  </div>
);


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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
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
          id="main-scroll-container"
          className="flex-1 overflow-y-auto pt-28 md:pt-16 bg-gray-50 dark:bg-gray-900"
          onScroll={() => sidebarOpen && setSidebarOpen(false)}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </div>
        </main>

        {/* Messages — rendered outside the padded main so its fixed overlay covers the full viewport */}
        <Suspense fallback={null}>
          <Routes>
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:conversationId" element={<Messages />} />
          </Routes>
        </Suspense>
      </div>

      {/* Feature #7 — Back to Top + new-post badge */}
      <BackToTop />

      {/* Feature #8 — Command Palette (Ctrl+K) */}
      <CommandPalette />
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PostProvider>
          <NotificationProvider>
            <DMProvider>
              <AppContent />
            </DMProvider>
          </NotificationProvider>
        </PostProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
