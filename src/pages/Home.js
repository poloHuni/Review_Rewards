// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllRestaurants } from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  
  const { currentUser, isOwner } = useAuth();
  
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const restaurantsData = await getAllRestaurants();
        setRestaurants(restaurantsData);
        
        // Set default selected restaurant if available
        if (restaurantsData.length > 0) {
          setSelectedRestaurant(restaurantsData[0]);
        }
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError('Failed to load restaurants. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurants();
  }, []);
  
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
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-white text-red-900 font-medium rounded-md hover:bg-gray-200"
        >
          Retry
        </button>
      </div>
    );
  }
  
  // If no restaurants found, display a message
  if (restaurants.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4">No Restaurants Found</h2>
        
        {isOwner ? (
          <div>
            <p className="text-gray-300 mb-4">
              As an owner, you can add your first restaurant in the dashboard.
            </p>
            <Link 
              to="/dashboard" 
              className="inline-block px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <p className="text-gray-300">
            There are no restaurants available for feedback at this time. Please check back later.
          </p>
        )}
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto mt-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white">Restaurant Feedback Portal</h1>
        <p className="text-gray-400 mt-2">
          Share your dining experience and help us improve our service
        </p>
      </div>
      
      {/* Featured Restaurant Section */}
      {selectedRestaurant && (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-10">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-2">{selectedRestaurant.name}</h2>
            
            <div className="flex flex-col md:flex-row md:items-start mb-6">
              <div className="md:w-2/3 mb-6 md:mb-0 md:mr-6">
                <div className="aspect-w-16 aspect-h-9 bg-gray-700 rounded-lg overflow-hidden">
                  {/* Placeholder for restaurant image */}
                  <div className="w-full h-64 bg-gray-700 flex items-center justify-center">
                    <span className="text-6xl">🍽️</span>
                  </div>
                </div>
              </div>
              
              <div className="md:w-1/3">
                <div className="bg-gray-700 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-medium text-white mb-2">Restaurant Info</h3>
                  <p className="text-gray-300 mb-2">
                    <span className="text-gray-400">Address:</span> {selectedRestaurant.address || 'No address provided'}
                  </p>
                  <p className="text-gray-300 mb-2">
                    <span className="text-gray-400">Phone:</span> {selectedRestaurant.phone || 'No phone provided'}
                  </p>
                </div>
                
                {currentUser ? (
                  <Link
                    to={`/feedback?restaurant_id=${selectedRestaurant.restaurant_id}&restaurant_name=${encodeURIComponent(selectedRestaurant.name)}`}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center justify-center"
                  >
                    <span className="mr-2">🎙️</span> Leave Feedback
                  </Link>
                ) : (
                  <Link
                    to={`/login?restaurant_id=${selectedRestaurant.restaurant_id}&restaurant_name=${encodeURIComponent(selectedRestaurant.name)}`}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center justify-center"
                  >
                    <span className="mr-2">🔑</span> Login to Leave Feedback
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* All Restaurants Section */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">All Restaurants</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <div 
                key={restaurant.restaurant_id} 
                className={`bg-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer border-2 ${
                  selectedRestaurant && selectedRestaurant.restaurant_id === restaurant.restaurant_id
                    ? 'border-blue-500'
                    : 'border-transparent'
                }`}
                onClick={() => setSelectedRestaurant(restaurant)}
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-600">
                  {/* Placeholder for restaurant image */}
                  <div className="w-full h-40 bg-gray-600 flex items-center justify-center">
                    <span className="text-4xl">🍽️</span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-medium text-white mb-1">{restaurant.name}</h3>
                  <p className="text-gray-400 text-sm truncate">{restaurant.address || 'No address provided'}</p>
                  
                  <div className="mt-4 flex justify-end">
                    {currentUser ? (
                      <Link
                        to={`/feedback?restaurant_id=${restaurant.restaurant_id}&restaurant_name=${encodeURIComponent(restaurant.name)}`}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                      >
                        Leave Feedback
                      </Link>
                    ) : (
                      <Link
                        to={`/login?restaurant_id=${restaurant.restaurant_id}&restaurant_name=${encodeURIComponent(restaurant.name)}`}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                      >
                        Login to Review
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mt-10">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6 text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎙️</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Record Your Feedback</h3>
              <p className="text-gray-400">
                Share your dining experience through voice recording or text input
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">AI Analysis</h3>
              <p className="text-gray-400">
                Our system analyzes your feedback to extract key insights
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Improve Service</h3>
              <p className="text-gray-400">
                We use your feedback to enhance your future dining experiences
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;