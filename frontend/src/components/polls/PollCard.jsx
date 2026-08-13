import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiBarChart2, FiClock, FiUsers } from 'react-icons/fi';

const PollCard = ({ poll, onVote, hasVoted = false }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const {
    id,
    question,
    description,
    options,
    userName,
    expiresAt,
    totalVotes,
    isAnonymous
  } = poll;

  const handleVote = async (optionIndex) => {
    if (!hasVoted && !selectedOption && !isVoting) {
      setIsVoting(true);
      setSelectedOption(optionIndex);
      try {
        if (onVote) {
          await onVote(id, optionIndex);
        }
      } catch (error) {
        // Reset state if vote failed
        setSelectedOption(null);
        console.error('Vote failed:', error);
      } finally {
        setIsVoting(false);
      }
    }
  };

  const getPercentage = (votes) => {
    return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  };

  const isExpired = () => {
    return new Date() > new Date(expiresAt);
  };

  const timeRemaining = () => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d remaining`;
    if (diffHours > 0) return `${diffHours}h remaining`;
    return `${Math.floor(diffMs / (1000 * 60))}m remaining`;
  };

  const canVote = !hasVoted && !isExpired() && selectedOption === null && !isVoting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <FiBarChart2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {isAnonymous ? 'Anonymous' : userName || 'Unknown User'}
              </p>
              <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <FiClock className="w-3 h-3 mr-1" />
                  {timeRemaining()}
                </span>
                <div className="flex items-center text-purple-600 dark:text-purple-400">
                  <FiUsers className="w-3 h-3 mr-1" />
                  <span>{totalVotes || 0} votes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="px-4 pb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{question}</h3>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{description}</p>
        )}
      </div>

      {/* Options */}
      <div className="px-4 pb-4">
        <div className="space-y-3">
          {options?.map((option, index) => {
            const percentage = getPercentage(option.votes || 0);
            const isSelected = selectedOption === index;
            const showResults = hasVoted || isExpired() || selectedOption !== null;
            
            return (
              <div key={index} className="relative">
                <button
                  onClick={() => handleVote(index)}
                  disabled={!canVote}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    canVote
                      ? 'hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600 cursor-pointer hover:shadow-sm'
                      : 'cursor-default'
                  } ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-sm'
                      : showResults
                      ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                  } ${isVoting ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.text}
                    </span>
                    {showResults && (
                      <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {percentage}%
                      </span>
                    )}
                  </div>
                  
                  {showResults && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full"
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {option.votes || 0} vote{(option.votes || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        
        {canVote && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300 text-center font-medium">
              👆 Click an option to vote
            </p>
          </div>
        )}
        
        {isExpired() && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300 text-center font-medium">
              ⏰ This poll has expired
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PollCard;
