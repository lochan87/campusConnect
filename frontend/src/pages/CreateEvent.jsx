import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import useDraft from '../hooks/useDraft';
import { 
  CalendarIcon,
  MapPinIcon, 
  ClockIcon, 
  PhotoIcon,
  UserGroupIcon,
  InformationCircleIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const CreateEvent = () => {
  const { user, refreshUserData } = useAuth();
  const { refreshPosts, editEvent } = usePosts();
  const navigate = useNavigate();
  const { eventId } = useParams(); // For edit mode
  const isEditMode = !!eventId;
  
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

  // Event type options
  const eventTypeOptions = [
    { value: 'academic', label: 'Academic Event' },
    { value: 'social', label: 'Social Event' },
    { value: 'cultural', label: 'Cultural Event' },
    { value: 'professional', label: 'Professional Event' }
  ];

  // Role options
  const roleOptions = [
    { value: 'organizer', label: 'Event Organizer', points: 10 },
    { value: 'volunteer', label: 'Volunteer', points: 5 }
  ];

  // Target audience options
  const targetAudienceOptions = [
    { value: 'all_students', label: 'All Students' },
    { value: 'engineering_students', label: 'Engineering Students' },
    { value: 'computer_science', label: 'Computer Science Students' },
    { value: 'business_students', label: 'Business Students' },
    { value: 'arts_students', label: 'Arts Students' },
    { value: 'first_year', label: 'First Year Students' },
    { value: 'final_year', label: 'Final Year Students' },
    { value: 'postgraduate', label: 'Postgraduate Students' },
    { value: 'faculty_staff', label: 'Faculty & Staff' },
    { value: 'alumni', label: 'Alumni' },
    { value: 'everyone', label: 'Everyone (Students & Staff)' }
  ];

  // Department options based on stream (courses from register)
  const getDepartmentsByStream = (stream) => {
    const departmentsByStream = {
      'B.E (Bachelor of Engineering)': [
        'Artificial Intelligence and Machine Learning',
        'Computer Science & Engineering (Data Science)',
        'Information Science and Engineering',
        'Computer Science & Engineering (Internet of Things and Cyber Security including Block Chain Technology)',
        'Electronics and Instrumentation Engineering',
        'Computer Science and Design',
        'Mechanical Engineering',
        'Computer Science and Engineering',
        'Medical Electronics Engineering',
        'Computer Science and Business Systems',
        'Electronics and Telecommunication Engineering',
        'Computer Science & Engineering (Cyber Security)',
        'Robotics and Artificial Intelligence',
        'Aeronautical Engineering',
        'Chemical Engineering',
        'Automobile Engineering',
        'Civil Engineering',
        'Biotechnology',
        'Electrical & Electronics Engineering',
        'Electronics & Communication Engineering'
      ],
      'M.Tech (Master of Technology)': [
        'Artificial Intelligence and Machine Learning',
        'Computer Science & Engineering (Data Science)',
        'Information Science and Engineering',
        'Computer Science & Engineering (Internet of Things and Cyber Security including Block Chain Technology)',
        'Electronics and Instrumentation Engineering',
        'Computer Science and Design',
        'Mechanical Engineering',
        'Computer Science and Engineering',
        'Medical Electronics Engineering',
        'Computer Science and Business Systems',
        'Electronics and Telecommunication Engineering',
        'Computer Science & Engineering (Cyber Security)',
        'Robotics and Artificial Intelligence',
        'Aeronautical Engineering',
        'Chemical Engineering',
        'Automobile Engineering',
        'Civil Engineering',
        'Biotechnology',
        'Electrical & Electronics Engineering',
        'Electronics & Communication Engineering'
      ],
      'MBA (Master of Business Administration)': [
        'Finance',
        'Marketing',
        'Human Resources',
        'Operations Management',
        'International Business',
        'Business Analytics',
        'Entrepreneurship',
        'Supply Chain Management'
      ],
      'BBA (Bachelor of Business Administration)': [
        'Finance',
        'Marketing',
        'Human Resources',
        'Operations Management',
        'International Business',
        'Business Analytics',
        'Entrepreneurship',
        'Supply Chain Management'
      ],
      'B.Com (Bachelor of Commerce)': [
        'Accounting',
        'Banking & Finance',
        'Taxation',
        'Economics',
        'Business Mathematics',
        'Corporate Secretaryship'
      ],
      'M.Com (Master of Commerce)': [
        'Accounting',
        'Banking & Finance',
        'Taxation',
        'Economics',
        'Business Mathematics',
        'Corporate Secretaryship'
      ],
      'BCA (Bachelor of Computer Applications)': [
        'Software Development',
        'Database Management',
        'Web Technologies',
        'Mobile Application Development',
        'System Analysis and Design',
        'Network Administration'
      ],
      'MCA (Master of Computer Applications)': [
        'Software Development',
        'Database Management',
        'Web Technologies',
        'Mobile Application Development',
        'System Analysis and Design',
        'Network Administration'
      ],
      'MBBS (Bachelor of Medicine and Bachelor of Surgery)': [
        'General Medicine',
        'Surgery',
        'Pediatrics',
        'Cardiology',
        'Neurology',
        'Orthopedics',
        'Dermatology',
        'Radiology',
        'Anesthesiology',
        'Pathology'
      ],
      'Dental (Bachelor of Dental Surgery)': [
        'Oral & Maxillofacial Surgery',
        'Orthodontics',
        'Periodontics',
        'Endodontics',
        'Prosthodontics',
        'Oral Medicine'
      ],
      'B.Sc (Bachelor of Science)': [
        'Physics',
        'Chemistry',
        'Mathematics',
        'Biology',
        'Microbiology',
        'Biochemistry',
        'Zoology',
        'Botany',
        'Environmental Science',
        'Statistics'
      ],
      'M.Sc (Master of Science)': [
        'Physics',
        'Chemistry',
        'Mathematics',
        'Biology',
        'Microbiology',
        'Biochemistry',
        'Zoology',
        'Botany',
        'Environmental Science',
        'Statistics'
      ],
      'BA (Bachelor of Arts)': [
        'English Literature',
        'Hindi Literature',
        'History',
        'Political Science',
        'Sociology',
        'Philosophy',
        'Psychology',
        'Geography',
        'Journalism & Mass Communication',
        'Fine Arts',
        'Music',
        'Dance'
      ],
      'MA (Master of Arts)': [
        'English Literature',
        'Hindi Literature',
        'History',
        'Political Science',
        'Sociology',
        'Philosophy',
        'Psychology',
        'Geography',
        'Journalism & Mass Communication',
        'Fine Arts',
        'Music',
        'Dance'
      ],
      'LLB (Bachelor of Laws)': [
        'Constitutional Law',
        'Criminal Law',
        'Corporate Law',
        'International Law',
        'Civil Law',
        'Intellectual Property Law',
        'Environmental Law'
      ],
      'LLM (Master of Laws)': [
        'Constitutional Law',
        'Criminal Law',
        'Corporate Law',
        'International Law',
        'Civil Law',
        'Intellectual Property Law',
        'Environmental Law'
      ],
      'B.Ed (Bachelor of Education)': [
        'Primary Education',
        'Secondary Education',
        'Special Education',
        'Educational Psychology',
        'Curriculum Development',
        'Educational Technology',
        'Physical Education'
      ],
      'M.Ed (Master of Education)': [
        'Primary Education',
        'Secondary Education',
        'Special Education',
        'Educational Psychology',
        'Curriculum Development',
        'Educational Technology',
        'Physical Education'
      ],
      'Ph.D (Doctor of Philosophy)': [
        'Engineering & Technology',
        'Business & Management',
        'Commerce & Economics',
        'Computer Applications',
        'Medical Sciences',
        'Basic Sciences',
        'Arts & Humanities',
        'Law',
        'Education'
      ]
    };
    
    return departmentsByStream[stream] || [];
  };

  // Stream options (courses from register)
  const streamOptions = [
    { value: 'B.E (Bachelor of Engineering)', label: 'B.E (Bachelor of Engineering)' },
    { value: 'M.Tech (Master of Technology)', label: 'M.Tech (Master of Technology)' },
    { value: 'MBA (Master of Business Administration)', label: 'MBA (Master of Business Administration)' },
    { value: 'BBA (Bachelor of Business Administration)', label: 'BBA (Bachelor of Business Administration)' },
    { value: 'B.Com (Bachelor of Commerce)', label: 'B.Com (Bachelor of Commerce)' },
    { value: 'M.Com (Master of Commerce)', label: 'M.Com (Master of Commerce)' },
    { value: 'Ph.D (Doctor of Philosophy)', label: 'Ph.D (Doctor of Philosophy)' },
    { value: 'BCA (Bachelor of Computer Applications)', label: 'BCA (Bachelor of Computer Applications)' },
    { value: 'MCA (Master of Computer Applications)', label: 'MCA (Master of Computer Applications)' },
    { value: 'Dental (Bachelor of Dental Surgery)', label: 'Dental (Bachelor of Dental Surgery)' },
    { value: 'MBBS (Bachelor of Medicine and Bachelor of Surgery)', label: 'MBBS (Bachelor of Medicine and Bachelor of Surgery)' },
    { value: 'B.Sc (Bachelor of Science)', label: 'B.Sc (Bachelor of Science)' },
    { value: 'M.Sc (Master of Science)', label: 'M.Sc (Master of Science)' },
    { value: 'BA (Bachelor of Arts)', label: 'BA (Bachelor of Arts)' },
    { value: 'MA (Master of Arts)', label: 'MA (Master of Arts)' },
    { value: 'LLB (Bachelor of Laws)', label: 'LLB (Bachelor of Laws)' },
    { value: 'LLM (Master of Laws)', label: 'LLM (Master of Laws)' },
    { value: 'B.Ed (Bachelor of Education)', label: 'B.Ed (Bachelor of Education)' },
    { value: 'M.Ed (Master of Education)', label: 'M.Ed (Master of Education)' }
  ];
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    eventType: '',
    targetAudience: '',
    userRole: '',
    hostingDepartment: '',
    stream: ''
  });
  
  const [poster, setPoster] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);

  // Feature #20 — Draft auto-save (create mode only, not edit)
  const { hasDraft, draftAge, resumeDraft, discardDraft } = useDraft(
    'draft_event',
    formData,
    setFormData
  );

  useEffect(() => {
    if (!isEditMode && hasDraft) {
      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span className="text-sm">📅 Resume event draft from {draftAge < 1 ? 'just now' : `${draftAge}m ago`}?</span>
            <button onClick={() => { resumeDraft(); toast.dismiss(t.id); }}
              className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg font-semibold hover:bg-indigo-700">Resume</button>
            <button onClick={() => { discardDraft(); toast.dismiss(t.id); }}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg font-semibold hover:bg-gray-300">Discard</button>
          </div>
        ),
        { duration: 8000, id: 'draft-event' }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load event data in edit mode
  useEffect(() => {
    const loadEventData = async () => {
      if (isEditMode && eventId) {
        setLoadingEvent(true);
        try {
          const response = await apiService.getEvent(eventId);
          const event = response.data.event;
          
          // Populate form data
          setFormData({
            title: event.title || '',
            description: event.description || '',
            location: event.location || '',
            startDate: event.date || '',
            endDate: event.endDate || event.date || '', // Use date if endDate doesn't exist
            startTime: event.startTime || '',
            endTime: event.endTime || '',
            eventType: event.eventType || '',
            targetAudience: event.targetAudience || '',
            userRole: event.userRole || '',
            hostingDepartment: event.hostingDepartment || '',
            stream: event.stream || ''
          });
          
          // Set poster preview if exists
          if (event.posterData || event.poster) {
            setPosterPreview(event.posterData || event.poster);
          }
        } catch (error) {
          console.error('Error loading event:', error);
          toast.error('Failed to load event data');
          navigate('/home');
        } finally {
          setLoadingEvent(false);
        }
      }
    };

    loadEventData();
  }, [isEditMode, eventId, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // Reset department when stream changes
      ...(name === 'stream' && { hostingDepartment: '' })
    }));
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setPoster(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPosterPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePoster = () => {
    setPoster(null);
    setPosterPreview(null);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Event title is required');
      return false;
    }
    
    if (!formData.location.trim()) {
      toast.error('Event location is required');
      return false;
    }
    
    if (!formData.startDate) {
      toast.error('Start date is required');
      return false;
    }
    
    if (!formData.startTime) {
      toast.error('Start time is required');
      return false;
    }

    // Since backend requires endTime, we need to ensure it's provided
    if (!formData.endTime) {
      toast.error('End time is required');
      return false;
    }

    if (!formData.eventType) {
      toast.error('Event type is required');
      return false;
    }

    if (!formData.targetAudience.trim()) {
      toast.error('Target audience is required');
      return false;
    }

    if (!formData.userRole) {
      toast.error('Please select your role in this event');
      return false;
    }

    if (!formData.hostingDepartment) {
      toast.error('Please select the hosting department');
      return false;
    }

    if (!formData.stream) {
      toast.error('Please select the stream');
      return false;
    }

    if (!poster) {
      toast.error('Event poster is required');
      return false;
    }

    // Validate end date/time if provided
    if (formData.endDate && formData.startDate) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime || '23:59'}`);
      
      if (endDateTime <= startDateTime) {
        toast.error('End date/time must be after start date/time');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const eventData = new FormData();
      eventData.append('title', formData.title);
      eventData.append('description', formData.description);
      eventData.append('location', formData.location);
      eventData.append('date', formData.startDate); // Backend expects 'date', not 'startDate'
      eventData.append('startTime', formData.startTime);
      eventData.append('endTime', formData.endTime || '23:59');
      eventData.append('eventType', formData.eventType);
      eventData.append('targetAudience', formData.targetAudience);
      eventData.append('userRole', formData.userRole);
      eventData.append('hostingDepartment', formData.hostingDepartment);
      eventData.append('stream', formData.stream);
      eventData.append('campusId', user?.campusId || 'demo-campus'); // Add missing campusId
      eventData.append('userId', user?.uid || user?.id);
      eventData.append('isAnonymous', 'false'); // Events are typically not anonymous
      
      // Only append poster if one is selected
      if (poster) {
        eventData.append('poster', poster);
      }

      let response;
      if (isEditMode) {
        response = await editEvent(eventId, eventData);
        toast.success('Event updated successfully!');
      } else {
        response = await apiService.createEvent(eventData);
        if (response.data.success) {
          toast.success('Event created successfully!');
          discardDraft(); // Feature #20 — clear draft on success
          
          // Refresh user data to get updated reputation and postCount
          if (refreshUserData) {
            await refreshUserData();
          }
        } else {
          toast.error(response.data.error || 'Failed to create event');
          return;
        }
      }
      
      refreshPosts();
      navigate('/');
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} event:`, error);
      toast.error(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} event`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Event' : 'Create New Event'}
          </h1>
        </div>

        {loadingEvent ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading event data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="What's the event about?"
                className="w-full px-3 py-2 pr-16 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                maxLength={100}
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">
                {formData.title.length}/100
              </div>
            </div>
          </div>

          {/* Event Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <InformationCircleIcon className="h-4 w-4 inline mr-1" />
              Description
            </label>
            <div className="relative">
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide more details about the event..."
                rows={3}
                className="w-full px-3 py-2 pr-16 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                maxLength={500}
              />
              <div className="absolute right-3 bottom-2 text-xs text-gray-400 dark:text-gray-500">
                {formData.description.length}/500
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPinIcon className="h-4 w-4 inline mr-1" />
              Location <span className="text-red-500">*</span>
            </label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select a location</option>
              {locationOptions.map((location) => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                End Date (Optional)
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Event Type */}
          <div>
            <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <UserGroupIcon className="h-4 w-4 inline mr-1" />
              Event Type <span className="text-red-500">*</span>
            </label>
            <select
              id="eventType"
              name="eventType"
              value={formData.eventType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select event type</option>
              {eventTypeOptions.map((eventType) => (
                <option key={eventType.value} value={eventType.value}>
                  {eventType.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Audience */}
          <div>
            <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <UserGroupIcon className="h-4 w-4 inline mr-1" />
              Target Audience <span className="text-red-500">*</span>
            </label>
            <select
              id="targetAudience"
              name="targetAudience"
              value={formData.targetAudience}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select target audience</option>
              {targetAudienceOptions.map((audience) => (
                <option key={audience.value} value={audience.value}>
                  {audience.label}
                </option>
              ))}
            </select>
          </div>

          {/* Hosting Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <UserGroupIcon className="h-4 w-4 inline mr-1" />
              Hosting Information <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="stream" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Stream
                </label>
                <select
                  id="stream"
                  name="stream"
                  value={formData.stream}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select stream</option>
                  {streamOptions.map((stream) => (
                    <option key={stream.value} value={stream.value}>
                      {stream.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="hostingDepartment" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Department
                </label>
                <select
                  id="hostingDepartment"
                  name="hostingDepartment"
                  value={formData.hostingDepartment}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={!formData.stream}
                >
                  <option value="">
                    {formData.stream ? 'Select department' : 'Select stream first'}
                  </option>
                  {getDepartmentsByStream(formData.stream).map((department, index) => (
                    <option key={index} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* User Role */}
          <div>
            <label htmlFor="userRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <UserGroupIcon className="h-4 w-4 inline mr-1" />
              Your Role in this Event <span className="text-red-500">*</span>
            </label>
            <select
              id="userRole"
              name="userRole"
              value={formData.userRole}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select your role</option>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label} (+{role.points} reputation points)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Earn reputation points for your contribution to campus events
            </p>
          </div>

          {/* Event Poster */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <PhotoIcon className="h-4 w-4 inline mr-1" />
              Event Poster <span className="text-red-500">*</span>
            </label>
            
            {!posterPreview ? (
              <label htmlFor="poster" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-white dark:bg-gray-700">
                  <PhotoIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload event poster</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                </div>
                <input
                  type="file"
                  id="poster"
                  name="poster"
                  onChange={handlePosterChange}
                  accept="image/*"
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={posterPreview}
                  alt="Event poster preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removePoster}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  {isEditMode ? 'Update Event' : 'Create Event'}
                </div>
              )}
            </button>
          </div>
        </form>
      )}
      </motion.div>
    </div>
  );
};

export default CreateEvent;
