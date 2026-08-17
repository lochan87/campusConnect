import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSearch, FiUser, FiLoader } from 'react-icons/fi';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDM } from '../../context/DMContext';

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const UserSearchModal = ({ onClose, onConversationStarted }) => {
  const { user } = useAuth();
  const { startConversation } = useDM();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(null); // uid of user being contacted
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      setError('');
      return;
    }
    const search = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiService.searchDMUsers(debouncedQuery.trim(), user?.campusId);
        setResults(res.data.users || []);
        if (res.data.users.length === 0) setError('No users found on your campus');
      } catch (err) {
        setError('Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [debouncedQuery, user?.campusId]);

  const handleStart = async (recipientId) => {
    setStarting(recipientId);
    try {
      const conv = await startConversation(recipientId);
      onConversationStarted(conv.id);
      onClose();
    } finally {
      setStarting(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: -16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campus users…"
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 transition-colors"
            />
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              {error}
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              Type at least 2 characters to search
            </div>
          )}

          <AnimatePresence>
            {results.map((u, i) => (
              <motion.div
                key={u.uid}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {/* Avatar */}
                {u.avatar ? (
                  <img
                    src={u.avatar}
                    alt={u.username}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <FiUser className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {u.username}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {u.department || u.course || 'CampusConnect'}
                  </p>
                </div>

                {/* Message button */}
                <button
                  onClick={() => handleStart(u.uid)}
                  disabled={starting === u.uid}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {starting === u.uid ? '…' : 'Message'}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Only showing users from your campus
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserSearchModal;
