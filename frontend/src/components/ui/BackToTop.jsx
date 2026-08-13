import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socketService } from '../../services/socket';

/**
 * Feature #7 — Floating "Back to Top" + Unread Posts Indicator
 * Appears when scrolled > 300px. Counts new posts arriving via socket while scrolled.
 * Click scrolls to top and resets the counter.
 */
const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [newPostCount, setNewPostCount] = useState(0);
  // Use a ref to avoid stale closure inside the socket listener
  const isVisibleRef = useRef(false);

  // Listen to the main scroll container (id added in App.jsx)
  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (!container) return;

    const handleScroll = () => {
      const scrolled = container.scrollTop > 300;
      isVisibleRef.current = scrolled;
      setIsVisible(scrolled);
      // Reset badge once user scrolls back near top
      if (container.scrollTop < 50) {
        setNewPostCount(0);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Count new posts arriving from socket while user is scrolled down
  useEffect(() => {
    const handleNewPost = () => {
      if (isVisibleRef.current) {
        setNewPostCount(prev => prev + 1);
      }
    };
    socketService.on('post_created', handleNewPost);
    return () => socketService.off('post_created', handleNewPost);
  }, []);

  const handleClick = () => {
    const container = document.getElementById('main-scroll-container');
    container?.scrollTo({ top: 0, behavior: 'smooth' });
    setNewPostCount(0);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          key="back-to-top"
          initial={{ opacity: 0, y: 16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.85 }}
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.93 }}
          onClick={handleClick}
          aria-label="Back to top"
          className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg text-sm font-semibold select-none cursor-pointer"
        >
          <span aria-hidden="true">↑</span>
          {newPostCount > 0 ? (
            <motion.span
              key={newPostCount}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              {newPostCount} new post{newPostCount !== 1 ? 's' : ''}
            </motion.span>
          ) : (
            <span>Top</span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTop;
