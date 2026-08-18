import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FiEye, 
  FiEyeOff, 
  FiMail, 
  FiLock, 
  FiUser, 
  FiLoader,
  FiBook,
  FiMapPin,
  FiCheck,
  FiCopy,
  FiSliders,
  FiInfo,
  FiSearch,
  FiLayers,
  FiArrowRight,
  FiHelpCircle,
  FiCheckCircle,
  FiX
} from 'react-icons/fi';
import { BsSunFill, BsMoonStarsFill } from 'react-icons/bs';
import toast from 'react-hot-toast';
import StudentIdModal from '../components/ui/StudentIdModal';

const Register = () => {
  const { register, loading, error } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    course: '',
    department: '',
    year: '',
    bio: '',
    campusId: '' // Will be dynamically set based on studentId
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [showStudentIdHelp, setShowStudentIdHelp] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState('directory'); // 'directory' | 'builder'
  const [builderYear, setBuilderYear] = useState('24');
  const [builderCourseCode, setBuilderCourseCode] = useState('BEN');
  const [builderDeptCode, setBuilderDeptCode] = useState('01');
  const [builderRollNo, setBuilderRollNo] = useState('001');
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [guideSelectedCourse, setGuideSelectedCourse] = useState('BEN');
  const [copiedId, setCopiedId] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameError, setUsernameError] = useState('');
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  // Course code mapping for auto-selection
  const courseCodeMapping = {
    'BEN': 'B.E (Bachelor of Engineering)',
    'MTE': 'M.Tech (Master of Technology)',
    'MBA': 'MBA (Master of Business Administration)',
    'BBA': 'BBA (Bachelor of Business Administration)',
    'BCO': 'B.Com (Bachelor of Commerce)',
    'MCO': 'M.Com (Master of Commerce)',
    'PHD': 'Ph.D (Doctor of Philosophy)',
    'BCA': 'BCA (Bachelor of Computer Applications)',
    'MCA': 'MCA (Master of Computer Applications)',
    'BDS': 'Dental (Bachelor of Dental Surgery)',
    'MBS': 'MBBS (Bachelor of Medicine and Bachelor of Surgery)',
    'BSC': 'B.Sc (Bachelor of Science)',
    'MSC': 'M.Sc (Master of Science)',
    'BAR': 'BA (Bachelor of Arts)',
    'MAR': 'MA (Master of Arts)',
    'LLB': 'LLB (Bachelor of Laws)',
    'LLM': 'LLM (Master of Laws)',
    'BED': 'B.Ed (Bachelor of Education)',
    'MED': 'M.Ed (Master of Education)',
  };

  // Department code mapping (serial order for each course)
  const departmentCodeMapping = {
    'B.E (Bachelor of Engineering)': {
      '01': 'Artificial Intelligence and Machine Learning',
      '02': 'Computer Science & Engineering (Data Science)',
      '03': 'Information Science and Engineering',
      '04': 'Computer Science & Engineering (Internet of Things and Cyber Security including Block Chain Technology)',
      '05': 'Electronics and Instrumentation Engineering',
      '06': 'Computer Science and Design',
      '07': 'Mechanical Engineering',
      '08': 'Computer Science and Engineering',
      '09': 'Medical Electronics Engineering',
      '10': 'Computer Science and Business Systems',
      '11': 'Electronics and Telecommunication Engineering',
      '12': 'Computer Science & Engineering (Cyber Security)',
      '13': 'Robotics and Artificial Intelligence',
      '14': 'Aeronautical Engineering',
      '15': 'Chemical Engineering',
      '16': 'Automobile Engineering',
      '17': 'Civil Engineering',
      '18': 'Biotechnology',
      '19': 'Electrical & Electronics Engineering',
      '20': 'Electronics & Communication Engineering'
    },
    'M.Tech (Master of Technology)': {
      '01': 'Artificial Intelligence and Machine Learning',
      '02': 'Computer Science & Engineering (Data Science)',
      '03': 'Information Science and Engineering',
      '04': 'Computer Science & Engineering (Internet of Things and Cyber Security including Block Chain Technology)',
      '05': 'Electronics and Instrumentation Engineering',
      '06': 'Computer Science and Design',
      '07': 'Mechanical Engineering',
      '08': 'Computer Science and Engineering',
      '09': 'Medical Electronics Engineering',
      '10': 'Computer Science and Business Systems',
      '11': 'Electronics and Telecommunication Engineering',
      '12': 'Computer Science & Engineering (Cyber Security)',
      '13': 'Robotics and Artificial Intelligence',
      '14': 'Aeronautical Engineering',
      '15': 'Chemical Engineering',
      '16': 'Automobile Engineering',
      '17': 'Civil Engineering',
      '18': 'Biotechnology',
      '19': 'Electrical & Electronics Engineering',
      '20': 'Electronics & Communication Engineering'
    },
    'MBA (Master of Business Administration)': {
      '01': 'Finance',
      '02': 'Marketing',
      '03': 'Human Resources',
      '04': 'Operations Management',
      '05': 'International Business',
      '06': 'Business Analytics',
      '07': 'Entrepreneurship',
      '08': 'Supply Chain Management'
    },
    'BBA (Bachelor of Business Administration)': {
      '01': 'Finance',
      '02': 'Marketing',
      '03': 'Human Resources',
      '04': 'Operations Management',
      '05': 'International Business',
      '06': 'Business Analytics',
      '07': 'Entrepreneurship',
      '08': 'Supply Chain Management'
    },
    'B.Com (Bachelor of Commerce)': {
      '01': 'Accounting',
      '02': 'Banking & Finance',
      '03': 'Taxation',
      '04': 'Economics',
      '05': 'Business Mathematics',
      '06': 'Corporate Secretaryship'
    },
    'M.Com (Master of Commerce)': {
      '01': 'Accounting',
      '02': 'Banking & Finance',
      '03': 'Taxation',
      '04': 'Economics',
      '05': 'Business Mathematics',
      '06': 'Corporate Secretaryship'
    },
    'BCA (Bachelor of Computer Applications)': {
      '01': 'Software Development',
      '02': 'Database Management',
      '03': 'Web Technologies',
      '04': 'Mobile Application Development',
      '05': 'System Analysis and Design',
      '06': 'Network Administration'
    },
    'MCA (Master of Computer Applications)': {
      '01': 'Software Development',
      '02': 'Database Management',
      '03': 'Web Technologies',
      '04': 'Mobile Application Development',
      '05': 'System Analysis and Design',
      '06': 'Network Administration'
    },
    'MBBS (Bachelor of Medicine and Bachelor of Surgery)': {
      '01': 'General Medicine',
      '02': 'Surgery',
      '03': 'Pediatrics',
      '04': 'Cardiology',
      '05': 'Neurology',
      '06': 'Orthopedics',
      '07': 'Dermatology',
      '08': 'Radiology',
      '09': 'Anesthesiology',
      '10': 'Pathology'
    },
    'Dental (Bachelor of Dental Surgery)': {
      '01': 'Oral & Maxillofacial Surgery',
      '02': 'Orthodontics',
      '03': 'Periodontics',
      '04': 'Endodontics',
      '05': 'Prosthodontics',
      '06': 'Oral Medicine'
    },
    'B.Sc (Bachelor of Science)': {
      '01': 'Physics',
      '02': 'Chemistry',
      '03': 'Mathematics',
      '04': 'Biology',
      '05': 'Microbiology',
      '06': 'Biochemistry',
      '07': 'Zoology',
      '08': 'Botany',
      '09': 'Environmental Science',
      '10': 'Statistics'
    },
    'M.Sc (Master of Science)': {
      '01': 'Physics',
      '02': 'Chemistry',
      '03': 'Mathematics',
      '04': 'Biology',
      '05': 'Microbiology',
      '06': 'Biochemistry',
      '07': 'Zoology',
      '08': 'Botany',
      '09': 'Environmental Science',
      '10': 'Statistics'
    },
    'BA (Bachelor of Arts)': {
      '01': 'English Literature',
      '02': 'Hindi Literature',
      '03': 'History',
      '04': 'Political Science',
      '05': 'Sociology',
      '06': 'Philosophy',
      '07': 'Psychology',
      '08': 'Geography',
      '09': 'Journalism & Mass Communication',
      '10': 'Fine Arts',
      '11': 'Music',
      '12': 'Dance'
    },
    'MA (Master of Arts)': {
      '01': 'English Literature',
      '02': 'Hindi Literature',
      '03': 'History',
      '04': 'Political Science',
      '05': 'Sociology',
      '06': 'Philosophy',
      '07': 'Psychology',
      '08': 'Geography',
      '09': 'Journalism & Mass Communication',
      '10': 'Fine Arts',
      '11': 'Music',
      '12': 'Dance'
    },
    'LLB (Bachelor of Laws)': {
      '01': 'Constitutional Law',
      '02': 'Criminal Law',
      '03': 'Corporate Law',
      '04': 'International Law',
      '05': 'Civil Law',
      '06': 'Intellectual Property Law',
      '07': 'Environmental Law'
    },
    'LLM (Master of Laws)': {
      '01': 'Constitutional Law',
      '02': 'Criminal Law',
      '03': 'Corporate Law',
      '04': 'International Law',
      '05': 'Civil Law',
      '06': 'Intellectual Property Law',
      '07': 'Environmental Law'
    },
    'B.Ed (Bachelor of Education)': {
      '01': 'Primary Education',
      '02': 'Secondary Education',
      '03': 'Special Education',
      '04': 'Educational Psychology',
      '05': 'Curriculum Development',
      '06': 'Educational Technology',
      '07': 'Physical Education'
    },
    'M.Ed (Master of Education)': {
      '01': 'Primary Education',
      '02': 'Secondary Education',
      '03': 'Special Education',
      '04': 'Educational Psychology',
      '05': 'Curriculum Development',
      '06': 'Educational Technology',
      '07': 'Physical Education'
    },
    'Ph.D (Doctor of Philosophy)': {
      '01': 'Engineering & Technology',
      '02': 'Business & Management',
      '03': 'Commerce & Economics',
      '04': 'Computer Applications',
      '05': 'Medical Sciences',
      '06': 'Basic Sciences',
      '07': 'Arts & Humanities',
      '08': 'Law',
      '09': 'Education'
    }
  };

  // Function to auto-select course and department based on student ID
  const autoSelectCourseAndDepartment = (studentId) => {
    if (!studentId || studentId.length !== 10) return { course: '', department: '' };
    
    const courseCode = studentId.substring(2, 5);  // Extract CCC part
    const deptCode = studentId.substring(5, 7);    // Extract DD part
    
    // Find course by code
    const course = courseCodeMapping[courseCode.toUpperCase()] || '';
    
    // Find department by code and course
    let department = '';
    if (course && departmentCodeMapping[course] && departmentCodeMapping[course][deptCode]) {
      department = departmentCodeMapping[course][deptCode];
    }
    
    return { course, department };
  };

  // Helper to open Student ID Help modal & prefill builder if studentId is valid
  const openStudentIdHelp = () => {
    if (formData.studentId && formData.studentId.length === 10) {
      const yr = formData.studentId.substring(0, 2);
      const cCode = formData.studentId.substring(2, 5).toUpperCase();
      const dCode = formData.studentId.substring(5, 7);
      const roll = formData.studentId.substring(7, 10);
      
      if (courseCodeMapping[cCode]) {
        setBuilderYear(yr);
        setBuilderCourseCode(cCode);
        setBuilderDeptCode(dCode);
        setBuilderRollNo(roll);
      }
    }
    setActiveHelpTab('directory');
    setShowStudentIdHelp(true);
  };

  // Helper when changing course in builder
  const handleBuilderCourseChange = (newCourseCode) => {
    setBuilderCourseCode(newCourseCode);
    const fullCourseName = courseCodeMapping[newCourseCode];
    if (fullCourseName && departmentCodeMapping[fullCourseName]) {
      const availableDepts = Object.keys(departmentCodeMapping[fullCourseName]);
      if (!availableDepts.includes(builderDeptCode)) {
        setBuilderDeptCode(availableDepts[0] || '01');
      }
    }
  };

  // Helper to apply generated student ID to registration form
  const handleApplyGeneratedId = (idToApply) => {
    const targetId = (idToApply || `${builderYear}${builderCourseCode}${builderDeptCode}${builderRollNo}`).toUpperCase();
    const { course, department } = autoSelectCourseAndDepartment(targetId);
    const campusId = generateCampusId(targetId, formData.firstName);
    
    setFormData(prev => ({
      ...prev,
      studentId: targetId,
      campusId: campusId,
      course: course,
      department: department
    }));
    
    setShowStudentIdHelp(false);
    if (course && department) {
      toast.success(`Student ID applied: ${targetId} (${course} - ${department})`);
    } else {
      toast.success(`Student ID applied: ${targetId}`);
    }
  };

  // Helper to copy generated ID
  const handleCopyId = (idToCopy) => {
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    toast.success(`Copied ${idToCopy} to clipboard!`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const years = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    '5th Year',
    'Graduate',
    'Post Graduate',
    'Ph.D'
  ];

  // Password validation function
  const validatePassword = (password) => {
    const validation = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    setPasswordValidation(validation);
    return validation;
  };

  // Calculate password strength
  const getPasswordStrength = () => {
    const validCount = Object.values(passwordValidation).filter(Boolean).length;
    if (validCount === 0) return { strength: 0, label: '', color: '' };
    if (validCount <= 2) return { strength: 25, label: 'Weak', color: 'bg-red-500' };
    if (validCount <= 3) return { strength: 50, label: 'Fair', color: 'bg-yellow-500' };
    if (validCount <= 4) return { strength: 75, label: 'Good', color: 'bg-blue-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  // Function to generate campusId - simple shared format for all users
  const generateCampusId = (studentId, firstName) => {
    // Simple shared campus ID for all users
    return 'CC_Name';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow changes to specific fields (not course or department)
    if (name === 'course' || name === 'department') {
      // Prevent manual changes to course and department
      toast.error('Course and department are auto-selected based on Student ID');
      return;
    }
    
    if (name === 'studentId' || name === 'firstName') {
      // If studentId or firstName changes, automatically generate campusId
      const newFormData = { ...formData, [name]: value };
      const campusId = generateCampusId(
        name === 'studentId' ? value : formData.studentId,
        name === 'firstName' ? value : formData.firstName
      );
      
      // If studentId changes, also auto-select course and department
      if (name === 'studentId') {
        const { course, department } = autoSelectCourseAndDepartment(value);
        setFormData({
          ...newFormData,
          campusId: campusId,
          course: course,
          department: department
        });
        
        // Show toast notification about auto-selection
        if (course && department) {
          toast.success(`Auto-selected: ${course} - ${department}`);
        } else if (course) {
          toast.success(`Auto-selected course: ${course}`);
          if (value.length === 10) {
            toast.error('Department code not found for this course');
          }
        } else if (value.length === 10) {
          toast.error('Course code not recognized. Please select manually.');
        }
      } else {
        setFormData({
          ...newFormData,
          campusId: campusId
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }

    // Check username availability when username changes
    if (name === 'username') {
      setUsernameAvailable(null);
      setUsernameError('');
      if (value.trim().length >= 3) {
        checkUsernameAvailability(value.trim());
      }
    }

    // Check email availability when email changes
    if (name === 'email') {
      setEmailAvailable(null);
      setEmailError('');
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(value.trim())) {
        checkEmailAvailability(value.trim());
      }
    }

    // Validate password when it changes
    if (name === 'password') {
      validatePassword(value);
    }
  };

  const checkEmailAvailability = async (email) => {
    try {
      setEmailChecking(true);
      setEmailError('');
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Please enter a valid email address');
        setEmailAvailable(false);
        return;
      }

      // Check availability with backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/check-email/${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.success) {
        setEmailAvailable(data.available);
        if (!data.available) {
          setEmailError('This email is already registered');
        }
      } else {
        setEmailError('Error checking email availability');
        setEmailAvailable(false);
      }
    } catch (error) {
      setEmailError('Error checking email availability');
      setEmailAvailable(false);
    } finally {
      setEmailChecking(false);
    }
  };

  const checkUsernameAvailability = async (username) => {
    try {
      setUsernameChecking(true);
      setUsernameError('');
      
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(username)) {
        setUsernameError('Username can only contain letters, numbers, and underscores');
        setUsernameAvailable(false);
        return;
      }

      if (username.length < 3) {
        setUsernameError('Username must be at least 3 characters');
        setUsernameAvailable(false);
        return;
      }

      if (username.length > 20) {
        setUsernameError('Username must be less than 20 characters');
        setUsernameAvailable(false);
        return;
      }

      // Check availability with backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/check-username/${username}`);
      const data = await response.json();
      
      if (data.success) {
        setUsernameAvailable(data.available);
        if (!data.available) {
          setUsernameError('Username is already taken');
        }
      } else {
        setUsernameError('Error checking username availability');
        setUsernameAvailable(false);
      }
    } catch (error) {
      setUsernameError('Error checking username availability');
      setUsernameAvailable(false);
    } finally {
      setUsernameChecking(false);
    }
  };

  const validateStep1 = () => {
    const { firstName, lastName, username, email, password, confirmPassword } = formData;
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter your full name');
      return false;
    }

    if (!username.trim()) {
      toast.error('Please enter a username');
      return false;
    }

    if (username.trim().length < 3) {
      toast.error('Username must be at least 3 characters');
      return false;
    }

    if (usernameAvailable === false) {
      toast.error('Please choose a different username');
      return false;
    }

    if (usernameAvailable === null && username.trim().length >= 3) {
      toast.error('Please wait for username availability check');
      return false;
    }
    
    if (!email.trim()) {
      toast.error('Please enter your email');
      return false;
    }

    // Check if email is available
    if (emailAvailable === false) {
      toast.error('This email is already registered. Please use a different email or try logging in.');
      return false;
    }

    if (emailAvailable === null && email.trim().length > 0) {
      // Check if email has valid format first
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email.trim())) {
        toast.error('Please wait for email availability check');
        return false;
      }
    }
    
    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.minLength) {
      toast.error('Password must be at least 8 characters long');
      return false;
    }
    if (!validation.hasUpperCase) {
      toast.error('Password must contain at least one uppercase letter');
      return false;
    }
    if (!validation.hasLowerCase) {
      toast.error('Password must contain at least one lowercase letter');
      return false;
    }
    if (!validation.hasNumber) {
      toast.error('Password must contain at least one number');
      return false;
    }
    if (!validation.hasSpecialChar) {
      toast.error('Password must contain at least one special character');
      return false;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    const { studentId, course, department, year } = formData;
    
    if (!studentId.trim()) {
      toast.error('Please enter your student ID');
      return false;
    }
    
    // Validate student ID format: YYCCCDDNNN
    const studentIdRegex = /^\d{2}[A-Z]{3}\d{5}$/i;
    if (!studentIdRegex.test(studentId.trim())) {
      toast.error('Student ID must be in format YYCCCDDNNN(e.g,22BEN03073). Course and department will be auto-selected from this ID.');
      return false;
    }
    
    if (!course) {
      toast.error('Course could not be auto-selected. Please check your Student ID format.');
      return false;
    }
    
    if (!department) {
      toast.error('Department could not be auto-selected. Please check your Student ID format.');
      return false;
    }
    
    if (!year) {
      toast.error('Please select your year');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      handleNext();
      return;
    }
    
    if (!validateStep2()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { confirmPassword, ...registrationData } = formData;
      await register(registrationData);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      
      // Handle specific error cases
      if (errorMessage.includes('email address is already in use')) {
        toast.error('This email is already registered. Please try logging in instead.');
      } else if (errorMessage.includes('email-already-exists')) {
        toast.error('This email is already registered. Please try logging in instead.');
      } else if (errorMessage.includes('weak-password')) {
        toast.error('Password is too weak. Please choose a stronger password.');
      } else if (errorMessage.includes('invalid-email')) {
        toast.error('Please enter a valid email address.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex relative bg-white dark:bg-gray-900">
      {/* Theme Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-md transition-all"
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkMode
          ? <BsSunFill className="w-4 h-4 text-amber-400" />
          : <BsMoonStarsFill className="w-4 h-4 text-indigo-500" />
        }
      </button>

      {/* Left side - Registration form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full space-y-8"
        >
          {/* Header */}
          <div className="text-center pt-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex items-center justify-center gap-3 mb-4"
            >
              <img
                src="/icon.png"
                alt="CampusConnect"
                className="h-12 w-12 rounded-2xl shadow-lg"
              />
              <span
                className="text-2xl font-bold tracking-tight"
                style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
              >
                CampusConnect
              </span>
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Join CampusConnect</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create your account to get started
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${
              step >= 2 ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              2
            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3"
            >
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Registration form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Name fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="pl-10 w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="First name"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                {/* Username field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className={`pl-10 pr-10 w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                        usernameError 
                          ? 'border-red-500 focus:border-red-500' 
                          : usernameAvailable === true 
                            ? 'border-green-500 focus:border-green-500'
                            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400'
                      }`}
                      placeholder="Choose a unique username"
                    />
                    
                    {/* Username status indicator */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {usernameChecking && (
                        <FiLoader className="w-5 h-5 text-gray-400 dark:text-gray-500 animate-spin" />
                      )}
                      {!usernameChecking && usernameAvailable === true && (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {!usernameChecking && usernameAvailable === false && (
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Username feedback */}
                  {usernameError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{usernameError}</p>
                  )}
                  {!usernameError && usernameAvailable === true && (
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">Username is available!</p>
                  )}
                  {formData.username.length > 0 && formData.username.length < 3 && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Username must be at least 3 characters</p>
                  )}
                </div>

                {/* Email field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={`pl-10 pr-10 w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                        emailError 
                          ? 'border-red-500 focus:border-red-500 dark:border-red-400 dark:focus:border-red-400' 
                          : emailAvailable === true 
                            ? 'border-green-500 focus:border-green-500 dark:border-green-400 dark:focus:border-green-400'
                            : 'border-gray-300 focus:border-blue-500 dark:border-gray-600 dark:focus:border-blue-400'
                      }`}
                      placeholder="Enter your email"
                    />
                    
                    {/* Email status indicator */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {emailChecking && (
                        <FiLoader className="w-5 h-5 text-gray-400 dark:text-gray-500 animate-spin" />
                      )}
                      {!emailChecking && emailAvailable === true && (
                        <div className="w-5 h-5 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {!emailChecking && emailAvailable === false && (
                        <div className="w-5 h-5 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Email feedback */}
                  {emailError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{emailError}</p>
                  )}
                  {!emailError && emailAvailable === true && (
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">Email is available!</p>
                  )}
                  {!emailError && emailAvailable === false && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      This email is already registered. <Link to="/login" className="underline hover:text-red-700 dark:hover:text-red-300">Try logging in instead</Link>.
                    </p>
                  )}
                </div>

                {/* Password fields */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 pr-10 w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password validation indicators */}
                  {formData.password && (
                    <div className="mt-2">
                      {/* Password strength bar */}
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Password Strength</span>
                          <span className={`text-xs font-medium ${getPasswordStrength().label === 'Strong' ? 'text-green-600 dark:text-green-400' : getPasswordStrength().label === 'Good' ? 'text-blue-600 dark:text-blue-400' : getPasswordStrength().label === 'Fair' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                            {getPasswordStrength().label}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrength().color}`}
                            style={{ width: `${getPasswordStrength().strength}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Validation checklist */}
                      <div className="space-y-1">
                        <div className={`flex items-center space-x-2 text-xs ${passwordValidation.minLength ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          <span>{passwordValidation.minLength ? '✓' : '✗'}</span>
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center space-x-2 text-xs ${passwordValidation.hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          <span>{passwordValidation.hasUpperCase ? '✓' : '✗'}</span>
                          <span>One uppercase letter</span>
                        </div>
                        <div className={`flex items-center space-x-2 text-xs ${passwordValidation.hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          <span>{passwordValidation.hasLowerCase ? '✓' : '✗'}</span>
                          <span>One lowercase letter</span>
                        </div>
                        <div className={`flex items-center space-x-2 text-xs ${passwordValidation.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          <span>{passwordValidation.hasNumber ? '✓' : '✗'}</span>
                          <span>One number</span>
                        </div>
                        <div className={`flex items-center space-x-2 text-xs ${passwordValidation.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          <span>{passwordValidation.hasSpecialChar ? '✓' : '✗'}</span>
                          <span>One special character (!@#$%^&*)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10 pr-10 w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Student ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="studentId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Student ID
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowStudentIdHelp(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-semibold transition-colors flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800/50"
                    >
                      <FiSliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      {showStudentIdHelp ? 'Hide Assistant' : 'ID Builder & Details'}
                    </button>
                  </div>
                  <div className="relative">
                    <FiBook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      id="studentId"
                      name="studentId"
                      type="text"
                      required
                      value={formData.studentId}
                      onChange={handleChange}
                      className="pl-10 w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-mono"
                      placeholder="YYCCCDDNNN(e.g,22BEN01001)"
                    />
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                    <span>💡 Course &amp; department auto-select based on your Student ID. Use button above to build.</span>
                  </p>
                </div>

                {/* Student ID Modal popup */}
                {showStudentIdHelp && (
                  <StudentIdModal
                    onClose={() => setShowStudentIdHelp(false)}
                    onApply={handleApplyGeneratedId}
                    initialStudentId={formData.studentId}
                  />
                )}
                {/* Course */}
                <div>
                  <label htmlFor="course" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Course {formData.course && formData.studentId && formData.studentId.length === 10 && (
                      <span className="text-green-600 dark:text-green-400 text-xs">(Auto-selected)</span>
                    )}
                  </label>
                  <div className={`w-full px-3 py-3 border rounded-lg transition-colors ${
                    formData.course && formData.studentId && formData.studentId.length === 10
                      ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20' 
                      : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700'
                  }`}>
                    <span className={
                      formData.course 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-500 dark:text-gray-400'
                    }>
                      {formData.course || (
                        formData.studentId && formData.studentId.length === 10 
                          ? 'Course code not recognized' 
                          : 'Enter Student ID to auto-select course'
                      )}
                    </span>
                  </div>
                  {!formData.course && formData.studentId && formData.studentId.length === 10 && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      ❌ Course code not recognized. Please check your Student ID.
                    </p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department {formData.department && formData.studentId && formData.studentId.length === 10 && (
                      <span className="text-green-600 dark:text-green-400 text-xs">(Auto-selected)</span>
                    )}
                  </label>
                  <div className={`w-full px-3 py-3 border rounded-lg transition-colors ${
                    formData.department && formData.studentId && formData.studentId.length === 10
                      ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20'
                      : formData.course && !formData.department && formData.studentId && formData.studentId.length === 10
                        ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20'
                        : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700'
                  }`}>
                    <span className={
                      formData.department 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-500 dark:text-gray-400'
                    }>
                      {formData.department || (
                        !formData.course 
                          ? 'Enter Student ID to auto-select department'
                          : formData.studentId && formData.studentId.length === 10
                            ? 'Department code not recognized'
                            : 'Enter Student ID to auto-select department'
                      )}
                    </span>
                  </div>
                  {formData.course && !formData.department && formData.studentId && formData.studentId.length === 10 && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      ❌ Department code not recognized for this course. Please check your Student ID.
                    </p>
                  )}
                </div>

                {/* Hidden inputs for course and department to ensure they're submitted */}
                <input type="hidden" name="course" value={formData.course} />
                <input type="hidden" name="department" value={formData.department} />

                {/* Year */}
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Year/Level
                  </label>
                  <select
                    id="year"
                    name="year"
                    required
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select your year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Bio */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio (Optional)
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Tell us about yourself..."
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Write a brief introduction about yourself (optional)
                  </p>
                </div>
              </motion.div>
            )}

            {/* Form actions */}
            <div className="flex space-x-4">
              {step === 2 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="flex-1 bg-blue-600 dark:bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting || loading ? (
                  <FiLoader className="w-5 h-5 animate-spin" />
                ) : step === 1 ? (
                  'Continue'
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </motion.form>

          {/* Sign in link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center pb-8"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Right side - Hero image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="relative h-full flex items-center justify-center p-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-center text-white"
            >
              <img
                src="/icon.png"
                alt="CampusConnect"
                className="h-20 w-20 rounded-3xl shadow-2xl mx-auto mb-6"
              />
              <h1 className="text-4xl font-bold mb-6">
                Join Your Campus Community
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Connect with fellow students, stay updated on events, and participate in campus life
              </p>
              <div className="space-y-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-sm">✓</span>
                  </div>
                  <span>Real-time campus updates and announcements</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-sm">✓</span>
                  </div>
                  <span>Participate in polls and campus discussions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-sm">✓</span>
                  </div>
                  <span>Find lost items and help others</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-sm">✓</span>
                  </div>
                  <span>Share and discover campus memes</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
