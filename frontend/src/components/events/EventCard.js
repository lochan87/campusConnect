import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiClock, FiUser, FiMoreHorizontal, FiEdit2, FiTrash2, FiFlag } from 'react-icons/fi';
import ReportEventModal from './ReportEventModal';

const EventCard = ({ event, currentUser, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [reportModal, setReportModal] = useState({ isOpen: false });
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
    >
      {/* Event Poster */}
      {(event.posterData || event.poster) && (
        <div className="h-48 bg-gray-100 overflow-hidden">
          <img
            src={event.posterData || event.poster}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Event Content */}
      <div className="p-4">
        {/* Event Header with Title and Menu */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1 mr-2">
            {event.title}
          </h3>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <FiMoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
            
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10"
              >
                <div className="py-1">
                  {currentUser && (currentUser.uid === event.userId || currentUser.id === event.userId) && (
                    <>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEdit && onEdit(event);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FiEdit2 className="w-4 h-4 mr-2" />
                        Edit Event
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete && onDelete(event.id);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <FiTrash2 className="w-4 h-4 mr-2" />
                        Delete Event
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setReportModal({ isOpen: true });
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiFlag className="w-4 h-4 mr-2" />
                    Report Event
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Event Description */}
        {event.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {event.description}
          </p>
        )}

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          {/* Date */}
          <div className="flex items-center text-sm text-gray-600">
            <FiCalendar className="w-4 h-4 mr-2 text-blue-500" />
            <span>{formatDate(event.date)}</span>
          </div>

          {/* Time */}
          <div className="flex items-center text-sm text-gray-600">
            <FiClock className="w-4 h-4 mr-2 text-green-500" />
            <span>
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center text-sm text-gray-600">
            <FiMapPin className="w-4 h-4 mr-2 text-red-500" />
            <span className="capitalize">{event.location.replace('_', ' ')}</span>
          </div>

          {/* Created By */}
          <div className="flex items-center text-sm text-gray-500">
            <FiUser className="w-4 h-4 mr-2" />
            <span>Created by {event.creator?.name || 'Anonymous'}</span>
          </div>
        </div>

        {/* Event Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {new Date(event.createdAt).toLocaleDateString()}
          </span>
          
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <FiCalendar className="w-3 h-3 mr-1" />
              Event
            </span>
          </div>
        </div>
      </div>

      {/* Report Event Modal */}
      <ReportEventModal
        event={event}
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false })}
      />
    </motion.div>
  );
};

export default EventCard;
