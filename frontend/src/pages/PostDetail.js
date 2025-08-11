import React from 'react';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiArrowLeft, FiShare, FiHeart, FiEye } from 'react-icons/fi';
import { useParams } from 'react-router-dom';

const PostDetail = () => {
  const { id } = useParams();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <button className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
            <FiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Post Details</h1>
            <p className="text-sm text-gray-600">View post and comments</p>
          </div>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiMessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Post Detail Feature</h3>
          <p className="text-gray-600 mb-4">
            This feature will show individual posts with comments, voting, and sharing options.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <FiMessageSquare className="w-4 h-4" />
              <span>Comments</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiHeart className="w-4 h-4" />
              <span>Voting System</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiShare className="w-4 h-4" />
              <span>Share Post</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiEye className="w-4 h-4" />
              <span>View Analytics</span>
            </div>
          </div>
          {id && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">Post ID: {id}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PostDetail;
