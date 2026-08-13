import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '../../context/PostContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FiSearch, FiHome, FiPlus, FiBarChart2, FiCalendar,
  FiTrendingUp, FiUser, FiSettings, FiFileText, FiSun
} from 'react-icons/fi';

/**
 * Feature #8 — Command Palette (Ctrl+K)
 * Spotlight-style modal with fuzzy search across pages, actions, and recent posts.
 * Keyboard navigation: ↑↓ to move, Enter to open, Escape to close.
 */

const STATIC_ITEMS = [
  { id: 'home',         label: 'Home',           icon: FiHome,       action: 'navigate', to: '/',             category: 'Pages' },
  { id: 'profile',      label: 'Profile',         icon: FiUser,       action: 'navigate', to: '/profile',      category: 'Pages' },
  { id: 'leaderboard',  label: 'Leaderboard',     icon: FiTrendingUp, action: 'navigate', to: '/leaderboard',  category: 'Pages' },
  { id: 'settings',     label: 'Settings',        icon: FiSettings,   action: 'navigate', to: '/settings',     category: 'Pages' },
  { id: 'create-post',  label: 'Create Post',     icon: FiPlus,       action: 'navigate', to: '/create-post',  category: 'Actions' },
  { id: 'create-poll',  label: 'Create Poll',     icon: FiBarChart2,  action: 'navigate', to: '/create-poll',  category: 'Actions' },
  { id: 'create-event', label: 'Create Event',    icon: FiCalendar,   action: 'navigate', to: '/create-event', category: 'Actions' },
  { id: 'toggle-theme', label: 'Toggle Dark Mode',icon: FiSun,        action: 'theme',                         category: 'Actions' },
];

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const { posts } = usePosts();
  const { toggleTheme } = useTheme();

  // Build full item list with recent posts appended
  const allItems = [
    ...STATIC_ITEMS,
    ...posts.slice(0, 5).map(post => ({
      id: `post-${post.id}`,
      label: post.title || post.content?.substring(0, 60) || 'Untitled post',
      icon: FiFileText,
      action: 'navigate',
      to: `/post/${post.id}`,
      category: 'Recent Posts',
    })),
  ];

  // Fuzzy filter — simple includes check (case-insensitive)
  const filtered = query.trim()
    ? allItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  // Group by category for visual sections
  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const flatFiltered = Object.values(grouped).flat();

  // Reset selection when query changes
  useEffect(() => { setSelectedIndex(0); }, [query]);

  // Global Ctrl+K listener
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => {
          if (!prev) setQuery('');
          return !prev;
        });
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-selected="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const executeItem = useCallback((item) => {
    setIsOpen(false);
    setQuery('');
    if (item.action === 'navigate') navigate(item.to);
    else if (item.action === 'theme') toggleTheme();
  }, [navigate, toggleTheme]);

  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatFiltered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && flatFiltered[selectedIndex]) {
      executeItem(flatFiltered[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="command-palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh] px-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Panel */}
          <motion.div
            key="command-palette-panel"
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 420 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Search row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-200 dark:border-gray-700">
              <FiSearch className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search pages, actions, posts…"
                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 text-base"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                esc
              </kbd>
            </div>

            {/* Results list */}
            <div ref={listRef} className="max-h-96 overflow-y-auto py-1.5">
              {flatFiltered.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-gray-400">
                  No results for &ldquo;{query}&rdquo;
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {category}
                    </div>
                    {items.map(item => {
                      const globalIdx = flatFiltered.indexOf(item);
                      const isSelected = globalIdx === selectedIndex;
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={item.id}
                          data-selected={isSelected}
                          onClick={() => executeItem(item)}
                          whileHover={{ x: 3 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm flex-1 truncate">{item.label}</span>
                          {isSelected && (
                            <kbd className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                              ↵
                            </kbd>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
              <span><kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">↵</kbd> open</span>
              <span><kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">esc</kbd> close</span>
              <span className="ml-auto opacity-60">Ctrl+K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
