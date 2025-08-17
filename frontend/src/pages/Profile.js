import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PencilIcon, 
  UserIcon, 
  CalendarIcon, 
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { userId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: '',
    course: '',
    department: '',
    year: '',
    bio: ''
  });

  const departmentsByCourse = {
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

  // Get available departments based on selected course
  const getAvailableDepartments = () => {
    if (!editData.course) return [];
    return departmentsByCourse[editData.course] || [];
  };

  const currentUserId = userId || user?.uid;
  const isOwnProfile = user && currentUserId === user.uid;

  useEffect(() => {
    if (currentUserId) {
      fetchProfile();
    }
  }, [currentUserId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.getUserProfile(currentUserId);
      
      if (response.data.success) {
        console.log('📋 Full profile data received:', response.data.profile);
        console.log('🆔 Student ID in profile:', response.data.profile.studentId);
        console.log('🆔 Student ID type:', typeof response.data.profile.studentId);
        console.log('🆔 Student ID empty check:', !response.data.profile.studentId);
        setProfile(response.data.profile);
        setEditData({
          displayName: response.data.profile.displayName || '',
          course: response.data.profile.course || '',
          department: response.data.profile.department || '',
          year: response.data.profile.year || '',
          bio: response.data.profile.bio || ''
        });
        console.log('🆔 EditData studentId set to:', response.data.profile.studentId || '');
      } else {
        console.error('❌ Profile fetch failed:', response.data);
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      // More detailed error handling
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.error || 'Server error occurred';
        toast.error(`Failed to load profile: ${errorMessage}`);
      } else if (error.request) {
        // Request was made but no response received
        toast.error('Network error: Unable to connect to server');
      } else {
        // Something else happened
        toast.error('Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await apiService.updateUserProfile(currentUserId, editData);
      
      if (response.data.success) {
        toast.success('Profile updated successfully');
        setEditing(false);
        fetchProfile(); // Refresh profile data
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return 'Unknown';
    }
    
    try {
      // Handle different date formats
      let dateObj;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string' || typeof date === 'number') {
        dateObj = new Date(date);
      } else if (date.seconds) {
        // Firestore timestamp format
        dateObj = new Date(date.seconds * 1000);
      } else if (date.toDate && typeof date.toDate === 'function') {
        // Firestore timestamp with toDate method
        dateObj = date.toDate();
      } else {
        return 'Unknown';
      }
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Unknown';
      }
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('❌ Error formatting date:', error, 'Date value:', date);
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex space-x-4 mb-6">
              <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
          <p className="text-gray-600">The requested user profile could not be found.</p>
        </div>
      </div>
    );
  }

  // Filter out expired polls from recent polls
  const activeRecentPolls = profile.recentPolls ? profile.recentPolls.filter(poll => {
    if (!poll.expiresAt) return true; // No expiration date means active
    return new Date() <= new Date(poll.expiresAt);
  }) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-6"
    >
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          {isOwnProfile ? 'My Profile' : `${profile.displayName}'s Profile`}
        </motion.h1>
      </div>

      {/* Profile Info Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6"
      >
        {/* Profile Header */}
        <div className="space-y-4">
          {/* Mobile/Desktop Header with Edit Button */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            {/* Profile Info */}
            <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
              {/* Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {profile.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Basic Info */}
              <div className="flex-1 min-w-0">
                {editing ? (
                  <input
                    type="text"
                    value={editData.displayName}
                    onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                    className="text-xl sm:text-2xl font-bold text-gray-900 border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent w-full mb-1"
                    placeholder="Display Name"
                  />
                ) : (
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{profile.displayName}</h2>
                )}
                
                {profile.username && (
                  <p className="text-blue-600 font-medium text-sm sm:text-base break-words">@{profile.username}</p>
                )}
                
                <p className="text-gray-600 text-sm sm:text-base break-words">{profile.email}</p>
                
                {/* Student ID - Display only, no editing */}
                <p className="text-gray-600 text-sm sm:text-base mt-1">
                  Student ID: {profile.studentId || 'Not provided'}
                </p>
              </div>
            </div>
            
            {/* Edit Button - Responsive */}
            {isOwnProfile && !editing && (
              <div className="flex justify-center sm:justify-end">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md w-full sm:w-auto justify-center"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span className="font-medium">Edit Profile</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Academic Info */}
          <div className="border-t pt-4">
            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Course</label>
                    <select
                      value={editData.course}
                      onChange={(e) => setEditData({...editData, course: e.target.value, department: ''})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Course</option>
                      <option value="B.E (Bachelor of Engineering)">B.E (Bachelor of Engineering)</option>
                      <option value="M.Tech (Master of Technology)">M.Tech (Master of Technology)</option>
                      <option value="MBA (Master of Business Administration)">MBA (Master of Business Administration)</option>
                      <option value="BBA (Bachelor of Business Administration)">BBA (Bachelor of Business Administration)</option>
                      <option value="B.Com (Bachelor of Commerce)">B.Com (Bachelor of Commerce)</option>
                      <option value="M.Com (Master of Commerce)">M.Com (Master of Commerce)</option>
                      <option value="Ph.D (Doctor of Philosophy)">Ph.D (Doctor of Philosophy)</option>
                      <option value="BCA (Bachelor of Computer Applications)">BCA (Bachelor of Computer Applications)</option>
                      <option value="MCA (Master of Computer Applications)">MCA (Master of Computer Applications)</option>
                      <option value="Dental (Bachelor of Dental Surgery)">Dental (Bachelor of Dental Surgery)</option>
                      <option value="MBBS (Bachelor of Medicine and Bachelor of Surgery)">MBBS (Bachelor of Medicine and Bachelor of Surgery)</option>
                      <option value="B.Sc (Bachelor of Science)">B.Sc (Bachelor of Science)</option>
                      <option value="M.Sc (Master of Science)">M.Sc (Master of Science)</option>
                      <option value="BA (Bachelor of Arts)">BA (Bachelor of Arts)</option>
                      <option value="MA (Master of Arts)">MA (Master of Arts)</option>
                      <option value="LLB (Bachelor of Laws)">LLB (Bachelor of Laws)</option>
                      <option value="LLM (Master of Laws)">LLM (Master of Laws)</option>
                      <option value="B.Ed (Bachelor of Education)">B.Ed (Bachelor of Education)</option>
                      <option value="M.Ed (Master of Education)">M.Ed (Master of Education)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={editData.department}
                      onChange={(e) => setEditData({...editData, department: e.target.value})}
                      disabled={!editData.course}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        !editData.course ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    >
                      <option value="">
                        {editData.course ? 'Select Department' : 'Select course first'}
                      </option>
                      {getAvailableDepartments().map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                    <select
                      value={editData.year}
                      onChange={(e) => setEditData({...editData, year: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Post Graduate">Post Graduate</option>
                      <option value="Ph.D">Ph.D</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {profile.course && (
                  <span className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs sm:text-sm mb-4">
                    <AcademicCapIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {profile.course}
                  </span>
                )}
                {profile.department && (
                  <span className="flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs sm:text-sm mb-4">
                    <AcademicCapIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {profile.department}
                  </span>
                )}
                {profile.year && (
                  <span className="flex items-center bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs sm:text-sm mb-4">
                    <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {profile.year}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="border-t pt-4">
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Bio</h3>
              {editing ? (
                <>
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData({...editData, bio: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none mb-4"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                  
                  {/* Save/Cancel buttons for editing mode */}
                  {isOwnProfile && (
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                      <button
                        onClick={() => setEditing(false)}
                        className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center text-sm sm:text-base"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-600">
                  {profile.bio || 'No bio available.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <TrophyIcon className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.reputation || 0}</div>
            <div className="text-sm text-gray-600">Reputation</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <DocumentTextIcon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.stats?.totalPosts || 0}</div>
            <div className="text-sm text-gray-600">Posts</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.stats?.totalPolls || 0}</div>
            <div className="text-sm text-gray-600">Polls</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <FireIcon className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.stats?.recentActivity || 0}</div>
            <div className="text-sm text-gray-600">Recent Activity</div>
          </div>
        </div>
      </motion.div>

      {/* Recent Posts */}
      {profile.recentPosts.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Posts</h3>
          <div className="space-y-3">
            {profile.recentPosts.slice(0, 5).map((post, index) => (
              <div key={post.id} className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">{post.title}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>{formatDate(post.createdAt)}</span>
                  <span>{post.likes} likes</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Polls */}
      {activeRecentPolls.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Polls</h3>
          <div className="space-y-3">
            {activeRecentPolls.slice(0, 5).map((poll, index) => (
              <div key={poll.id} className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">{poll.question}</h4>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>{formatDate(poll.createdAt)}</span>
                  <span>{poll.totalVotes} votes</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Join Date */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center mt-6 text-sm text-gray-500"
      >
        Member since {formatDate(profile.joinedAt)}
      </motion.div>
    </motion.div>
  );
};

export default Profile;
