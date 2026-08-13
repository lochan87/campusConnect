import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  XMarkIcon,
  ExclamationTriangleIcon,
  FlagIcon
} from '@heroicons/react/24/outline';

const ReportEventModal = ({ event, isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    reason: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    { value: 'spam', label: 'Spam or misleading content' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'false_information', label: 'False information' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'hate_speech', label: 'Hate speech or discrimination' },
    { value: 'violence', label: 'Violence or threats' },
    { value: 'copyright', label: 'Copyright violation' },
    { value: 'unsafe_event', label: 'Unsafe or dangerous event' },
    { value: 'scam', label: 'Scam or fraudulent event' },
    { value: 'other', label: 'Other (please describe)' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    if (formData.reason === 'other' && !formData.description.trim()) {
      toast.error('Please provide a description when selecting "Other"');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to report an event');
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData = {
        reportedBy: user.uid || user.id,
        reason: formData.reason,
        description: formData.description.trim()
      };

      const response = await api.reportEvent(event.id, reportData);
      
      if (response.data.success) {
        toast.success('Event reported successfully. Thank you for helping keep our community safe.');
        onClose();
        // Reset form
        setFormData({ reason: '', description: '' });
      }
    } catch (error) {
      console.error('Error reporting event:', error);
      
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already reported')) {
        toast.error('You have already reported this event');
      } else {
        const errorMessage = error.response?.data?.error || 'Failed to report event. Please try again.';
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ reason: '', description: '' });
      onClose();
    }
  };

  if (!isOpen || !event) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-lg z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                <FlagIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report Event</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Help us keep the community safe</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Event Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Reporting: {event.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Please provide accurate information to help our moderation team review this event.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What's wrong with this event? <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {reportReasons.map((reason) => (
                  <label key={reason.value} className="flex items-center">
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={formData.reason === reason.value}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-red-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{reason.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional details {formData.reason === 'other' && <span className="text-red-500 dark:text-red-400">*</span>}
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Provide any additional context that might help us understand the issue..."
                maxLength={500}
              />
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                {formData.description.length}/500
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.reason}
                className="flex-1 bg-red-600 dark:bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Reporting...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FlagIcon className="h-4 w-4" />
                    Report Event
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default ReportEventModal;