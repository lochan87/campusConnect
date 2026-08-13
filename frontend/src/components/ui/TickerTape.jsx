import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '../../context/PostContext';
import { FiTrendingUp } from 'react-icons/fi';

/**
 * Feature #17 — "Trending Now" Ticker Tape
 * A horizontally-scrolling marquee in the Navbar (desktop only) showing the top 5
 * trending posts sorted by likes. Automatically refreshes from context every 30 s.
 */
const TickerTape = () => {
  const { posts } = usePosts();
  const navigate = useNavigate();

  // Compute trending items derived from posts context — no side-effect needed
  const items = useMemo(() => {
    const trending = [...posts]
      .filter(p => (p.likes || 0) > 0 || (p.upvotes || 0) > 0)
      .sort((a, b) => (b.likes || b.upvotes || 0) - (a.likes || a.upvotes || 0))
      .slice(0, 5);
    // Fallback: if no liked posts, show 5 most recent
    return trending.length > 0 ? trending : posts.slice(0, 5);
  }, [posts]);

  if (items.length === 0) return null;

  // Duplicate items for seamless infinite loop
  const doubled = [...items, ...items];

  return (
    <div className="flex items-center gap-3 w-full overflow-hidden min-w-0">
      {/* Label */}
      <div className="flex items-center gap-1 flex-shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
        <FiTrendingUp className="w-3.5 h-3.5" />
        <span>Trending</span>
      </div>

      {/* Scrolling track */}
      <div className="flex-1 overflow-hidden relative">
        <motion.div
          className="flex items-center gap-6 whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            duration: items.length * 6,
            ease: 'linear',
            repeat: Infinity,
          }}
        >
          {doubled.map((post, i) => (
            <span
              key={`${post.id}-${i}`}
              className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors select-none"
              onClick={() => navigate(`/post/${post.id}`)}
            >
              <span className="text-red-500">❤</span>
              <span className="font-medium">
                {(post.title || post.content || '').substring(0, 40)}
                {(post.title || post.content || '').length > 40 ? '…' : ''}
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-400">{post.likes || post.upvotes || 0}</span>
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default TickerTape;
