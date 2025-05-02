// src/services/reviewService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';

// Save a review to Firestore
export const saveReview = async (reviewData, customerId, customerInfo) => {
  try {
    // Generate a unique ID
    const reviewId = uuidv4();
    
    // Add metadata
    const enhancedReviewData = {
      ...reviewData,
      review_id: reviewId,
      timestamp: serverTimestamp(),
      customer_id: customerId,
      customer_name: customerInfo.name || 'Anonymous',
      customer_email: customerInfo.email || '',
      customer_phone: customerInfo.phone || ''
    };
    
    // Handle nested lists - convert to strings for Firestore if needed
    for (const key in enhancedReviewData) {
      if (Array.isArray(enhancedReviewData[key])) {
        enhancedReviewData[key] = enhancedReviewData[key].join(', ');
      }
    }
    
    // Save to Firestore
    const reviewsCollection = collection(db, 'reviews');
    await addDoc(reviewsCollection, enhancedReviewData);
    
    return reviewId;
  } catch (error) {
    console.error('Error saving review:', error);
    throw new Error(`Failed to save review: ${error.message}`);
  }
};

// Get reviews for a specific restaurant
export const getReviewsByRestaurant = async (restaurantId, reviewLimit = null) => {
  try {
    const reviewsCollection = collection(db, 'reviews');
    let reviewsQuery = query(
      reviewsCollection,
      where('restaurant_id', '==', restaurantId),
      orderBy('timestamp', 'desc')
    );
    
    if (reviewLimit) {
      reviewsQuery = query(reviewsQuery, limit(reviewLimit));
    }
    
    const querySnapshot = await getDocs(reviewsQuery);
    
    const reviews = [];
    querySnapshot.forEach((doc) => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    
    return reviews;
  } catch (error) {
    console.error('Error getting reviews:', error);
    throw new Error(`Failed to get reviews: ${error.message}`);
  }
};

// Get reviews by a specific user
export const getReviewsByUser = async (userId, restaurantId = null, reviewLimit = null) => {
  try {
    const reviewsCollection = collection(db, 'reviews');
    let reviewsQuery;
    
    if (restaurantId) {
      reviewsQuery = query(
        reviewsCollection,
        where('customer_id', '==', userId),
        where('restaurant_id', '==', restaurantId),
        orderBy('timestamp', 'desc')
      );
    } else {
      reviewsQuery = query(
        reviewsCollection,
        where('customer_id', '==', userId),
        orderBy('timestamp', 'desc')
      );
    }
    
    if (reviewLimit) {
      reviewsQuery = query(reviewsQuery, limit(reviewLimit));
    }
    
    const querySnapshot = await getDocs(reviewsQuery);
    
    const reviews = [];
    querySnapshot.forEach((doc) => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    
    return reviews;
  } catch (error) {
    console.error('Error getting user reviews:', error);
    throw new Error(`Failed to get user reviews: ${error.message}`);
  }
};

// Save audio file to Firebase Storage
export const saveAudioToStorage = async (audioBlob, filename) => {
  try {
    const storageRef = ref(storage, `audio_recordings/${filename}`);
    const uploadResult = await uploadBytes(storageRef, audioBlob);
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    
    return downloadUrl;
  } catch (error) {
    console.error('Error saving audio to storage:', error);
    throw new Error(`Failed to save audio: ${error.message}`);
  }
};

// Generate Google Review link with pre-filled content
export const generateGoogleReviewLink = (reviewData, placeId) => {
  try {
    // Extract key components from the review
    const summary = reviewData.summary || '';
    const foodQuality = reviewData.food_quality || '';
    const service = reviewData.service || '';
    const atmosphere = reviewData.atmosphere || '';
    const music = reviewData.music_and_entertainment || '';
    
    // Create a formatted review text
    let reviewText = `${summary}\n\n`;
    
    if (foodQuality && foodQuality !== 'N/A') {
      reviewText += `Food: ${foodQuality}\n`;
    }
    if (service && service !== 'N/A') {
      reviewText += `Service: ${service}\n`;
    }
    if (atmosphere && atmosphere !== 'N/A') {
      reviewText += `Atmosphere: ${atmosphere}\n`;
    }
    if (music && music !== 'N/A') {
      reviewText += `Music & Entertainment: ${music}\n`;
    }
    
    // Add specific points if available
    const specificPoints = reviewData.specific_points || [];
    if (specificPoints.length > 0) {
      reviewText += '\nHighlights:\n';
      
      // Handle array or string format
      if (Array.isArray(specificPoints)) {
        specificPoints.forEach(point => {
          if (point && point !== 'N/A') {
            reviewText += `- ${point}\n`;
          }
        });
      } else if (typeof specificPoints === 'string') {
        // Handle comma-separated string
        specificPoints.split(',').forEach(point => {
          const cleanPoint = point.trim().replace(/^["']|["']$/g, ''); // Remove quotes
          if (cleanPoint && cleanPoint !== 'N/A') {
            reviewText += `- ${cleanPoint}\n`;
          }
        });
      }
    }
    
    // URL encode the review text
    const encodedReview = encodeURIComponent(reviewText);
    
    // Create the Google review URL with the place ID and pre-filled review
    return `https://search.google.com/local/writereview?placeid=${placeId}&review=${encodedReview}`;
  } catch (error) {
    console.error('Error generating Google review link:', error);
    return null;
  }
};

// Format review data for sharing as text
export const formatReviewForSharing = (reviewData) => {
  try {
    // Extract key components from the review
    const summary = reviewData.summary || '';
    const foodQuality = reviewData.food_quality || '';
    const service = reviewData.service || '';
    const atmosphere = reviewData.atmosphere || '';
    const music = reviewData.music_and_entertainment || '';
    
    // Create a formatted review text
    let reviewText = `${summary}\n\n`;
    
    if (foodQuality && foodQuality !== 'N/A') {
      reviewText += `Food: ${foodQuality}\n`;
    }
    if (service && service !== 'N/A') {
      reviewText += `Service: ${service}\n`;
    }
    if (atmosphere && atmosphere !== 'N/A') {
      reviewText += `Atmosphere: ${atmosphere}\n`;
    }
    if (music && music !== 'N/A') {
      reviewText += `Music & Entertainment: ${music}\n`;
    }
    
    // Add specific points if available
    const specificPoints = reviewData.specific_points || [];
    if (specificPoints.length > 0 || (typeof specificPoints === 'string' && specificPoints.length > 0)) {
      reviewText += '\nHighlights:\n';
      
      // Handle array or string format
      if (Array.isArray(specificPoints)) {
        specificPoints.forEach(point => {
          if (point && point !== 'N/A') {
            reviewText += `- ${point}\n`;
          }
        });
      } else if (typeof specificPoints === 'string') {
        // Handle comma-separated string
        specificPoints.split(',').forEach(point => {
          const cleanPoint = point.trim().replace(/^["']|["']$/g, ''); // Remove quotes
          if (cleanPoint && cleanPoint !== 'N/A') {
            reviewText += `- ${cleanPoint}\n`;
          }
        });
      }
    }
    
    return reviewText;
  } catch (error) {
    console.error('Error formatting review for sharing:', error);
    return 'Error formatting review';
  }
};