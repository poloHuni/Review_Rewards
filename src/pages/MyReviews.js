// src/pages/MyReviews.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReviewsByUser } from '../services/reviewService';
import { getAllRestaurants } from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';

// Import the star rating component 
import StarRating from '../components/Reviews/StarRating';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all restaurants
        const restaurantsData = await getAllRestaurants();
        setRestaurants(restaurantsData);
        
        // Get user ID
        const userId = currentUser?.uid || currentUser?.user_id;
        
        if (!userId) {
          throw new Error('User ID not found');
        }
        
        // Fetch reviews from this user
        const reviewsData = await getReviewsByUser(userId);
        
        // Sort by timestamp (newest first)
        const sortedReviews = reviewsData.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp.seconds * 1000) : new Date(0);
          const dateB = b.timestamp ? new Date(b.timestamp.seconds * 1000) : new Date(0);
          return dateB - dateA;
        });
        
        setReviews(sortedReviews);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);
  
  // Get restaurant name by ID
  const getRestaurantName = (restaurantId) => {
    const restaurant = restaurants.find(r => r.restaurant_id === restaurantId);
    return restaurant ? restaurant.name : 'Unknown Restaurant';
  };
  
  // Filter reviews by selected restaurant
  const filteredReviews = selectedRestaurant
    ? reviews.filter(review => review.restaurant_id === selectedRestaurant)
    : reviews;
  
  // Extract unique restaurant IDs from reviews
  const restaurantIds = [...new Set(reviews.map(review => review.restaurant_id))];
  
  // Display loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Display error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-red-900 rounded-lg text-white">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-white text-red-900 font-medium rounded-md hover:bg-gray-200"
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Handle empty state
  if (reviews.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">My Reviews</h1>
        
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-medium text-white mb-2">No Reviews Yet</h2>
          <p className="text-gray-400 mb-6">
            You haven't shared any feedback yet. Start by reviewing a restaurant!
          </p>
          <Link 
            to="/"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
          >
            Browse Restaurants
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">My Reviews</h1>
      
      {/* Restaurant filter if user has reviews for multiple restaurants */}
      {restaurantIds.length > 1 && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-3">Filter by Restaurant</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedRestaurant(null)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedRestaurant === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All
            </button>
            
            {restaurantIds.map(id => (
              <button
                key={id}
                onClick={() => setSelectedRestaurant(id)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedRestaurant === id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {getRestaurantName(id)}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Reviews list */}
      <div className="space-y-6">
        {filteredReviews.map((review) => (
          <div key={review.id || review.review_id} className="bg-gray-800 rounded-lg overflow-hidden shadow-md">
            <div className="border-b border-gray-700 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-medium text-white">
                  {getRestaurantName(review.restaurant_id)}
                </h3>
                <p className="text-gray-400 text-sm">
                  {review.timestamp ? formatDate(review.timestamp) : 'Unknown date'}
                </p>
              </div>
              
              <div className="flex items-center">
                {typeof review.sentiment_score === 'number' && (
                  <StarRating rating={review.sentiment_score} />
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-white mb-2">Summary</h4>
                <p className="text-gray-300">{review.summary || 'No summary available'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <h5 className="text-sm font-medium text-white mb-1">Food Quality</h5>
                  <p className="text-gray-400 text-sm">{review.food_quality || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg">
                  <h5 className="text-sm font-medium text-white mb-1">Service</h5>
                  <p className="text-gray-400 text-sm">{review.service || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg">
                  <h5 className="text-sm font-medium text-white mb-1">Atmosphere</h5>
                  <p className="text-gray-400 text-sm">{review.atmosphere || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg">
                  <h5 className="text-sm font-medium text-white mb-1">Music & Entertainment</h5>
                  <p className="text-gray-400 text-sm">{review.music_and_entertainment || 'N/A'}</p>
                </div>
              </div>
              
              {/* Key Points Section */}
              {review.specific_points && (
                <div className="mb-4">
                  <h4 className="text-lg font-medium text-white mb-2">Key Points</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {Array.isArray(review.specific_points) ? (
                      review.specific_points.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))
                    ) : typeof review.specific_points === 'string' ? (
                      review.specific_points.split(',').map((point, index) => {
                        const cleanPoint = point.trim().replace(/^['"]|['"]$/g, '');
                        return cleanPoint && cleanPoint !== 'N/A' ? (
                          <li key={index}>{cleanPoint}</li>
                        ) : null;
                      })
                    ) : (
                      <li>No specific points provided</li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* Audio playback if available */}
              {review.audio_url && (
                <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Original Audio Recording</h4>
                  <audio src={review.audio_url} controls className="w-full" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyReviews;