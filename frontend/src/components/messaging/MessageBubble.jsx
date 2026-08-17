import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiTrash2, FiMoreVertical } from 'react-icons/fi';

const formatTime = (ts) => {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (ts) => {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return '';
  return d.toLocaleString();
};

/**
 * ReadStatus — shows ✓ (sent), ✓✓ (read by all).
 */
const ReadStatus = ({ message, isMine, participants }) => {
  if (!isMine) return null;
  const readByOthers = (message.readBy || []).filter((uid) => uid !== message.senderId);
  const isRead = readByOthers.length > 0;
  return (
    <span className={`flex items-center gap-0 ${isRead ? 'text-indigo-400' : 'text-gray-400'}`}>
      <FiCheck className="w-3 h-3" />
      {isRead && <FiCheck className="w-3 h-3 -ml-1.5" />}
    </span>
  );
};

/**
 * ImageLightbox — click to enlarge message image.
 */
const ImageLightbox = ({ src, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.img
      initial={{ scale: 0.85 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0.85 }}
      src={src}
      alt="Full size"
      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    />
  </motion.div>
);

const MessageBubble = ({ message, isMine, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const isPending = !!message._pending;

  const canUnsend = () => {
    if (!isMine) return false;
    const sent = message.createdAt?.toDate?.() || new Date(message.createdAt);
    return (Date.now() - sent.getTime()) / 1000 < 60;
  };

  return (
    <>
      <AnimatePresence>
        {lightbox && (
          <ImageLightbox src={message.imageUrl} onClose={() => setLightbox(false)} />
        )}
      </AnimatePresence>

      <motion.div
        layout
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`group flex items-end gap-2 mb-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Bubble */}
        <div className={`relative max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
          {/* Image message */}
          {message.imageUrl && (
            <button
              onClick={() => setLightbox(true)}
              className={`overflow-hidden rounded-2xl ${isMine ? 'rounded-br-sm' : 'rounded-bl-sm'} shadow-md`}
            >
              <img
                src={message.imageUrl}
                alt="Sent image"
                className="max-w-[220px] max-h-[220px] object-cover hover:opacity-90 transition-opacity"
              />
            </button>
          )}

          {/* Text bubble */}
          {message.text && (
            <div
              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                isMine
                  ? `rounded-br-sm ${isPending ? 'bg-indigo-300 dark:bg-indigo-700 text-white opacity-70' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`
                  : 'rounded-bl-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Timestamp + read status */}
          <div
            className={`flex items-center gap-1 mt-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${
              isMine ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <span
              className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap cursor-default"
              title={formatDate(message.createdAt)}
            >
              {formatTime(message.createdAt)}
            </span>
            <ReadStatus message={message} isMine={isMine} />
          </div>
        </div>

        {/* Context menu trigger (visible on group-hover) */}
        {isMine && (
          <div className="relative self-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiMoreVertical className="w-3.5 h-3.5" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  className="absolute bottom-full right-0 mb-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20 min-w-[140px]"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  <button
                    onClick={() => { onDelete(message.id, false); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    Delete for me
                  </button>
                  {canUnsend() && (
                    <button
                      onClick={() => { onDelete(message.id, true); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                      Unsend for everyone
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default MessageBubble;
