import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { FiTrash2, FiX, FiAlertTriangle, FiCalendar, FiMapPin, FiClock } from 'react-icons/fi';

const DeleteEventModal = ({ event, isOpen, onClose, onConfirm, isDeleting }) => {
  if (!isOpen || !event) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const modalContent = (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black bg-opacity-50 dark:bg-opacity-70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Event</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <FiX className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Are you sure you want to delete this event? This action cannot be undone and will permanently remove:
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-400 dark:bg-red-500 rounded-full"></div>
                <span>The event details and description</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-400 dark:bg-red-500 rounded-full"></div>
                <span>All comments on this event</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-400 dark:bg-red-500 rounded-full"></div>
                <span>All likes and reactions</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-400 dark:bg-red-500 rounded-full"></div>
                <span>Any event poster images</span>
              </li>
            </ul>
          </div>

          {/* Event Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-red-400 dark:border-red-500">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 truncate">
              {event.title}
            </h4>
            
            {/* Event Details */}
            <div className="space-y-1 mb-2">
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300">
                <FiCalendar className="w-3 h-3" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300">
                <FiClock className="w-3 h-3" />
                <span>{formatTime(event.time || event.startTime)}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300">
                <FiMapPin className="w-3 h-3" />
                <span>{event.location}</span>
              </div>
            </div>
            
            {event.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                {event.description}
              </p>
            )}
            
            {(event.commentsCount > 0 || event.likesCount > 0) && (
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                {event.commentsCount > 0 && (
                  <span>{event.commentsCount} comment{event.commentsCount !== 1 ? 's' : ''}</span>
                )}
                {event.likesCount > 0 && (
                  <span>{event.likesCount} like{event.likesCount !== 1 ? 's' : ''}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <FiTrash2 className="w-4 h-4" />
                  <span>Delete Event</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
};

export default DeleteEventModal;