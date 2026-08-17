import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiMoreVertical, FiAlertCircle, FiCornerUpLeft, FiCopy, FiSmile } from 'react-icons/fi';
import toast from 'react-hot-toast';

/* ── helpers ──────────────────────────────────────────────────────────── */
const formatTime = (ts) => {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return isNaN(d) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const QUICK_EMOJIS = ['❤️', '👍', '😂', '🔥', '😮', '😢'];

/* ── WhatsApp-style ticks ─────────────────────────────────────────────── */
const Ticks = ({ isPending, isRead, isMine }) => {
  if (!isMine) return null;

  if (isPending) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" className="inline-block opacity-50" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 16 14" />
      </svg>
    );
  }

  const color = isRead ? '#60a5fa' : 'currentColor';
  const opacity = isRead ? 1 : 0.55;

  return (
    <svg width="18" height="11" viewBox="0 0 18 11" className="inline-block flex-shrink-0">
      <path d="M1 5.5 L4.5 9 L10.5 1.5"
        stroke={color} strokeWidth="1.8" fill="none"
        strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
      <path d="M6 5.5 L9.5 9 L15.5 1.5"
        stroke={color} strokeWidth="1.8" fill="none"
        strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
    </svg>
  );
};

/* ── Lightbox ─────────────────────────────────────────────────────────── */
const Lightbox = ({ src, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.img
      initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
      src={src} alt="Full size attachment"
      className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    />
    <div className="absolute top-4 right-4 flex items-center gap-2">
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        download
        onClick={(e) => e.stopPropagation()}
        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-colors"
      >
        Download
      </a>
      <button
        onClick={onClose}
        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg flex items-center justify-center transition-colors"
      >
        ✕
      </button>
    </div>
  </motion.div>
);

/* ── Context & Action Menu ─────────────────────────────────────────────── */
const ContextMenu = ({ message, isMine, onDelete, onReply, onCopy, onReaction, onClose }) => {
  const canUnsend = () => {
    if (!isMine) return false;
    const sent = message.createdAt?.toDate?.() || new Date(message.createdAt);
    return (Date.now() - sent.getTime()) / 1000 < 60;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 6 }}
      transition={{ type: 'spring', damping: 22, stiffness: 380 }}
      className={`absolute bottom-full mb-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-40 w-48 ${
        isMine ? 'right-0' : 'left-0'
      }`}
      onMouseLeave={onClose}
    >
      {/* Quick Reactions toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { onReaction(emoji); onClose(); }}
            className="hover:scale-125 transition-transform text-base p-1"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Reply */}
      <button
        onClick={() => { onReply(message); onClose(); }}
        className="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 flex items-center gap-2.5 font-medium transition-colors"
      >
        <FiCornerUpLeft className="w-3.5 h-3.5 flex-shrink-0 text-indigo-500" />
        Reply to message
      </button>

      {/* Copy */}
      {message.text && (
        <button
          onClick={() => { onCopy(message.text); onClose(); }}
          className="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 flex items-center gap-2.5 font-medium transition-colors"
        >
          <FiCopy className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
          Copy text
        </button>
      )}

      {/* Delete / Unsend */}
      {isMine && canUnsend() && (
        <button
          onClick={() => { onDelete(message.id, true); onClose(); }}
          className="w-full text-left px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 font-medium border-t border-gray-100 dark:border-gray-700 transition-colors"
        >
          <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Unsend for everyone
        </button>
      )}

      <button
        onClick={() => { onDelete(message.id, false); onClose(); }}
        className="w-full text-left px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/60 flex items-center gap-2.5 border-t border-gray-100 dark:border-gray-700 transition-colors"
      >
        <FiTrash2 className="w-3.5 h-3.5 flex-shrink-0" />
        Delete for me
      </button>
    </motion.div>
  );
};

/* ── Main message bubble ───────────────────────────────────────────────── */
const MessageBubble = ({ message, isMine, onDelete, onReply, onReactionToggle, currentUserId }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [quickEmojiBar, setQuickEmojiBar] = useState(false);

  const isPending = !!message._pending;
  const readByOthers = (message.readBy || []).filter((uid) => uid !== message.senderId);
  const isRead = readByOthers.length > 0;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard', { duration: 1500 });
  };

  const handleReactionClick = (emoji) => {
    if (onReactionToggle) {
      onReactionToggle(message.id, emoji);
    }
  };

  const reactionsMap = message.reactions || {};
  const activeReactions = Object.entries(reactionsMap).filter(([_, uids]) => uids && uids.length > 0);

  return (
    <>
      <AnimatePresence>
        {lightbox && <Lightbox src={message.imageUrl} onClose={() => setLightbox(false)} />}
      </AnimatePresence>

      <motion.div
        layout
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className={`group flex items-end gap-1.5 px-3 mb-2.5 relative ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Context Action Button (appears on hover) */}
        <div className={`relative self-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 flex items-center gap-1 ${isMine ? 'mr-1' : 'ml-1'}`}>
          <button
            onClick={() => setQuickEmojiBar((v) => !v)}
            className="p-1 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="React"
          >
            <FiSmile className="w-4 h-4" />
          </button>
          <button
            onClick={() => onReply && onReply(message)}
            className="p-1 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Reply"
          >
            <FiCornerUpLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiMoreVertical className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {(showMenu || quickEmojiBar) && (
              <ContextMenu
                message={message}
                isMine={isMine}
                onDelete={onDelete}
                onReply={onReply || (() => {})}
                onCopy={handleCopy}
                onReaction={handleReactionClick}
                onClose={() => { setShowMenu(false); setQuickEmojiBar(false); }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Bubble column */}
        <div className={`flex flex-col max-w-[72%] sm:max-w-[65%] ${isMine ? 'items-end' : 'items-start'}`}>

          {/* Image */}
          {message.imageUrl && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLightbox(true)}
              className={`overflow-hidden rounded-2xl shadow-md mb-1 relative border border-gray-100 dark:border-gray-700 ${
                isMine ? 'rounded-br-sm' : 'rounded-bl-sm'
              }`}
            >
              <img src={message.imageUrl} alt="Attachment"
                className="max-w-[240px] sm:max-w-[280px] max-h-[260px] object-cover" />
            </motion.button>
          )}

          {/* Main Bubble */}
          {message.text && (
            <div
              className={`
                rounded-2xl text-sm leading-relaxed select-text transition-all w-fit max-w-full
                ${isMine
                  ? `rounded-br-sm ${isPending
                      ? 'bg-indigo-400 dark:bg-indigo-700 text-white/80'
                      : 'bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                    }`
                  : 'rounded-bl-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-xs border border-gray-200/80 dark:border-gray-700'
                }
              `}
            >
              {/* Quote / Replying to block */}
              {message.replyTo && (
                <div className={`mx-2.5 mt-2 p-2 rounded-xl text-xs flex items-center gap-2 border-l-4 ${
                  isMine
                    ? 'bg-white/15 border-white text-white/90'
                    : 'bg-indigo-50 dark:bg-gray-700/60 border-indigo-500 text-gray-700 dark:text-gray-300'
                }`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[11px] truncate">
                      {message.replyTo.senderName || 'Replied Message'}
                    </p>
                    <p className="truncate opacity-85 text-[11px]">
                      {message.replyTo.text || (message.replyTo.imageUrl ? '📷 Photo' : '')}
                    </p>
                  </div>
                </div>
              )}

              {/* Text content + Timestamp/ticks inline layout (tight fit without gap) */}
              <div className="px-3.5 pt-2 pb-1.5 flex flex-wrap items-end justify-end gap-x-2.5 gap-y-1">
                <span className="break-words whitespace-pre-wrap flex-1 min-w-[30px]">
                  {message.text}
                </span>

                {/* Timestamp + status ticks row sitting right beside text */}
                <div
                  className={`inline-flex items-center gap-1 text-[10px] font-medium leading-none select-none pointer-events-none self-end pb-0.5 ml-auto flex-shrink-0 ${
                    isMine ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <span>{isPending ? '' : formatTime(message.createdAt)}</span>
                  <Ticks isMine={isMine} isPending={isPending} isRead={isRead} />
                </div>
              </div>
            </div>
          )}

          {/* Image-only timestamp */}
          {message.imageUrl && !message.text && (
            <div className={`flex items-center gap-1 mt-0.5 px-1 text-[10px] text-gray-400 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
              <span>{formatTime(message.createdAt)}</span>
              <Ticks isMine={isMine} isPending={isPending} isRead={isRead} />
            </div>
          )}

          {/* Emoji Reactions Pills */}
          {activeReactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
              {activeReactions.map(([emoji, uids]) => {
                const hasReacted = uids.includes(currentUserId);
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReactionClick(emoji)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border shadow-xs transition-all ${
                      hasReacted
                        ? 'bg-indigo-100 dark:bg-indigo-900/60 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <span>{emoji}</span>
                    {uids.length > 1 && <span className="text-[10px] font-bold">{uids.length}</span>}
                  </button>
                );
              })}
            </div>
          )}

        </div>
      </motion.div>
    </>
  );
};

export default MessageBubble;
