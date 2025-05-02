// src/pages/RecordFeedback.js
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getRestaurantById } from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import FeedbackForm from '../components/Feedback/FeedbackForm';

const RecordFeedback = () => {
  const [searchParams] = useSearchParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        // Get restaurant ID from URL parameters
        const restaurantId = searchParams.get('restaurant_id') || 'default_restaurant';
        
        // Fetch restaurant data
        const restaurantData = await getRestaurantById(restaurantId);
        
        if (restaurantData) {
          setRestaurant(restaurantData);
        } else {
          setError('Restaurant not found. Please select a restaurant from the home page.');
        }
      } catch (err) {
        console.error('Error fetching restaurant:', err);
        setError(`Failed to load restaurant data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurantData();
  }, [searchParams]);
  
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
          href={`/login?restaurant_id=${restaurant?.restaurant_id || 'default_restaurant'}`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
        >
          Log In
        </a>
      </div>
    );
  }
  
  // Use restaurant name from URL or from fetched data
  const restaurantName = searchParams.get('restaurant_name') || restaurant?.name || 'Restaurant';
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Feedback for {restaurantName}
        </h1>
        <p className="text-gray-400">
          Please share your dining experience to help us improve our service.
        </p>
      </div>
      
      <FeedbackForm 
        restaurantId={restaurant?.restaurant_id || 'default_restaurant'} 
        restaurantName={restaurantName}
        placeId={restaurant?.google_place_id}
      />
    </div>
  );
};

export default RecordFeedback;