import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const SunIcon = () => (
  <motion.svg
    key="sun"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
    animate={{ opacity: 1, rotate: 0, scale: 1 }}
    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  >
    {/* Center circle */}
    <circle cx="12" cy="12" r="4" />
    {/* Rays */}
    <line x1="12" y1="2"  x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="2"  y1="12" x2="4"  y2="12" />
    <line x1="20" y1="12" x2="22" y2="12" />
    <line x1="4.22"  y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22" />
  </motion.svg>
);

const MoonIcon = () => (
  <motion.svg
    key="moon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
    animate={{ opacity: 1, rotate: 0, scale: 1 }}
    exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
  </motion.svg>
);

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {/* Icon container — fixed size so layout doesn't shift */}
      <span className="relative w-4 h-4 flex items-center justify-center flex-shrink-0">
        <AnimatePresence mode="wait" initial={false}>
          {isDarkMode ? <SunIcon /> : <MoonIcon />}
        </AnimatePresence>
      </span>
      <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
    </motion.button>
  );
};

export default ThemeToggle;