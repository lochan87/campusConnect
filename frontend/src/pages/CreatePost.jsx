import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import { apiService } from '../services/api';
import { 
  PencilIcon, 
  PhotoIcon, 
  MapPinIcon, 
  EyeSlashIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const CreatePost = () => {
  const { user, refreshUserData } = useAuth();
  const { refreshPosts } = usePosts();
  const navigate = useNavigate();

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

  // Category value/label pairs — values must match backend Joi schema exactly
  const categories = [
    { value: 'lost_found',     label: 'Lost & Found' },
    { value: 'food',           label: 'Food' },
    { value: 'memes',          label: 'Memes' },
    { value: 'announcements',  label: 'Announcements' },
    { value: 'general',        label: 'General' }
  ];

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
      // Validate file size (max 1MB)
      if (file.size > 1 * 1024 * 1024) {
        toast.error('Image size should be less than 1MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
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
      toast.error('You must be logged in to create a post');
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = new FormData();
      postData.append('title', formData.title.trim());
      postData.append('content', formData.content.trim());
      postData.append('category', formData.category); // value is already the correct backend key
      postData.append('location', formData.location.trim());
      postData.append('isAnonymous', formData.isAnonymous ? 'true' : 'false');
      postData.append('campusId', user?.campusId || 'demo-campus'); // Use user's campus ID
      
      // Add user data if not anonymous
      if (!formData.isAnonymous && user) {
        postData.append('userId', user.uid || user.id);
        postData.append('userName', user.displayName || user.name || user.email);
      } else if (user) {
        // For anonymous posts, still send userId for deletion rights
        postData.append('userId', user.uid || user.id);
      }
      
      if (formData.image) {
        postData.append('image', formData.image);
      }

      console.log('Submitting post data:', {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        location: formData.location,
        isAnonymous: formData.isAnonymous,
        isAnonymousString: formData.isAnonymous ? 'true' : 'false',
        hasImage: !!formData.image,
        userId: !formData.isAnonymous ? (user.uid || user.id) : null,
        userName: !formData.isAnonymous ? (user.displayName || user.name || user.email) : null
      });

      const response = await apiService.createPost(postData);
      
      console.log('Post creation response:', response);
      console.log('Response data:', response.data);
      console.log('Response data success:', response.data.success);
      
      if (response.data && response.data.success) {
        toast.success('Post created successfully!');
        
        // Refresh user data to get updated reputation and postCount
        if (refreshUserData) {
          await refreshUserData();
        }
        
        // Reset form
        setFormData({
          title: '',
          content: '',
          category: '',
          location: '',
          image: null,
          isAnonymous: false
        });
        setImagePreview(null);
        
        // Refresh posts
        if (refreshPosts) {
          await refreshPosts();
        }
        
        // Navigate back to home
        navigate('/');
      } else {
        const errorMessage = response.data?.message || response.data?.error || 'Failed to create post';
        console.error('Post creation failed:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      
      // More specific error handling
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred';
        toast.error(errorMessage);
        console.error('Server response error:', error.response.data);
      } else if (error.request) {
        toast.error('Network error. Please check your connection.');
        console.error('Network error:', error.request);
      } else {
        toast.error('Failed to create post. Please try again.');
        console.error('Error:', error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please Log In</h2>
          <p className="text-gray-600 dark:text-gray-300">You need to be logged in to create a post.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <PencilIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Post</h1>
        </div>

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
                className="w-full px-3 py-2 pr-16 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                className="w-full px-3 py-2 pr-16 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-700">
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
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors"
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
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
            />
            <label htmlFor="isAnonymous" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <EyeSlashIcon className="h-4 w-4 mr-1" />
              Post anonymously
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Create Post
                </div>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreatePost;
