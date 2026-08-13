import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { usePosts } from '../../context/PostContext';
import { 
  PencilIcon, 
  PhotoIcon, 
  MapPinIcon, 
  EyeSlashIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const EditPostModal = ({ post, isOpen, onClose }) => {
  const { user } = useAuth();
  const { editPost } = usePosts();

  // Location options
  const locationOptions = [
    { value: 'heritage_building', label: 'Heritage Building' },
    { value: 'auditorium', label: 'Auditorium' },
    { value: 'library', label: 'Library' },
    { value: 'parking', label: 'Parking' },
    { value: 'canteen', label: 'Canteen' },
    { value: 'conveno', label: 'Conveno' },
    { value: 'iem_block', label: 'IEM Block' },
    { value: 'grounds', label: 'Grounds' },
    { value: 'amphitheater', label: 'Amphitheater' },
    { value: 'bb_block', label: 'BB Block' },
    { value: 'rock_garden', label: 'Rock Garden' }
  ];
  
  const categories = [
    'Lost & Found', 
    'Food',
    'Memes',
    'Announcements',
    'General'
  ];

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    location: '',
    image: null,
    isAnonymous: false
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when post changes
  useEffect(() => {
    if (post && isOpen) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        category: post.category || '',
        location: post.location || '',
        image: null,
        isAnonymous: post.isAnonymous || false
      });
      
      // Set image preview if post has an image
      if (post.imageUrl || post.imageData) {
        setImagePreview(post.imageUrl || post.imageData);
      } else {
        setImagePreview(null);
      }
    }
  }, [post, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('Image must be smaller than 1MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, image: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to edit a post');
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = new FormData();
      postData.append('title', formData.title.trim());
      postData.append('content', formData.content.trim());
      postData.append('category', formData.category.toLowerCase().replace(' & ', '_').replace(' ', '_'));
      postData.append('location', formData.location.trim());
      postData.append('isAnonymous', formData.isAnonymous ? 'true' : 'false');
      
      if (formData.image) {
        postData.append('image', formData.image);
      }

      console.log('Updating post data:', {
        title: formData.title,
        content: formData.content,
        category: formData.category.toLowerCase().replace(' & ', '_').replace(' ', '_'),
        location: formData.location,
        isAnonymous: formData.isAnonymous,
        hasNewImage: !!formData.image
      });

      const result = await editPost(post.id, postData);
      
      if (result.success) {
        toast.success('Post updated successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Error updating post:', error);
      
      // More specific error handling
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred';
        toast.error(errorMessage);
        console.error('Server response error:', error.response.data);
      } else if (error.request) {
        toast.error('Network error. Please check your connection.');
        console.error('Network error:', error.request);
      } else {
        toast.error('Failed to update post. Please try again.');
        console.error('Error:', error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !post) return null;

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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-lg z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PencilIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Post</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-16 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter post title..."
                  maxLength={100}
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">
                  {formData.title.length}/100
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <div className="relative">
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 pr-16 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="What's on your mind?"
                  maxLength={2000}
                  required
                />
                <div className="absolute right-3 bottom-2 text-xs text-gray-400 dark:text-gray-500">
                  {formData.content.length}/2000
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPinIcon className="h-4 w-4 inline mr-1" />
                Location
              </label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a location</option>
                {locationOptions.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <PhotoIcon className="h-4 w-4 inline mr-1" />
                Image (optional)
              </label>
              
              {!imagePreview ? (
                <label htmlFor="image" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                    <PhotoIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">Click to upload an image</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 1MB</p>
                  </div>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 dark:bg-red-600 text-white rounded-full hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isAnonymous"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
              />
              <label htmlFor="isAnonymous" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <EyeSlashIcon className="h-4 w-4 mr-1" />
                Post anonymously
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
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
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 dark:bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <CheckIcon className="h-4 w-4" />
                    Update Post
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

export default EditPostModal;