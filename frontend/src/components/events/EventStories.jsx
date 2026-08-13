import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiX, FiCalendar, FiMapPin, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/**
 * Feature #19 — Story-Style Event Banners
 * A horizontal row of circular event chips. Clicking one opens a full-screen
 * overlay with the event details and an auto-cycling progress bar.
 */

// Gradient palette cycles through events
const GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
];

const formatEventDate = (date) => {
  if (!date) return '';
  try {
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return ''; }
};

const formatEventTime = (date) => {
  if (!date) return '';
  try {
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

// ── Story bubble ───────────────────────────────────────────────────────────
const StoryBubble = ({ event, index, isViewed, onClick }) => {
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const initial = (event.title || event.name || 'E').charAt(0).toUpperCase();

  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
      aria-label={`View event: ${event.title || event.name}`}
    >
      {/* Ring — unviewed = gradient, viewed = gray */}
      <div className={`p-0.5 rounded-full ${isViewed ? 'bg-gray-200 dark:bg-gray-600' : `bg-gradient-to-br ${gradient}`}`}>
        <div className="p-0.5 bg-white dark:bg-gray-900 rounded-full">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-white font-bold text-xl leading-none">{initial}</span>
          </div>
        </div>
      </div>
      {/* Label */}
      <span className="text-xs text-gray-600 dark:text-gray-400 text-center max-w-[64px] truncate leading-tight">
        {(event.title || event.name || '').split(' ').slice(0, 2).join(' ')}
      </span>
    </motion.button>
  );
};

// ── Full-screen overlay ────────────────────────────────────────────────────
const StoryOverlay = ({ events, startIndex, onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const AUTO_DURATION = 5000; // 5 s per story
  const intervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const event = events[currentIdx];
  const gradient = GRADIENTS[currentIdx % GRADIENTS.length];

  const goNext = useCallback(() => {
    if (currentIdx < events.length - 1) {
      setCurrentIdx(i => i + 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    } else {
      onClose();
    }
  }, [currentIdx, events.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx(i => i - 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    }
  }, [currentIdx]);

  // Auto-advance + progress bar
  useEffect(() => {
    setProgress(0);
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / AUTO_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) goNext();
    }, 50);
    return () => clearInterval(intervalRef.current);
  }, [currentIdx, goNext]);

  // Keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  return (
    <motion.div
      key="story-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        key={currentIdx}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 360 }}
        onClick={e => e.stopPropagation()}
        className={`relative w-full max-w-sm mx-4 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br ${gradient}`}
        style={{ minHeight: '520px' }}
      >
        {/* Progress bars — one per story */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
          {events.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                style={{ width: i < currentIdx ? '100%' : i === currentIdx ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-8 right-4 z-10 w-8 h-8 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <FiX className="w-4 h-4 text-white" />
        </button>

        {/* Content */}
        <div className="flex flex-col h-full p-6 pt-16 pb-8 min-h-[520px]">
          {/* Event letter avatar */}
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mb-5 mt-2">
            <span className="text-4xl font-black text-white">
              {(event.title || event.name || 'E').charAt(0).toUpperCase()}
            </span>
          </div>

          <span className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">Event</span>
          <h2 className="text-white text-2xl font-bold leading-tight mb-4">
            {event.title || event.name || 'Untitled Event'}
          </h2>

          {event.description && (
            <p className="text-white/80 text-sm leading-relaxed mb-5 line-clamp-3">
              {event.description}
            </p>
          )}

          <div className="space-y-2 mb-6">
            {(event.date || event.startDate || event.eventDate) && (
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <FiCalendar className="w-4 h-4 flex-shrink-0" />
                <span>{formatEventDate(event.date || event.startDate || event.eventDate)}</span>
              </div>
            )}
            {(event.date || event.startDate || event.eventDate) && (
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <FiClock className="w-4 h-4 flex-shrink-0" />
                <span>{formatEventTime(event.date || event.startDate || event.eventDate)}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <FiMapPin className="w-4 h-4 flex-shrink-0" />
                <span className="capitalize">{event.location.replace(/_/g, ' ')}</span>
              </div>
            )}
          </div>

          {/* RSVP / View button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { onClose(); navigate(`/event/${event.id}`); }}
            className="mt-auto w-full py-3 rounded-2xl bg-white font-bold text-sm transition-colors"
            style={{ color: 'inherit' }}
          >
            View Full Event →
          </motion.button>
        </div>

        {/* Tap-zone navigation — left/right halves */}
        <button
          className="absolute left-0 top-0 w-1/3 h-full z-10 opacity-0"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          aria-label="Previous story"
        />
        <button
          className="absolute right-0 top-0 w-1/3 h-full z-10 opacity-0"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          aria-label="Next story"
        />
      </motion.div>

      {/* Arrow buttons on desktop */}
      {currentIdx > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors"
          aria-label="Previous"
        >
          <FiChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}
      {currentIdx < events.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors"
          aria-label="Next"
        >
          <FiChevronRight className="w-5 h-5 text-white" />
        </button>
      )}
    </motion.div>
  );
};

// ── Main exported component ────────────────────────────────────────────────
const EventStories = ({ events = [] }) => {
  const [openIdx, setOpenIdx] = useState(null);
  const [viewedIds, setViewedIds] = useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem('viewedStories') || '[]')); }
    catch { return new Set(); }
  });

  if (events.length === 0) return null;

  const handleOpen = (idx) => {
    const id = events[idx]?.id;
    setOpenIdx(idx);
    if (id) {
      setViewedIds(prev => {
        const next = new Set(prev).add(id);
        try { sessionStorage.setItem('viewedStories', JSON.stringify([...next])); } catch {}
        return next;
      });
    }
  };

  const handleClose = () => setOpenIdx(null);

  return (
    <>
      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
        {/* "Add event" hint if no events */}
        {events.map((event, i) => (
          <StoryBubble
            key={event.id || i}
            event={event}
            index={i}
            isViewed={viewedIds.has(event.id)}
            onClick={() => handleOpen(i)}
          />
        ))}
      </div>

      <AnimatePresence>
        {openIdx !== null && (
          <StoryOverlay
            events={events}
            startIndex={openIdx}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default EventStories;
