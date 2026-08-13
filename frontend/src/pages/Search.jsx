import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import {
  FiSearch, FiFileText, FiBarChart2, FiCalendar,
  FiLoader, FiAlertCircle, FiClock, FiMapPin,
  FiThumbsUp, FiMessageSquare, FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

const highlightMatch = (text, query) => {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700/60 text-inherit rounded px-0.5">{part}</mark>
      : part
  );
};

const CATEGORY_LABELS = {
  lost_found: 'Lost & Found', food: 'Food', memes: 'Memes',
  announcements: 'Announcements', general: 'General', events: 'Events'
};

// ─── Result Cards ────────────────────────────────────────────────────────────

const PostResult = ({ item, query }) => (
  <Link to={`/posts/${item.id}`} className="block group">
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors rounded-lg">
      <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <FiFileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          {item.title && (
            <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {highlightMatch(item.title, query)}
            </p>
          )}
          {item.category && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
              {CATEGORY_LABELS[item.category] || item.category}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug line-clamp-2">
          {highlightMatch(item.content, query)}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          {item.userName && (
            <span className="flex items-center gap-1">
              <FiUser className="w-3 h-3" /> {item.userName}
            </span>
          )}
          {item.location && (
            <span className="flex items-center gap-1">
              <FiMapPin className="w-3 h-3" /> {item.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <FiThumbsUp className="w-3 h-3" /> {item.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <FiMessageSquare className="w-3 h-3" /> {item.commentCount}
          </span>
          <span className="flex items-center gap-1">
            <FiClock className="w-3 h-3" /> {formatDate(item.createdAt)}
          </span>
        </div>
      </div>
    </div>
  </Link>
);

const PollResult = ({ item, query }) => (
  <Link to={`/polls`} className="block group">
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors rounded-lg">
      <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <FiBarChart2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
            {highlightMatch(item.question, query)}
          </p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
            item.isActive
              ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}>
            {item.isActive ? 'Active' : 'Closed'}
          </span>
        </div>
        {item.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug line-clamp-1">
            {highlightMatch(item.description, query)}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <FiBarChart2 className="w-3 h-3" /> {item.totalVotes} votes
          </span>
          {item.expiresAt && (
            <span className="flex items-center gap-1">
              <FiClock className="w-3 h-3" /> Expires {formatDate(item.expiresAt)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <FiClock className="w-3 h-3" /> {formatDate(item.createdAt)}
          </span>
        </div>
      </div>
    </div>
  </Link>
);

const EventResult = ({ item, query }) => (
  <Link to={`/events/${item.id}`} className="block group">
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors rounded-lg">
      <div className="w-9 h-9 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <FiCalendar className="w-4 h-4 text-green-600 dark:text-green-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors mb-0.5">
          {highlightMatch(item.title, query)}
        </p>
        {item.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug line-clamp-1">
            {highlightMatch(item.description, query)}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          {item.eventDate && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
              <FiCalendar className="w-3 h-3" /> {formatDate(item.eventDate)}
            </span>
          )}
          {item.location && (
            <span className="flex items-center gap-1">
              <FiMapPin className="w-3 h-3" /> {item.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <FiThumbsUp className="w-3 h-3" /> {item.likeCount}
          </span>
        </div>
      </div>
    </div>
  </Link>
);

// ─── Tab definitions ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'all',    label: 'All',    icon: FiSearch },
  { id: 'posts',  label: 'Posts',  icon: FiFileText },
  { id: 'polls',  label: 'Polls',  icon: FiBarChart2 },
  { id: 'events', label: 'Events', icon: FiCalendar },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

const Search = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({ posts: [], polls: [], events: [] });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef(null);

  const doSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) return;
    if (!user?.campusId) { toast.error('Campus ID not found — please log in again.'); return; }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await apiService.search({
        q: query.trim(),
        campusId: user.campusId,
        types: 'posts,polls,events',
        limit: 15
      });

      if (response.data.success) {
        setResults(response.data.results);
        setTotal(response.data.total);
        setActiveQuery(query.trim());
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Search failed — please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user?.campusId]);

  // Run on mount if URL has a query
  useEffect(() => {
    if (initialQuery.trim().length >= 2) {
      doSearch(initialQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced re-search as user types (300ms)
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        setSearchParams({ q: val.trim() });
        doSearch(val);
      }, 300);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    if (inputValue.trim().length >= 2) {
      setSearchParams({ q: inputValue.trim() });
      doSearch(inputValue);
    } else if (inputValue.trim().length > 0) {
      toast.error('Please enter at least 2 characters to search.');
    }
  };

  // Tab counts
  const tabCounts = {
    all: total,
    posts: results.posts.length,
    polls: results.polls.length,
    events: results.events.length
  };

  // Items shown in the active tab
  const visiblePosts  = activeTab === 'all' || activeTab === 'posts'  ? results.posts  : [];
  const visiblePolls  = activeTab === 'all' || activeTab === 'polls'  ? results.polls  : [];
  const visibleEvents = activeTab === 'all' || activeTab === 'events' ? results.events : [];

  const hasResults = visiblePosts.length + visiblePolls.length + visibleEvents.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6"
    >
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Search posts, polls, and events on your campus
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            id="search-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Search campus posts, polls, events…"
            autoFocus
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              placeholder-gray-400 dark:placeholder-gray-500 text-base shadow-sm"
          />
          {loading && (
            <FiLoader className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
          )}
        </div>
      </form>

      {/* Results area */}
      <AnimatePresence mode="wait">
        {hasSearched && (
          <motion.div
            key={activeQuery + activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
          >
            {/* Result summary */}
            {activeQuery && !loading && (
              <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {total > 0
                    ? <><span className="font-semibold text-gray-900 dark:text-white">{total}</span> result{total !== 1 ? 's' : ''} for <span className="font-semibold text-blue-600 dark:text-blue-400">"{activeQuery}"</span></>
                    : <>No results for <span className="font-semibold">"{activeQuery}"</span></>
                  }
                </p>
              </div>
            )}

            {/* Tabs */}
            {total > 0 && (
              <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const count = tabCounts[tab.id];
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        isActive
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {count > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="flex items-center gap-3 px-4 py-6 text-red-500 dark:text-red-400">
                <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* No results */}
            {!loading && !error && hasSearched && !hasResults && (
              <div className="px-4 py-12 text-center">
                <FiSearch className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No results found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Try different keywords or check your spelling
                </p>
                <div className="flex gap-2 justify-center mt-4 flex-wrap">
                  <Link to="/create-post" className="text-sm text-blue-500 hover:underline">Create a post</Link>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <Link to="/create-poll" className="text-sm text-blue-500 hover:underline">Create a poll</Link>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <Link to="/create-event" className="text-sm text-blue-500 hover:underline">Create an event</Link>
                </div>
              </div>
            )}

            {/* Results list */}
            {!loading && !error && hasResults && (
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {/* Posts section */}
                {visiblePosts.length > 0 && (
                  <div>
                    {activeTab === 'all' && (
                      <div className="px-4 pt-3 pb-1">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Posts
                        </p>
                      </div>
                    )}
                    {visiblePosts.map(item => (
                      <PostResult key={item.id} item={item} query={activeQuery} />
                    ))}
                  </div>
                )}

                {/* Polls section */}
                {visiblePolls.length > 0 && (
                  <div>
                    {activeTab === 'all' && (
                      <div className="px-4 pt-3 pb-1">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Polls
                        </p>
                      </div>
                    )}
                    {visiblePolls.map(item => (
                      <PollResult key={item.id} item={item} query={activeQuery} />
                    ))}
                  </div>
                )}

                {/* Events section */}
                {visibleEvents.length > 0 && (
                  <div>
                    {activeTab === 'all' && (
                      <div className="px-4 pt-3 pb-1">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Events
                        </p>
                      </div>
                    )}
                    {visibleEvents.map(item => (
                      <EventResult key={item.id} item={item} query={activeQuery} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Initial empty state (before first search) */}
        {!hasSearched && !loading && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <FiSearch className="w-12 h-12 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
            <p className="text-gray-400 dark:text-gray-500">
              Type at least 2 characters to search
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Search;
