// src/pages/OwnerDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getRestaurantsByOwner, 
  saveRestaurant, 
  deleteRestaurant, 
  getRestaurantAnalytics,
  verifyOwnerPassword 
} from '../services/restaurantService';
import StarRating from '../components/Reviews/StarRating';
import { formatDate } from '../utils/dateUtils';

const OwnerDashboard = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('restaurants');
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Form state
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [restaurantPhone, setRestaurantPhone] = useState('');
  const [restaurantPlaceId, setRestaurantPlaceId] = useState('');
  const [formError, setFormError] = useState('');
  
  // Password verification
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { currentUser, isOwner } = useAuth();
  
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        
        if (!currentUser || !isOwner) {
          throw new Error('Unauthorized access');
        }
        
        const ownerId = currentUser.uid || currentUser.user_id;
        const restaurantsData = await getRestaurantsByOwner(ownerId);
        
        setRestaurants(restaurantsData);
        
        // Set first restaurant as selected for analytics
        if (restaurantsData.length > 0 && !selectedRestaurantId) {
          setSelectedRestaurantId(restaurantsData[0].restaurant_id);
        }
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (passwordVerified) {
      fetchRestaurants();
    }
  }, [currentUser, isOwner, passwordVerified, selectedRestaurantId]);
  
  // Fetch analytics when selected restaurant changes
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedRestaurantId || !passwordVerified) return;
      
      try {
        setAnalyticsLoading(true);
        const analyticsData = await getRestaurantAnalytics(selectedRestaurantId);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        // Don't set main error, just log it
      } finally {
        setAnalyticsLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [selectedRestaurantId, passwordVerified]);
  
  const handleSubmitPassword = (e) => {
    e.preventDefault();
    
    if (!ownerPassword) {
      setPasswordError('Password is required');
      return;
    }
    
    if (verifyOwnerPassword(ownerPassword)) {
      setPasswordVerified(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };
  
  // Reset form fields
  const resetForm = () => {
    setRestaurantName('');
    setRestaurantAddress('');
    setRestaurantPhone('');
    setRestaurantPlaceId('');
    setEditingRestaurant(null);
    setFormError('');
  };
  
  // Set form fields from restaurant data
  const populateForm = (restaurant) => {
    setEditingRestaurant(restaurant);
    setRestaurantName(restaurant.name || '');
    setRestaurantAddress(restaurant.address || '');
    setRestaurantPhone(restaurant.phone || '');
    setRestaurantPlaceId(restaurant.google_place_id || '');
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!restaurantName) {
      setFormError('Restaurant name is required');
      return;
    }
    
    try {
      const restaurantData = {
        name: restaurantName,
        address: restaurantAddress,
        phone: restaurantPhone,
        google_place_id: restaurantPlaceId
      };
      
      // If editing, add restaurant_id
      if (editingRestaurant) {
        restaurantData.restaurant_id = editingRestaurant.restaurant_id;
      }
      
      const ownerId = currentUser.uid || currentUser.user_id;
      await saveRestaurant(restaurantData, ownerId);
      
      // Refresh restaurants list
      const updatedRestaurants = await getRestaurantsByOwner(ownerId);
      setRestaurants(updatedRestaurants);
      
      // Reset form
      resetForm();
      
      // Show success message
      alert(editingRestaurant ? 'Restaurant updated successfully' : 'Restaurant added successfully');
    } catch (err) {
      console.error('Error saving restaurant:', err);
      setFormError(`Failed to save restaurant: ${err.message}`);
    }
  };
  
  // Handle restaurant deletion
  const handleDeleteRestaurant = async (restaurantId) => {
    try {
      await deleteRestaurant(restaurantId);
      
      // Refresh restaurants list
      const ownerId = currentUser.uid || currentUser.user_id;
      const updatedRestaurants = await getRestaurantsByOwner(ownerId);
      setRestaurants(updatedRestaurants);
      
      // Clear selected restaurant if it was deleted
      if (selectedRestaurantId === restaurantId) {
        setSelectedRestaurantId(updatedRestaurants.length > 0 ? updatedRestaurants[0].restaurant_id : null);
      }
      
      // Reset confirmDelete
      setConfirmDelete(null);
      
      // Show success message
      alert('Restaurant deleted successfully');
    } catch (err) {
      console.error('Error deleting restaurant:', err);
      setError(`Failed to delete restaurant: ${err.message}`);
    }
  };
  
  // If password not verified, show password form
  if (!passwordVerified) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">Owner Verification</h2>
            
            {passwordError && (
              <div className="mb-4 p-3 bg-red-900 text-white rounded-md">
                {passwordError}
              </div>
            )}
            
            <form onSubmit={handleSubmitPassword}>
              <div className="mb-4">
                <label htmlFor="ownerPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Owner Password
                </label>
                <input
                  id="ownerPassword"
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter owner password"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Verify
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Error state
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
  
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Owner Dashboard</h1>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-700">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('restaurants')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'restaurants'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Restaurants
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'analytics'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Reviews Analytics
          </button>
        </nav>
      </div>
      
      {/* Restaurants Tab */}
      {activeTab === 'restaurants' && (
        <div>
          {/* Restaurants List */}
          <div className="bg-gray-800 rounded-lg shadow-lg mb-8">
            <div className="p-6">
              <h2 className="text-xl font-medium text-white mb-4">Your Restaurants</h2>
              
              {restaurants.length === 0 ? (
                <p className="text-gray-400">You don't have any restaurants yet. Add one below.</p>
              ) : (
                <div className="space-y-4">
                  {restaurants.map((restaurant) => (
                    <div key={restaurant.restaurant_id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-white mb-1">{restaurant.name}</h3>
                          <p className="text-gray-400 text-sm">ID: {restaurant.restaurant_id}</p>
                          {restaurant.address && (
                            <p className="text-gray-400 text-sm">Address: {restaurant.address}</p>
                          )}
                          {restaurant.phone && (
                            <p className="text-gray-400 text-sm">Phone: {restaurant.phone}</p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2 mt-4 md:mt-0">
                          <button
                            onClick={() => populateForm(restaurant)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDelete(restaurant.restaurant_id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      {/* Delete confirmation */}
                      {confirmDelete === restaurant.restaurant_id && (
                        <div className="mt-4 p-4 bg-red-900 rounded-lg">
                          <p className="text-white mb-3">
                            Are you sure you want to delete <strong>{restaurant.name}</strong>?
                            This action cannot be undone.
                          </p>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleDeleteRestaurant(restaurant.restaurant_id)}
                              className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-sm"
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Add/Edit Restaurant Form */}
          <div className="bg-gray-800 rounded-lg shadow-lg">
            <div className="p-6">
              <h2 className="text-xl font-medium text-white mb-4">
                {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
              </h2>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-900 text-white rounded-md">
                  {formError}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-300 mb-1">
                    Restaurant Name
                  </label>
                  <input
                    id="restaurantName"
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter restaurant name"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="restaurantAddress" className="block text-sm font-medium text-gray-300 mb-1">
                    Address
                  </label>
                  <input
                    id="restaurantAddress"
                    type="text"
                    value={restaurantAddress}
                    onChange={(e) => setRestaurantAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter restaurant address"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="restaurantPhone" className="block text-sm font-medium text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="restaurantPhone"
                    type="text"
                    value={restaurantPhone}
                    onChange={(e) => setRestaurantPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter restaurant phone"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="restaurantPlaceId" className="block text-sm font-medium text-gray-300 mb-1">
                    Google Place ID (for reviews)
                  </label>
                  <input
                    id="restaurantPlaceId"
                    type="text"
                    value={restaurantPlaceId}
                    onChange={(e) => setRestaurantPlaceId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Google Place ID"
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    This is used to link directly to Google Reviews. You can find your Place ID using the Google Places API.
                  </p>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    {editingRestaurant ? 'Update Restaurant' : 'Add Restaurant'}
                  </button>
                  
                  {editingRestaurant && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          {/* Restaurant selector */}
          {restaurants.length > 0 ? (
            <div className="bg-gray-800 rounded-lg shadow-lg mb-8">
              <div className="p-6">
                <h2 className="text-xl font-medium text-white mb-4">Select Restaurant</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {restaurants.map((restaurant) => (
                    <div
                      key={restaurant.restaurant_id}
                      onClick={() => setSelectedRestaurantId(restaurant.restaurant_id)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedRestaurantId === restaurant.restaurant_id
                          ? 'bg-blue-900 border-2 border-blue-500'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <h3 className="font-medium text-white mb-1">{restaurant.name}</h3>
                      {restaurant.address && (
                        <p className="text-gray-400 text-sm truncate">{restaurant.address}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg shadow-lg mb-8 p-6">
              <p className="text-gray-400">
                You need to add a restaurant before you can view analytics.
              </p>
            </div>
          )}
          
          {/* Analytics display */}
          {selectedRestaurantId && (
            <div className="bg-gray-800 rounded-lg shadow-lg">
              <div className="p-6">
                <h2 className="text-xl font-medium text-white mb-6">
                  Analytics for {restaurants.find(r => r.restaurant_id === selectedRestaurantId)?.name || 'Restaurant'}
                </h2>
                
                {analyticsLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : !analytics ? (
                  <p className="text-gray-400">
                    No analytics data available. This could be because there are no reviews yet.
                  </p>
                ) : (
                  <div>
                    {/* Summary metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm font-medium mb-1">Total Reviews</h3>
                        <p className="text-3xl font-bold text-white">{analytics.totalReviews}</p>
                      </div>
                      
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm font-medium mb-1">Average Rating</h3>
                        <div className="flex items-center">
                          <p className="text-3xl font-bold text-white mr-2">
                            {analytics.averageSentiment.toFixed(1)}
                          </p>
                          <StarRating rating={analytics.averageSentiment} size="sm" />
                        </div>
                      </div>
                      
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm font-medium mb-1">Recent Trend</h3>
                        {analytics.recentTrend ? (
                          <div>
                            <div className="flex items-center">
                              <p className="text-2xl font-bold text-white mr-2">
                                {analytics.recentTrend.average.toFixed(1)}
                              </p>
                              <span 
                                className={`text-sm font-medium ${
                                  analytics.recentTrend.delta > 0 
                                    ? 'text-green-500' 
                                    : analytics.recentTrend.delta < 0 
                                      ? 'text-red-500' 
                                      : 'text-gray-400'
                                }`}
                              >
                                {analytics.recentTrend.delta > 0 && '+'}
                                {analytics.recentTrend.delta.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-gray-400 text-xs">Based on last 5 reviews</p>
                          </div>
                        ) : (
                          <p className="text-gray-400">Not enough data</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Sentiment distribution */}
                    <div className="mb-8">
                      <h3 className="text-lg font-medium text-white mb-4">Rating Distribution</h3>
                      
                      <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = analytics.sentimentDistribution[rating] || 0;
                          const percentage = analytics.totalReviews 
                            ? Math.round((count / analytics.totalReviews) * 100) 
                            : 0;
                            
                          return (
                            <div key={rating} className="flex items-center">
                              <div className="w-16 flex items-center">
                                <span className="text-white mr-2">{rating}</span>
                                <span className="text-yellow-400">★</span>
                              </div>
                              
                              <div className="flex-1 mx-4 h-5 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              
                              <div className="w-16 text-right">
                                <span className="text-white">{count}</span>
                                <span className="text-gray-400 ml-1">({percentage}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Recent reviews */}
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Recent Reviews</h3>
                      
                      {analytics.reviews && analytics.reviews.length > 0 ? (
                        <div className="space-y-4">
                          {analytics.reviews.map((review) => (
                            <div key={review.id || review.review_id} className="bg-gray-700 p-4 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium text-white">
                                    {review.customer_name || 'Anonymous'}
                                  </h4>
                                  <p className="text-gray-400 text-sm">
                                    {review.timestamp ? formatDate(review.timestamp) : 'Unknown date'}
                                  </p>
                                </div>
                                
                                <StarRating rating={review.sentiment_score} showValue={true} />
                              </div>
                              
                              <p className="text-gray-300 mb-2">{review.summary}</p>
                              
                              {/* Expandable details */}
                              <details className="text-sm">
                                <summary className="text-blue-400 cursor-pointer">View details</summary>
                                <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-600">
                                  {review.food_quality && review.food_quality !== 'N/A' && (
                                    <p><span className="text-gray-400">Food:</span> {review.food_quality}</p>
                                  )}
                                  {review.service && review.service !== 'N/A' && (
                                    <p><span className="text-gray-400">Service:</span> {review.service}</p>
                                  )}
                                  {review.atmosphere && review.atmosphere !== 'N/A' && (
                                    <p><span className="text-gray-400">Atmosphere:</span> {review.atmosphere}</p>
                                  )}
                                  {review.music_and_entertainment && review.music_and_entertainment !== 'N/A' && (
                                    <p><span className="text-gray-400">Music:</span> {review.music_and_entertainment}</p>
                                  )}
                                  
                                  {/* Key points */}
                                  {review.specific_points && (
                                    <div className="mt-2">
                                      <p className="text-gray-400">Key Points:</p>
                                      <ul className="list-disc list-inside text-gray-300 pl-2">
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
                                        ) : null}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  {/* Audio playback if available */}
                                  {review.audio_url && (
                                    <div className="mt-2">
                                      <p className="text-gray-400 mb-1">Original Recording:</p>
                                      <audio src={review.audio_url} controls className="w-full" />
                                    </div>
                                  )}
                                </div>
                              </details>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">No reviews yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;