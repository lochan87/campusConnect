import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSend, FiImage, FiX, FiSmile, FiCornerUpLeft } from 'react-icons/fi';
import { useDM } from '../../context/DMContext';

const TYPING_DEBOUNCE = 1500;

const QUICK_EMOJIS = ['❤️', '😂', '👍', '🔥', '😮', '✨', '🎉'];

const EMOJI_GRID = [
  '😊', '😂', '😍', '👍', '❤️', '🔥', '🎉', '😎',
  '🙏', '🙌', '💯', '✨', '👏', '🥳', '👀', '💪',
  '🤔', '🚀', '⭐', '💡', '😭', '❤️‍🔥', '🥰', '✌️',
  '😅', '🤣', '😭', '🥺', '😤', '🤩', '😴', '🫶',
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
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [text]);

  // Reset when conversation changes
  useEffect(() => {
    setText('');
    clearImage();
    setShowEmojiPicker(false);
    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
  }, [conversationId]);

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

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }
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

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !imageFile) return;
    if (isSending) return;

    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    emitTypingStop(conversationId);

    setIsSending(true);
    const textToSend = trimmed;
    const fileToSend = imageFile;
    const replyPayload = replyingTo;

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Only image files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be smaller than 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const canSend = (text.trim().length > 0 || imageFile) && !isSending;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-shrink-0 mx-3 sm:mx-6 mb-3.5 relative z-20 transition-all duration-200`}
    >
      {/* Drop overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-indigo-500/10 border-2 border-dashed border-indigo-400 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm pointer-events-none z-30"
          >
            📎 Drop image to attach
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main floating pill container */}
      <div className={`rounded-2xl bg-white dark:bg-gray-800 border transition-all duration-200 shadow-lg ${
        isFocused
          ? 'border-indigo-400/70 dark:border-indigo-500/60 shadow-indigo-100/60 dark:shadow-indigo-900/30 shadow-xl'
          : 'border-gray-200/90 dark:border-gray-700/80'
      } ${isDragging ? 'border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-800' : ''}`}>

        {/* Emoji Picker Popover */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="absolute bottom-full left-0 mb-2.5 p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 w-72"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Emoji</span>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-8 gap-1 max-h-44 overflow-y-auto pr-0.5">
                {EMOJI_GRID.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { handleAddEmoji(emoji); }}
                    className="p-1.5 text-base hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg hover:scale-110 active:scale-95 transition-all text-center leading-none"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reply Context Banner */}
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

        {/* Image attachment preview */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mx-3 mt-3 relative inline-flex">
                <div className="relative group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-20 w-20 object-cover rounded-xl border-2 border-indigo-200 dark:border-indigo-700 shadow-md"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </div>
                <div className="ml-3 flex items-end pb-1">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Photo ready to send</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Emoji Chip Strip */}
        <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-0">
          {QUICK_EMOJIS.map((emoji) => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => handleAddEmoji(emoji)}
              disabled={disabled}
              className="text-base leading-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-1 py-0.5 transition-colors disabled:opacity-40"
              title={`Add ${emoji}`}
            >
              {emoji}
            </motion.button>
          ))}
          <div className="flex-1" />
          {/* Emoji full picker trigger - tiny subtle link */}
          <button
            onClick={() => setShowEmojiPicker((v) => !v)}
            disabled={disabled}
            className={`text-xs font-medium px-2 py-0.5 rounded-full transition-all ${
              showEmojiPicker
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
            }`}
            title="More emojis"
          >
            More •••
          </button>
        </div>

        {/* Divider */}
        <div className="mx-3 mt-2 h-px bg-gray-100 dark:bg-gray-700/60" />

        {/* Input row */}
        <div className="flex items-end gap-2 px-2 py-2">
          {/* File input (hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Attachment button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 transition-all disabled:opacity-40"
            title="Attach photo"
          >
            <FiImage className="w-[18px] h-[18px]" />
          </button>

          {/* Emoji picker icon */}
          <button
            onClick={() => setShowEmojiPicker((v) => !v)}
            disabled={disabled}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 ${
              showEmojiPicker
                ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400'
                : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400'
            }`}
            title="Emoji picker"
          >
            <FiSmile className="w-[18px] h-[18px]" />
          </button>

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
              className="w-full resize-none bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 max-h-32 overflow-y-auto py-2 px-1 leading-[1.5]"
            />
          </div>

          {/* Send button */}
          <motion.button
            whileTap={canSend ? { scale: 0.88 } : {}}
            whileHover={canSend ? { scale: 1.05 } : {}}
            onClick={handleSend}
            disabled={!canSend}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
              canSend
                ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-400/25 hover:shadow-indigo-500/40 hover:shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700/60 text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
            title="Send message"
          >
            {isSending ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiSend className={`w-[16px] h-[16px] ${canSend ? 'translate-x-[1px] -translate-y-[1px]' : ''} transition-transform`} />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
