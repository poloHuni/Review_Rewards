// src/pages/RecordFeedback.js
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getRestaurantById, getRestaurantByNameOrSlug } from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import FeedbackForm from '../components/Feedback/FeedbackForm';
import { slugToReadable } from '../utils/stringUtils';

const RecordFeedback = () => {
  const { restaurantName } = useParams(); // Get restaurant name from URL path
  const [searchParams] = useSearchParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        let restaurantData = null;
        
        if (restaurantName) {
          // If restaurant name is in the URL path, find by name/slug
          restaurantData = await getRestaurantByNameOrSlug(restaurantName);
        } else {
          // Fallback to getting by ID from query params if no name in path
          const restaurantId = searchParams.get('restaurant_id') || 'default_restaurant';
          restaurantData = await getRestaurantById(restaurantId);
        }
        
        if (restaurantData) {
          setRestaurant(restaurantData);
        } else {
          // If restaurant not found and we had a name, show a friendly error
          if (restaurantName) {
            setError(`Restaurant "${slugToReadable(restaurantName)}" not found. Please check the name or select a restaurant from the home page.`);
          } else {
            setError('Restaurant not found. Please select a restaurant from the home page.');
          }
        }
      } catch (err) {
        console.error('Error fetching restaurant:', err);
        setError(`Failed to load restaurant data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurantData();
  }, [restaurantName, searchParams]);
  
  // If still loading, display a loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If error occurred, display error message
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-red-900 rounded-lg text-white">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-4 px-4 py-2 bg-white text-red-900 font-medium rounded-md hover:bg-gray-200"
        >
          Return to Home
        </button>
      </div>
    );
  }
  
  // If user is not authenticated, redirect to login
  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-yellow-900 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
        <p className="text-yellow-100 mb-4">
          Please log in to submit feedback. Your feedback is associated with your account.
        </p>
        <a 
          href={`/login?redirect=${window.location.pathname}`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
        >
          Log In
        </a>
      </div>
    );
  }
  
  const restaurantDisplayName = restaurant?.name || slugToReadable(restaurantName) || 'Restaurant';
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Feedback for {restaurantDisplayName}
        </h1>
        <p className="text-gray-400">
          Please share your dining experience to help us improve our service.
        </p>
      </div>
      
      <FeedbackForm 
        restaurantId={restaurant?.restaurant_id || 'default_restaurant'} 
        restaurantName={restaurantDisplayName}
        placeId={restaurant?.google_place_id}
      />
    </div>
  );
};

export default RecordFeedback;