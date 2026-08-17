import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSend, FiImage, FiX, FiSmile, FiCornerUpLeft } from 'react-icons/fi';
import { useDM } from '../../context/DMContext';

const TYPING_DEBOUNCE = 1500;

const EMOJI_GRID = [
  '😊', '😂', '😍', '👍', '❤️', '🔥', '🎉', '😎',
  '🙏', '🙌', '💯', '✨', '👏', '🥳', '👀', '💪',
  '🤔', '🚀', '⭐', '💡', '😭', '❤️‍🔥', '🥰', '✌️'
];

const MessageInput = ({ conversationId, disabled, replyingTo, onCancelReply }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
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

  const canSend = (text.trim().length > 0 || imageFile) && !isSending;

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-shrink-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-700/80 px-3.5 py-3 relative z-20 transition-all ${
        isDragging ? 'ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : ''
      }`}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-xs flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs pointer-events-none rounded-t-xl z-30">
          Drop photo to attach ✨
        </div>
      )}

      {/* Emoji Picker Popover */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="absolute bottom-full left-4 mb-3 p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 w-64"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Quick Emojis</span>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1.5 max-h-44 overflow-y-auto p-1">
              {EMOJI_GRID.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleAddEmoji(emoji)}
                  className="p-1.5 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl hover:scale-125 transition-transform text-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replying Context Banner */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2.5 overflow-hidden"
          >
            <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-500 px-3 py-2 rounded-r-xl">
              <div className="flex items-center gap-2 min-w-0">
                <FiCornerUpLeft className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Replying to {replyingTo.senderName || 'Message'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                    {replyingTo.text || (replyingTo.imageUrl ? '📷 Photo' : '')}
                  </p>
                </div>
              </div>
              <button
                onClick={onCancelReply}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <FiX className="w-4 h-4" />
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
            className="mb-2.5 overflow-hidden"
          >
            <div className="relative inline-block group">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-xl border-2 border-indigo-300 dark:border-indigo-600 shadow-md"
              />
              <button
                onClick={clearImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
              >
                <FiX className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input controls row */}
      <div className="flex items-end gap-2">
        {/* Image attach button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 transition-all disabled:opacity-40"
          title="Attach photo"
        >
          <FiImage className="w-5 h-5" />
        </button>

        {/* Emoji picker trigger button */}
        <button
          onClick={() => setShowEmojiPicker((v) => !v)}
          disabled={disabled}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 transition-all disabled:opacity-40"
          title="Emoji picker"
        >
          <FiSmile className="w-5 h-5" />
        </button>

        {/* Textarea container */}
        <div className="flex-1 relative flex flex-col">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            disabled={disabled}
            className="w-full resize-none bg-gray-100 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 focus:border-indigo-400 dark:focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none max-h-32 overflow-y-auto transition-all"
            style={{ lineHeight: '1.5' }}
          />
        </div>

        {/* Send button */}
        <motion.button
          whileTap={canSend ? { scale: 0.9 } : {}}
          onClick={handleSend}
          disabled={!canSend}
          className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
            canSend
              ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-400/30 hover:shadow-lg hover:shadow-indigo-500/40'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }`}
          title="Send message"
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FiSend className="w-4 h-4" />
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default MessageInput;

