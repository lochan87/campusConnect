import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiImage, FiX } from 'react-icons/fi';
import { useDM } from '../../context/DMContext';

const TYPING_DEBOUNCE = 1500; // ms

const MessageInput = ({ conversationId, disabled }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
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
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

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
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !imageFile) return;
    if (isSending) return;

    // Stop typing indicator
    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    emitTypingStop(conversationId);

    setIsSending(true);
    const textToSend = trimmed;
    const fileToSend = imageFile;

    setText('');
    clearImage();

    try {
      await sendMessage(conversationId, textToSend, fileToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (text.trim().length > 0 || imageFile) && !isSending;

  return (
    <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      {/* Image preview strip */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 overflow-hidden"
          >
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Attachment preview"
                className="h-20 w-20 object-cover rounded-xl border border-gray-200 dark:border-gray-600"
              />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <FiX className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Image attach */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageSelect}
          className="hidden"
          id="dm-image-input"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-40"
          title="Attach image"
        >
          <FiImage className="w-5 h-5" />
        </button>

        {/* Text area */}
        <div className="flex-1 relative bg-gray-100 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={disabled}
            className="w-full resize-none bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none max-h-28 overflow-y-auto"
            style={{ lineHeight: '1.5' }}
          />
        </div>

        {/* Send button */}
        <motion.button
          whileHover={canSend ? { scale: 1.05 } : {}}
          whileTap={canSend ? { scale: 0.95 } : {}}
          onClick={handleSend}
          disabled={!canSend}
          className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            canSend
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600'
          }`}
          title="Send message"
        >
          <FiSend className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};

export default MessageInput;
