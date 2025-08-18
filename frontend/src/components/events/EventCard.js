import React from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiClock, FiUser } from 'react-icons/fi';

const EventCard = ({ event }) => {
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
      {event.poster && (
        <div className="h-48 bg-gray-100 overflow-hidden">
          <img
            src={event.poster}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Event Content */}
      <div className="p-4">
        {/* Event Title */}
        <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
          {event.title}
        </h3>

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
    </motion.div>
  );
};

export default EventCard;
