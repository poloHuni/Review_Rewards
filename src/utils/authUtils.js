// src/utils/authUtils.js - Simplified for existing AuthContext
import { auth } from '../firebase/config';

/**
 * Get the currently authenticated user from Firebase auth
 * This works alongside your existing AuthContext
 */
export const getCurrentUser = () => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  
  return {
    uid: firebaseUser.uid,
    user_id: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    name: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified
  };
};

/**
 * Check if user is authenticated
 */
export const isUserAuthenticated = () => {
  return !!getCurrentUser();
};

/**
 * Get user ID consistently from any user object
 */
export const getUserId = (user = null) => {
  if (!user) return null;
  
  return user.uid || user.user_id || user.id || null;
};

/**
 * Get user display name consistently
 */
export const getUserDisplayName = (user = null) => {
  if (!user) return '';
  
  return user.displayName || 
         user.name || 
         user.full_name || 
         user.email?.split('@')[0] || 
         'User';
};

/**
 * Authentication error handler
 */
export const handleAuthError = (error) => {
  console.error('Authentication error:', error);
  
  switch (error.code) {
    case 'permission-denied':
      return 'Permission denied. Please ensure you are logged in and have permission to save reviews.';
    case 'unauthenticated':
      return 'Please log in and try again.';
    case 'invalid-argument':
      return 'Invalid review data. Please check that all required fields are filled out correctly.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
};