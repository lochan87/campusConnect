import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiMoreVertical, FiAlertCircle } from 'react-icons/fi';

/* ── helpers ──────────────────────────────────────────────────────────── */
const formatTime = (ts) => {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return isNaN(d) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/* ── WhatsApp-style ticks ─────────────────────────────────────────────── */
// States:
//   isPending  → ⏳ clock (sending…)
//   sent       → ✓  single grey  (confirmed by server, readBy has only sender)
//   delivered  → ✓✓ double grey  (recipient received; we don't track this separately, treat same as sent)
//   read       → ✓✓ double blue  (readBy includes recipient)

const Ticks = ({ isPending, isRead, isMine }) => {
  if (!isMine) return null;

  // Pending — small clock
  if (isPending) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" className="inline-block opacity-50" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }

  // Sent / read — double tick
  const color = isRead ? '#60a5fa' : 'currentColor';
  const opacity = isRead ? 1 : 0.55;

  return (
    <svg width="18" height="11" viewBox="0 0 18 11" className="inline-block flex-shrink-0">
      {/* back tick */}
      <path d="M1 5.5 L4.5 9 L10.5 1.5"
        stroke={color} strokeWidth="1.8" fill="none"
        strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
      {/* front tick (shifted right) */}
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
    className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.img
      initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
      src={src} alt="Full size"
      className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    />
    <button onClick={onClose}
      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl transition-colors">
      ✕
    </button>
  </motion.div>
);

/* ── Delete menu ──────────────────────────────────────────────────────── */
const DeleteMenu = ({ message, onDelete, onClose }) => {
  const canUnsend = () => {
    const sent = message.createdAt?.toDate?.() || new Date(message.createdAt);
    return (Date.now() - sent.getTime()) / 1000 < 60;
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 6 }}
      transition={{ type: 'spring', damping: 22, stiffness: 380 }}
      className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-40 w-48"
      onMouseLeave={onClose}
    >
      {canUnsend() && (
        <button
          onClick={() => { onDelete(message.id, true); onClose(); }}
          className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 font-medium border-b border-gray-100 dark:border-gray-700 transition-colors"
        >
          <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Unsend for everyone
        </button>
      )}
      <button
        onClick={() => { onDelete(message.id, false); onClose(); }}
        className="w-full text-left px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/60 flex items-center gap-2.5 transition-colors"
      >
        <FiTrash2 className="w-3.5 h-3.5 flex-shrink-0" />
        Delete for me
      </button>
    </motion.div>
  );
};

/* ── Main bubble ──────────────────────────────────────────────────────── */
const MessageBubble = ({ message, isMine, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const isPending = !!message._pending;
  const readByOthers = (message.readBy || []).filter((uid) => uid !== message.senderId);
  const isRead = readByOthers.length > 0;

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
        className={`group flex items-end gap-1.5 px-3 mb-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* ⋮ context menu button — only mine, shown on hover */}
        {isMine && (
          <div className="relative self-end mb-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiMoreVertical className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <DeleteMenu message={message} onDelete={onDelete} onClose={() => setShowMenu(false)} />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Bubble column */}
        <div className={`flex flex-col max-w-[68%] ${isMine ? 'items-end' : 'items-start'}`}>

          {/* Image */}
          {message.imageUrl && (
            <motion.button
              whileHover={{ opacity: 0.9 }}
              onClick={() => setLightbox(true)}
              className={`overflow-hidden rounded-2xl shadow-md mb-0.5 ${isMine ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
            >
              <img src={message.imageUrl} alt="Attachment"
                className="max-w-[220px] max-h-[220px] object-cover" />
            </motion.button>
          )}

          {/* Text bubble — timestamp + ticks INSIDE, WhatsApp style */}
          {message.text && (
            <div
              className={`
                relative rounded-2xl text-sm leading-relaxed select-text overflow-hidden
                ${isMine
                  ? `rounded-br-sm ${isPending
                      ? 'bg-indigo-300 dark:bg-indigo-700 text-white/80'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                    }`
                  : 'rounded-bl-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-md shadow-gray-200/70 dark:shadow-gray-900/40 border border-gray-100 dark:border-gray-600'
                }
              `}
            >
              {/*
                Layout trick (same as WhatsApp):
                - Text flows naturally
                - An invisible float-right spacer at the END of the text reserves
                  space so the last line never overlaps the timestamp row
                - Timestamp row sits at the bottom-right, inline with text flow
              */}
              <div className="px-3.5 pt-2 pb-1.5">
                <span className="break-words whitespace-pre-wrap">
                  {message.text}
                  {/* Invisible spacer — reserve room for timestamp + ticks */}
                  <span className="inline-block" style={{ width: isMine ? '72px' : '48px' }}>&nbsp;</span>
                </span>
              </div>

              {/* Timestamp + ticks row — absolute bottom-right inside bubble */}
              <div
                className={`absolute bottom-1.5 right-2.5 flex items-center gap-1 text-[10px] font-medium leading-none select-none pointer-events-none ${
                  isMine ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <span>{isPending ? '' : formatTime(message.createdAt)}</span>
                <Ticks isMine={isMine} isPending={isPending} isRead={isRead} />
              </div>
            </div>
          )}

          {/* Image-only: show timestamp below */}
          {message.imageUrl && !message.text && (
            <div className={`flex items-center gap-1 mt-0.5 px-1 text-[10px] text-gray-400 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
              <span>{formatTime(message.createdAt)}</span>
              <Ticks isMine={isMine} isPending={isPending} isRead={isRead} />
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default MessageBubble;
