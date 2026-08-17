import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiArrowLeft, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { BsSunFill, BsMoonStarsFill } from 'react-icons/bs';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
// Password reset is handled via backend to send a custom branded email

const ForgotPassword = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailNotFound, setEmailNotFound] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!email) {
        throw new Error('Please enter your email address');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // ✅ Send reset email via backend — delivers our custom branded HTML email
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      // 404 = email not registered — show dedicated error screen
      if (response.status === 404) {
        setEmailNotFound(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setEmailSent(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Email not found screen ───────────────────────────────────────────────
  if (emailNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          {/* Error card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Red top bar */}
            <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-400" />

            <div className="p-8 text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 220 }}
                className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full mx-auto flex items-center justify-center mb-5"
              >
                <span className="text-4xl">✉️</span>
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Email Not Registered
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-2">
                We couldn't find any CampusConnect account linked to
              </p>
              <span className="inline-block bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 font-semibold font-mono text-sm px-3 py-1 rounded-lg mb-6">
                {email}
              </span>

              {/* Info box */}
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/40 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">💡 What to do next</p>
                <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1.5">
                  <li>• Double-check the email address for typos</li>
                  <li>• Try a different email you may have used to register</li>
                  <li>• Create a new account if you haven't registered yet</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setEmailNotFound(false);
                    setEmail('');
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <FiMail className="w-4 h-4" />
                  Try with a different email
                </button>

                <Link
                  to="/register"
                  className="w-full border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
                >
                  Create a new account
                </Link>

                <Link
                  to="/login"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center justify-center gap-1"
                >
                  <FiArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Email sent success screen ────────────────────────────────────────────
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto flex items-center justify-center mb-6"
            >
              <FiCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              We've sent password reset instructions to{' '}
              <span className="font-medium text-gray-900 dark:text-white">{email}</span>
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                What's next?
              </h3>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 text-left">
                <li>• Check your email inbox for reset instructions</li>
                <li>• Click the reset link in the email</li>
                <li>• Create a new password for your account</li>
                <li>• Sign in with your new password</li>
              </ul>
            </div>

            <div className="space-y-4">
              <Link
                to="/login"
                className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                <FiArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Link>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Didn't receive the email?{' '}
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900 relative">
      {/* Theme Toggle — matches Login & Register */}
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
      {/* Left side - Form */}
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
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mx-auto flex items-center justify-center mb-4"
            >
              <span className="text-white font-bold text-xl">CC</span>
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Forgot your password?</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Enter your email address and we'll send you instructions to reset your password
            </p>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <FiLoader className="w-5 h-5 animate-spin" />
              ) : (
                'Send Reset Instructions'
              )}
            </button>
          </motion.form>

          {/* Back to login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center pb-8"
          >
            <Link
              to="/login"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium flex items-center justify-center"
            >
              <FiArrowLeft className="w-4 h-4 mr-1" />
              Back to Sign In
            </Link>
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
              <h1 className="text-4xl font-bold mb-6">
                Reset Your Password
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Don't worry, it happens to the best of us. We'll help you get back into your account quickly and securely.
              </p>
              <div className="bg-white bg-opacity-10 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Security First</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                    <span>Secure password reset process</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                    <span>Email verification required</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                    <span>Account protection maintained</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;