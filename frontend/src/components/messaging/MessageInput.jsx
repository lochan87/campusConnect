import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSend, FiImage, FiX, FiSmile, FiCornerUpLeft, FiPaperclip } from 'react-icons/fi';
import { useDM } from '../../context/DMContext';

const TYPING_DEBOUNCE = 1500;

const EMOJI_GRID = [
  '😊','😂','😍','👍','❤️','🔥','🎉','😎',
  '🙏','🙌','💯','✨','👏','🥳','👀','💪',
  '🤔','🚀','⭐','💡','😭','❤️‍🔥','🥰','✌️',
  '😅','🤣','🥺','😤','🤩','😴','🫶','🫠',
];

const MessageInput = ({ conversationId, disabled, replyingTo, onCancelReply }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { sendMessage, emitTypingStart, emitTypingStop } = useDM();
  const fileInputRef   = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef    = useRef(false);
  const textareaRef    = useRef(null);
  const emojiPickerRef = useRef(null);

  /* ── Auto-resize textarea ─────────────────────────────────────────────── */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  /* ── Reset when conversation changes ─────────────────────────────────── */
  useEffect(() => {
    setText('');
    clearImage();
    setShowEmojiPicker(false);
    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
  }, [conversationId]);

  /* ── Close emoji picker on outside click ─────────────────────────────── */
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmojiPicker]);

  /* ── Typing indicator ────────────────────────────────────────────────── */
  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTypingStart(conversationId);
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      emitTypingStop(conversationId);
    }, TYPING_DEBOUNCE);
  }, [conversationId, emitTypingStart, emitTypingStop]);

  useEffect(() => {
    return () => {
      clearTimeout(typingTimerRef.current);
      if (isTypingRef.current) emitTypingStop(conversationId);
    };
  }, [conversationId, emitTypingStop]);

  /* ── Image helpers ───────────────────────────────────────────────────── */
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be smaller than 5 MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleAddEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    handleTyping();
    textareaRef.current?.focus();
  };

  /* ── Send ────────────────────────────────────────────────────────────── */
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !imageFile) return;
    if (isSending) return;

    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    emitTypingStop(conversationId);

    setIsSending(true);
    const textToSend    = trimmed;
    const fileToSend    = imageFile;
    const replyPayload  = replyingTo;

    setText('');
    clearImage();
    setShowEmojiPicker(false);
    if (onCancelReply) onCancelReply();

    try {
      await sendMessage(conversationId, textToSend, fileToSend, replyPayload);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* ── Drag & drop ─────────────────────────────────────────────────────── */
  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = ()  => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Only image files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024)    { alert('Image must be smaller than 5 MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const canSend = (text.trim().length > 0 || imageFile) && !isSending;

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-shrink-0 px-3 sm:px-5 pb-4 pt-2 relative z-20"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-indigo-500/10 border-2 border-dashed border-indigo-400 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm pointer-events-none z-30"
          >
            📎 Drop to attach image
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input card */}
      <div
        className={`rounded-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border transition-all duration-200 shadow-lg ${
          isFocused
            ? 'border-indigo-400/70 dark:border-indigo-500/60 shadow-indigo-100/50 dark:shadow-indigo-900/20 shadow-xl'
            : isDragging
            ? 'border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-800'
            : 'border-gray-200/90 dark:border-gray-700/80'
        }`}
      >
        {/* ── Emoji Picker Popover ─────────────────────────────────────── */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              ref={emojiPickerRef}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: 'spring', damping: 26, stiffness: 360 }}
              className="absolute bottom-full left-3 mb-3 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50"
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Emojis</span>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-8 gap-0.5 p-2.5 max-h-48 overflow-y-auto">
                {EMOJI_GRID.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { handleAddEmoji(emoji); }}
                    className="p-1.5 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl hover:scale-125 active:scale-95 transition-all text-center leading-none"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Reply preview ────────────────────────────────────────────── */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between mx-3 mt-3 bg-indigo-50 dark:bg-indigo-900/30 border-l-[3px] border-indigo-500 px-3 py-2 rounded-r-xl rounded-tl-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <FiCornerUpLeft className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      Replying to {replyingTo.senderName || 'Message'}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {replyingTo.text || (replyingTo.imageUrl ? '📷 Photo' : '')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onCancelReply}
                  className="ml-2 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Image attachment preview ──────────────────────────────────── */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mx-3 mt-3 flex items-end gap-3">
                <div className="relative group flex-shrink-0">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded-xl border-2 border-indigo-200 dark:border-indigo-700 shadow-md"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 pb-1">Photo ready to send</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main input row ────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 px-2 py-1.5">

          {/* Left action group: attach + emoji */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {/* Attach image */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              title="Attach photo"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 transition-all disabled:opacity-40"
            >
              <FiPaperclip className="w-[17px] h-[17px]" />
            </button>

            {/* Emoji picker */}
            <button
              onClick={() => setShowEmojiPicker((v) => !v)}
              disabled={disabled}
              title="Emoji"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 ${
                showEmojiPicker
                  ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400'
                  : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400'
              }`}
            >
              <FiSmile className="w-[17px] h-[17px]" />
            </button>
          </div>

          {/* Textarea */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => { setText(e.target.value); handleTyping(); }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type a message…"
              rows={1}
              disabled={disabled}
              className="w-full resize-none bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 max-h-[120px] overflow-y-auto py-2 px-1 leading-[1.5]"
            />
          </div>

          {/* Send button */}
          <div className="flex-shrink-0">
            <motion.button
              whileTap={canSend ? { scale: 0.88 } : {}}
              whileHover={canSend ? { scale: 1.06 } : {}}
              onClick={handleSend}
              disabled={!canSend}
              title="Send (Enter)"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                canSend
                  ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-400/30 hover:shadow-indigo-500/40 hover:shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700/60 text-gray-300 dark:text-gray-600 cursor-not-allowed'
              }`}
            >
              {isSending ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSend className={`w-[15px] h-[15px] ${canSend ? 'translate-x-[1px] -translate-y-[1px]' : ''} transition-transform`} />
              )}
            </motion.button>
          </div>
        </div>

        {/* ── Bottom hint bar ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-3 pb-2 pt-0">
          <p className="text-[10px] text-gray-300 dark:text-gray-600 select-none">
            Enter to send · Shift+Enter for newline
          </p>
          {text.length > 0 && (
            <p className={`text-[10px] font-medium tabular-nums ${text.length > 900 ? 'text-red-400' : 'text-gray-300 dark:text-gray-600'}`}>
              {text.length}/1000
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
