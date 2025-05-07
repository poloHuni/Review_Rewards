// src/services/restaurantService.js
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';
import { createSlug } from '../utils/stringUtils';

// Get a restaurant by name or slug
export const getRestaurantByNameOrSlug = async (nameOrSlug) => {
  try {
    // Normalize the input
    const slug = createSlug(nameOrSlug);
    
    // Get all restaurants
    const restaurantsCollection = collection(db, 'restaurants');
    const querySnapshot = await getDocs(restaurantsCollection);
    
    let foundRestaurant = null;
    
    // Look for a restaurant with a matching name or slug
    querySnapshot.forEach((doc) => {
      const restaurant = doc.data();
      
      // Check if the name matches when converted to a slug
      if (restaurant.name) {
        const restaurantSlug = createSlug(restaurant.name);
        if (restaurantSlug === slug) {
          foundRestaurant = { 
            id: doc.id, 
            ...restaurant 
          };
        }
      }
    });
    
    return foundRestaurant;
  } catch (error) {
    console.error('Error getting restaurant by name:', error);
    throw new Error(`Failed to get restaurant by name: ${error.message}`);
  }
};


// Get all restaurants
export const getAllRestaurants = async () => {
  try {
    const restaurantsCollection = collection(db, 'restaurants');
    const querySnapshot = await getDocs(restaurantsCollection);
    
    const restaurants = [];
    querySnapshot.forEach((doc) => {
      restaurants.push({ id: doc.id, ...doc.data() });
    });
    
    return restaurants;
  } catch (error) {
    console.error('Error getting restaurants:', error);
    throw new Error(`Failed to get restaurants: ${error.message}`);
  }
};

// Get restaurants by owner ID
export const getRestaurantsByOwner = async (ownerId) => {
  try {
    const restaurantsCollection = collection(db, 'restaurants');
    const restaurantsQuery = query(restaurantsCollection, where('owner_id', '==', ownerId));
    
    const querySnapshot = await getDocs(restaurantsQuery);
    const restaurants = [];
    
    querySnapshot.forEach((doc) => {
      restaurants.push({ id: doc.id, ...doc.data() });
    });
    
    return restaurants;
  } catch (error) {
    console.error('Error getting owner restaurants:', error);
    throw new Error(`Failed to get owner restaurants: ${error.message}`);
  }
};

// Get a restaurant by ID
// src/services/restaurantService.js - updated getRestaurantById function

export const getRestaurantById = async (restaurantId) => {
  try {
    console.log('Fetching restaurant with ID:', restaurantId);
    
    // Handle case when restaurantId is null or undefined
    if (!restaurantId || restaurantId === 'default_restaurant') {
      console.warn('No valid restaurant ID provided, returning default restaurant');
      // Return a default restaurant to prevent errors
      return {
        restaurant_id: 'default_restaurant',
        name: 'Default Restaurant',
        address: '123 Main Street',
        phone: '555-1234',
        google_place_id: ''
      };
    }
    
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);
    
    if (restaurantDoc.exists()) {
      return { id: restaurantDoc.id, ...restaurantDoc.data() };
    } else {
      console.warn('Restaurant not found with ID:', restaurantId);
      // Return a placeholder restaurant rather than null
      return {
        restaurant_id: restaurantId,
        name: 'Restaurant',
        address: '',
        phone: '',
        google_place_id: ''
      };
    }
  } catch (error) {
    console.error('Error getting restaurant:', error);
    throw new Error(`Failed to get restaurant: ${error.message}`);
  }
};
// Create or update a restaurant
export const saveRestaurant = async (restaurantData, ownerId) => {
  try {
    // Generate ID if not provided
    const restaurantId = restaurantData.restaurant_id || uuidv4();
    
    // Add or update additional fields
    const enhancedData = {
      ...restaurantData,
      restaurant_id: restaurantId,
      updated_at: serverTimestamp(),
      owner_id: ownerId
    };
    
    // If it's a new restaurant, add created_at timestamp
    if (!restaurantData.restaurant_id) {
      enhancedData.created_at = serverTimestamp();
    }
    
    // Save to Firestore
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    await setDoc(restaurantRef, enhancedData);
    
    return restaurantId;
  } catch (error) {
    console.error('Error saving restaurant:', error);
    throw new Error(`Failed to save restaurant: ${error.message}`);
  }
};

// Delete a restaurant
export const deleteRestaurant = async (restaurantId) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    await deleteDoc(restaurantRef);
    return true;
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    throw new Error(`Failed to delete restaurant: ${error.message}`);
  }
};

// Verify owner password (for the specified owner)
export const verifyOwnerPassword = (password) => {
  // Hardcoded password as requested in the original code
  const OWNER_PASSWORD = "iownit!!!";
  return password === OWNER_PASSWORD;
};

// Get restaurant analytics
export const getRestaurantAnalytics = async (restaurantId) => {
  try {
    // Get all reviews for this restaurant
    const reviewsCollection = collection(db, 'reviews');
    const reviewsQuery = query(reviewsCollection, where('restaurant_id', '==', restaurantId));
    
    const querySnapshot = await getDocs(reviewsQuery);
    const reviews = [];
    
    querySnapshot.forEach((doc) => {
      reviews.push(doc.data());
    });
    
    // Calculate analytics
    const totalReviews = reviews.length;
    
    // Calculate average sentiment
    const sentiments = reviews
      .map(r => r.sentiment_score)
      .filter(score => typeof score === 'number' && !isNaN(score));
    
    const avgSentiment = sentiments.length > 0
      ? sentiments.reduce((sum, score) => sum + score, 0) / sentiments.length
      : 0;
    
    // Calculate recent trend (last 5 reviews)
    let recentTrend = null;
    if (totalReviews >= 5) {
      const sortedReviews = [...reviews].sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp.seconds * 1000) : new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp.seconds * 1000) : new Date(0);
        return dateB - dateA;
      });
      
      const recentSentiments = sortedReviews
        .slice(0, 5)
        .map(r => r.sentiment_score)
        .filter(score => typeof score === 'number' && !isNaN(score));
      
      const recentAvg = recentSentiments.length > 0
        ? recentSentiments.reduce((sum, score) => sum + score, 0) / recentSentiments.length
        : 0;
      
      recentTrend = {
        average: recentAvg,
        delta: recentAvg - avgSentiment
      };
    }
    
    // Calculate sentiment distribution
    const sentimentDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    reviews.forEach(review => {
      const score = review.sentiment_score;
      if (typeof score === 'number' && score >= 1 && score <= 5) {
        sentimentDistribution[Math.round(score)]++;
      }
    });
    
    // Return analytics
    return {
      totalReviews,
      averageSentiment: avgSentiment,
      recentTrend,
      sentimentDistribution,
      reviews: reviews.slice(0, 10) // Return 10 most recent reviews
    };
  } catch (error) {
    console.error('Error getting restaurant analytics:', error);
    throw new Error(`Failed to get restaurant analytics: ${error.message}`);
  }
};