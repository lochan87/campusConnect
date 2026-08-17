import { initializeApp, getApps } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Prevent re-initialization in hot-reload / dev environments
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const firebaseAuth = getAuth(app);

/**
 * Sends a Firebase password-reset email to the given address.
 * Firebase handles the email delivery and secure reset link generation.
 */
export { sendPasswordResetEmail };

/**
 * Maps Firebase error codes to user-friendly messages.
 */
export const getFirebaseAuthErrorMessage = (errorCode) => {
  const messages = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/invalid-email': 'The email address is not valid.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/missing-android-pkg-name': 'Configuration error. Please contact support.',
    'auth/unauthorized-continue-uri': 'Configuration error. Please contact support.',
  };
  return messages[errorCode] || 'Something went wrong. Please try again.';
};
