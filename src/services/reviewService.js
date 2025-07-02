// src/services/reviewService.js
// COMPLETE REPLACEMENT - Copy this entire file

import { 
  addDoc, 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Debug mode - set to true to see detailed logs
const DEBUG_MODE = true;

// Helper function for debug logging
const debugLog = (message, data = null) => {
  if (DEBUG_MODE) {
    console.log(`🔍 [ReviewService] ${message}`, data || '');
  }
};

// Helper function to extract user ID from different user object structures
const getUserId = (user) => {
  if (!user) {
    debugLog('❌ User object is null or undefined');
    return null;
  }
  
  debugLog('🔍 Raw user object:', user);
  debugLog('🔍 User object keys:', Object.keys(user));
  
  // Try different possible user ID properties
  const possibleIds = [
    user.uid,        // Firebase Auth standard
    user.id,         // Alternative
    user.userId,     // Alternative
    user.user_id,    // Alternative
    user.sub,        // JWT standard
    user._id         // MongoDB style
  ];
  
  for (let i = 0; i < possibleIds.length; i++) {
    if (possibleIds[i]) {
      debugLog(`✅ Found user ID in property ${['uid', 'id', 'userId', 'user_id', 'sub', '_id'][i]}:`, possibleIds[i]);
      return possibleIds[i];
    }
  }
  
  debugLog('❌ No valid user ID found in any standard property');
  return null;
};

// Helper function to clean data for Firestore (remove undefined values)
const cleanDataForFirestore = (data) => {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Recursively clean nested objects
        cleaned[key] = cleanDataForFirestore(value);
      } else if (Array.isArray(value)) {
        // Clean arrays
        cleaned[key] = value.filter(item => item !== undefined && item !== null);
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
};

// Save review with comprehensive debugging and flexible user handling
export const saveReview = async (reviewData, user) => {
  try {
    debugLog('Starting review save process...');
    debugLog('User object received:', user);
    debugLog('Raw review data:', reviewData);
    
    // Validation checks
    if (!user) {
      throw new Error('User not authenticated - please log in');
    }
    
    // Extract user ID using helper function
    const userId = getUserId(user);
    
    if (!userId) {
      console.error('🚨 DETAILED USER DEBUG:');
      console.error('User object:', user);
      console.error('User type:', typeof user);
      console.error('User keys:', user ? Object.keys(user) : 'No keys');
      console.error('All user properties:', JSON.stringify(user, null, 2));
      
      throw new Error('User ID not found. Please check your authentication setup.');
    }
    
    debugLog('✅ Successfully extracted user ID:', userId);
    
    if (!reviewData) {
      throw new Error('Review data is missing');
    }
    
    // Prepare the review data with required fields
    const reviewToSave = {
      // Core review data - ensure no undefined values
      summary: String(reviewData.summary || 'No summary provided'),
      food_quality: String(reviewData.food_quality || ''),
      service: String(reviewData.service || ''),
      atmosphere: String(reviewData.atmosphere || ''),
      music_and_entertainment: String(reviewData.music_and_entertainment || ''),
      specific_points: Array.isArray(reviewData.specific_points) 
        ? reviewData.specific_points.filter(point => point && String(point).trim())
        : [],
      sentiment_score: Number(reviewData.sentiment_score) || 3,
      improvement_suggestions: Array.isArray(reviewData.improvement_suggestions)
        ? reviewData.improvement_suggestions.filter(suggestion => suggestion && String(suggestion).trim())
        : [],
      
      // Restaurant info
      restaurant_id: String(reviewData.restaurant_id || 'default_restaurant'),
      restaurant_name: String(reviewData.restaurant_name || 'Restaurant'),
      
      // User info - CRITICAL for security rules
      user_id: String(userId),
      user_email: String(user.email || ''),
      user_name: String(user.displayName || user.name || user.full_name || ''),
      
      // Audio/media - only include if they exist
      ...(reviewData.audio_url && { audio_url: String(reviewData.audio_url) }),
      ...(reviewData.transcription && { transcription: String(reviewData.transcription) }),
      
      // Timestamps
      timestamp: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Clean the data to remove any undefined values
    const cleanedReviewData = cleanDataForFirestore(reviewToSave);
    
    debugLog('Prepared review data:', reviewToSave);
    debugLog('Cleaned review data:', cleanedReviewData);
    debugLog('Final user_id value:', cleanedReviewData.user_id);
    
    // Additional validation
    if (!cleanedReviewData.user_id) {
      throw new Error('user_id field is missing or empty after processing');
    }
    
    if (!cleanedReviewData.summary || cleanedReviewData.summary.trim() === '') {
      throw new Error('Review summary is required');
    }
    
    debugLog('✅ All validations passed, attempting to save to Firestore...');
    
    // Save to Firestore
    const docRef = await addDoc(collection(db, 'reviews'), cleanedReviewData);
    
    debugLog('✅ Review saved successfully!');
    debugLog('Document ID:', docRef.id);
    
    return {
      success: true,
      id: docRef.id,
      data: cleanedReviewData
    };
    
  } catch (error) {
    debugLog('❌ Error saving review:', error);
    
    // Enhanced error reporting
    console.error('🚨 REVIEW SAVE ERROR DETAILS:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    // Log the exact data that failed
    if (reviewData) {
      console.error('🔍 Review data that failed:');
      console.error('Type of reviewData:', typeof reviewData);
      console.error('ReviewData keys:', Object.keys(reviewData));
      console.error('Full reviewData:', JSON.stringify(reviewData, null, 2));
    }
    
    // Specific error handling
    if (error.code === 'permission-denied') {
      console.error('🔒 PERMISSION DENIED - Debugging info:');
      console.error('1. User object:', user);
      console.error('2. Extracted user ID:', getUserId(user));
      console.error('3. Review data:', reviewData);
      throw new Error('Permission denied. Check Firestore security rules and ensure you are logged in.');
    }
    
    if (error.code === 'unauthenticated') {
      throw new Error('User not authenticated. Please log in and try again.');
    }
    
    if (error.code === 'invalid-argument') {
      console.error('📝 INVALID ARGUMENT - Data validation failed:');
      console.error('This usually means the data contains undefined, null, or invalid values');
      console.error('Review data type:', typeof reviewData);
      console.error('Review data:', reviewData);
      throw new Error('Invalid review data structure. Check console for details.');
    }
    
    // Re-throw with enhanced message
    throw new Error(`Failed to save review: ${error.message}`);
  }
};

// Get reviews for a specific user (with flexible user ID handling)
export const getUserReviews = async (user) => {
  try {
    const userId = getUserId(user);
    debugLog('Fetching reviews for user ID:', userId);
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('user_id', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(reviewsQuery);
    const reviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    debugLog('✅ Fetched reviews:', reviews.length);
    return reviews;
    
  } catch (error) {
    debugLog('❌ Error fetching user reviews:', error);
    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }
};

// Update an existing review
export const updateReview = async (reviewId, updateData, user) => {
  try {
    const userId = getUserId(user);
    debugLog('Updating review:', reviewId);
    debugLog('Update data:', updateData);
    
    if (!reviewId || !userId) {
      throw new Error('Review ID and User ID are required');
    }
    
    const reviewRef = doc(db, 'reviews', reviewId);
    
    const dataToUpdate = cleanDataForFirestore({
      ...updateData,
      updated_at: new Date(),
      user_id: userId
    });
    
    await updateDoc(reviewRef, dataToUpdate);
    
    debugLog('✅ Review updated successfully');
    return { success: true };
    
  } catch (error) {
    debugLog('❌ Error updating review:', error);
    throw new Error(`Failed to update review: ${error.message}`);
  }
};

// Delete a review
export const deleteReview = async (reviewId, user) => {
  try {
    const userId = getUserId(user);
    debugLog('Deleting review:', reviewId);
    
    if (!reviewId || !userId) {
      throw new Error('Review ID and User ID are required');
    }
    
    const reviewRef = doc(db, 'reviews', reviewId);
    await deleteDoc(reviewRef);
    
    debugLog('✅ Review deleted successfully');
    return { success: true };
    
  } catch (error) {
    debugLog('❌ Error deleting review:', error);
    throw new Error(`Failed to delete review: ${error.message}`);
  }
};

// Test function to verify permissions
export const testReviewPermissions = async (user) => {
  try {
    console.log('🧪 Testing review permissions...');
    console.log('User received:', user);
    
    const userId = getUserId(user);
    
    if (!userId) {
      throw new Error('User not authenticated or user ID not found');
    }
    
    // Create a test review
    const testReview = cleanDataForFirestore({
      summary: 'Test review for permission check',
      food_quality: 'Test',
      service: 'Test',
      atmosphere: 'Test',
      music_and_entertainment: 'Test',
      specific_points: ['Test point'],
      sentiment_score: 5,
      improvement_suggestions: ['Test suggestion'],
      restaurant_id: 'test_restaurant',
      restaurant_name: 'Test Restaurant',
      user_id: userId,
      user_email: user.email || '',
      timestamp: new Date(),
      created_at: new Date()
    });
    
    console.log('🧪 Test review data:', testReview);
    
    // Try to save the test review
    const docRef = await addDoc(collection(db, 'reviews'), testReview);
    console.log('✅ Test review saved successfully with ID:', docRef.id);
    
    // Clean up - delete the test review
    await deleteDoc(doc(db, 'reviews', docRef.id));
    console.log('✅ Test review cleaned up');
    
    return { success: true, message: 'Permissions test passed!' };
    
  } catch (error) {
    console.error('❌ Permissions test failed:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

// Generate Google Reviews link for a restaurant
export const generateGoogleReviewLink = (restaurantName, placeId = null) => {
  try {
    debugLog('Generating Google Reviews link for:', restaurantName);
    
    if (placeId) {
      return `https://search.google.com/local/writereview?placeid=${placeId}`;
    } else if (restaurantName) {
      const encodedName = encodeURIComponent(restaurantName);
      return `https://www.google.com/maps/search/${encodedName}/@-26.2041,28.0473,10z/data=!3m1!4b1!4m2!2m1!6e1`;
    } else {
      return 'https://www.google.com/maps';
    }
  } catch (error) {
    debugLog('❌ Error generating Google Reviews link:', error);
    return 'https://www.google.com/maps';
  }
};

// Format review text for sharing
export const formatReviewForSharing = (reviewData, restaurantName = 'this restaurant') => {
  try {
    debugLog('Formatting review for sharing:', reviewData);
    
    if (!reviewData) {
      return 'I had a great experience at this restaurant!';
    }
    
    let formattedReview = '';
    
    // Add star rating if available
    if (reviewData.sentiment_score) {
      const stars = '⭐'.repeat(Math.max(1, Math.min(5, Math.floor(reviewData.sentiment_score))));
      formattedReview += `${stars} `;
    }
    
    // Add main summary
    if (reviewData.summary) {
      formattedReview += reviewData.summary;
    } else {
      formattedReview += `Had a wonderful experience at ${restaurantName}!`;
    }
    
    // Add specific highlights if available
    const highlights = [];
    
    if (reviewData.food_quality && reviewData.food_quality !== 'N/A') {
      highlights.push(`Food: ${reviewData.food_quality}`);
    }
    
    if (reviewData.service && reviewData.service !== 'N/A') {
      highlights.push(`Service: ${reviewData.service}`);
    }
    
    if (reviewData.atmosphere && reviewData.atmosphere !== 'N/A') {
      highlights.push(`Atmosphere: ${reviewData.atmosphere}`);
    }
    
    if (highlights.length > 0) {
      formattedReview += '\n\n' + highlights.join('\n');
    }
    
    // Add key points if available
    if (reviewData.specific_points && Array.isArray(reviewData.specific_points) && reviewData.specific_points.length > 0) {
      const validPoints = reviewData.specific_points.filter(point => point && point.trim() !== '');
      if (validPoints.length > 0) {
        formattedReview += '\n\nHighlights:\n';
        validPoints.slice(0, 3).forEach(point => {
          formattedReview += `• ${point}\n`;
        });
      }
    }
    
    // Add restaurant name at the end if not already included
    if (!formattedReview.toLowerCase().includes(restaurantName.toLowerCase())) {
      formattedReview += `\n\n#${restaurantName.replace(/\s+/g, '')} #RestaurantReview`;
    }
    
    debugLog('✅ Formatted review:', formattedReview);
    return formattedReview;
    
  } catch (error) {
    debugLog('❌ Error formatting review:', error);
    return reviewData?.summary || `Had a great experience at ${restaurantName}!`;
  }
};

// Copy review to clipboard
export const copyReviewToClipboard = async (reviewData, restaurantName) => {
  try {
    const formattedReview = formatReviewForSharing(reviewData, restaurantName);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(formattedReview);
      debugLog('✅ Review copied to clipboard');
      return { success: true, text: formattedReview };
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = formattedReview;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      debugLog('✅ Review copied to clipboard (fallback method)');
      return { success: true, text: formattedReview };
    }
  } catch (error) {
    debugLog('❌ Error copying to clipboard:', error);
    return { success: false, error: error.message };
  }
};

// Open Google Reviews link in new tab
export const openGoogleReviews = (restaurantName, placeId = null) => {
  try {
    const link = generateGoogleReviewLink(restaurantName, placeId);
    window.open(link, '_blank', 'noopener,noreferrer');
    debugLog('✅ Opened Google Reviews link:', link);
    return true;
  } catch (error) {
    debugLog('❌ Error opening Google Reviews:', error);
    return false;
  }
};

// Utility function to validate review data
export const validateReviewData = (reviewData, user) => {
  const errors = [];
  const userId = getUserId(user);
  
  if (!userId) {
    errors.push('User not authenticated or user ID not found');
  }
  
  if (!reviewData) {
    errors.push('Review data is missing');
  }
  
  if (reviewData && !reviewData.summary) {
    errors.push('Review summary is required');
  }
  
  if (reviewData && (!reviewData.sentiment_score || reviewData.sentiment_score < 1 || reviewData.sentiment_score > 5)) {
    errors.push('Valid sentiment score (1-5) is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export default object with all functions
export default {
  saveReview,
  getUserReviews,
  updateReview,
  deleteReview,
  testReviewPermissions,
  validateReviewData,
  generateGoogleReviewLink,
  formatReviewForSharing,
  copyReviewToClipboard,
  openGoogleReviews,
  getUserId,
  cleanDataForFirestore
};