// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllRestaurants } from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import { createSlug } from '../utils/stringUtils';
import { MessageSquare, BarChart3, Mic, FileText, ArrowRight, Star, MapPin, Phone, ExternalLink, Users, TrendingUp, Shield } from 'lucide-react';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  
  const { currentUser, isOwner } = useAuth();
  const navigate = useNavigate();
  
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
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="body-md">Loading restaurants...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="glass-card rounded-2xl p-8 text-center status-error">
          <h2 className="heading-md mb-4">Unable to Load Restaurants</h2>
          <p className="body-md mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary focus-ring"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // No restaurants state
  if (restaurants.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="text-6xl mb-6">🏪</div>
          <h2 className="heading-md mb-4">No Restaurants Available</h2>
          
          {isOwner ? (
            <div>
              <p className="body-md mb-6">
                As a restaurant owner, you can add your first restaurant to start collecting feedback.
              </p>
              <Link to="/dashboard" className="btn-primary focus-ring">
                <BarChart3 size={18} className="mr-2" />
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div>
              <p className="body-md mb-6">
                No restaurants are currently available for review. Please check back later.
              </p>
              <Link to="/my-reviews" className="btn-secondary focus-ring">
                View My Reviews
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="heading-xl mb-6">
            Share Your Dining Experience
          </h1>
          <p className="body-lg max-w-2xl mx-auto">
            Help restaurants improve by sharing your honest feedback. Your voice matters in creating better dining experiences for everyone.
          </p>
          
          {currentUser ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/feedback" className="btn-primary text-lg px-8 py-4 focus-ring">
                <MessageSquare size={20} className="mr-2" />
                Leave Feedback
              </Link>
              <Link to="/my-reviews" className="btn-secondary text-lg px-8 py-4 focus-ring">
                View My Reviews
              </Link>
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-lg px-8 py-4 focus-ring">
              Get Started
              <ArrowRight size={20} className="ml-2" />
            </Link>
          )}
        </div>
      </section>

      {/* Featured Restaurant Section */}
      {selectedRestaurant && (
        <section>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-lg">Featured Restaurant</h2>
                <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium border border-blue-500/30">
                  Now Open for Feedback
                </div>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Restaurant Image - UPDATED FOR YOUR ACTUAL FILES */}
                <div className="lg:col-span-1">
                  <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden border border-white/10 relative">
                    <img
                      src={`/images/restaurants/restaurant${selectedRestaurant.restaurant_id}.jpg`}
                      alt={`${selectedRestaurant.name} restaurant`}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        // Fallback 1: Try your default-restaurant.jpg
                        console.log(`Restaurant${selectedRestaurant.restaurant_id}.jpg not found, trying default`);
                        e.target.src = '/images/restaurants/default-restaurant.jpg';
                        e.target.onerror = function() {
                          // Fallback 2: Hide image and show emoji
                          console.log('Default restaurant image not found, showing emoji fallback');
                          e.target.style.display = 'none';
                          e.target.parentElement.querySelector('.emoji-fallback').style.display = 'flex';
                        };
                      }}
                    />
                    
                    {/* Final fallback - emoji */}
                    <div className="emoji-fallback hidden absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl">🍽️</span>
                    </div>
                  </div>
                </div>
                
                {/* Restaurant Info */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="heading-md mb-3">{selectedRestaurant.name}</h3>
                    <div className="space-y-2">
                      {selectedRestaurant.address && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <MapPin size={16} className="text-slate-400" />
                          <span className="body-md">{selectedRestaurant.address}</span>
                        </div>
                      )}
                      {selectedRestaurant.phone && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Phone size={16} className="text-slate-400" />
                          <span className="body-md">{selectedRestaurant.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    {currentUser ? (
                      <>
                        <Link
                          to={`/feedback/${createSlug(selectedRestaurant.name)}`}
                          className="btn-primary flex items-center justify-center gap-2 focus-ring"
                        >
                          <MessageSquare size={18} />
                          Leave Feedback
                        </Link>
                        <Link
                          to={`/my-reviews`}
                          className="btn-secondary flex items-center justify-center gap-2 focus-ring"
                        >
                          <FileText size={18} />
                          My Reviews
                        </Link>
                      </>
                    ) : (
                      <Link
                        to={`/login?restaurant_id=${selectedRestaurant.restaurant_id}`}
                        className="btn-primary flex items-center justify-center gap-2 focus-ring sm:col-span-2"
                      >
                        Sign In to Leave Feedback
                        <ArrowRight size={18} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* All Restaurants Grid */}
      <section>
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="heading-lg">All Restaurants</h2>
              <div className="text-slate-400 body-sm">
                {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} available
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <div 
                  key={restaurant.restaurant_id} 
                  className={`glass-card-subtle rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                    selectedRestaurant && selectedRestaurant.restaurant_id === restaurant.restaurant_id
                      ? 'ring-2 ring-blue-500/50 bg-blue-500/5'
                      : 'hover:bg-white/5'
                  }`}
                  onClick={() => setSelectedRestaurant(restaurant)}
                >
                  {/* Restaurant Image - UPDATED FOR YOUR ACTUAL FILES */}
                  <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden relative">
                    {/* Try to load restaurant-specific image based on restaurant_id */}
                    <img
                      src={`/images/restaurants/restaurant${restaurant.restaurant_id}.jpg`}
                      alt={`${restaurant.name} restaurant`}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        // Fallback 1: Try your default-restaurant.jpg
                        console.log(`Restaurant${restaurant.restaurant_id}.jpg not found, trying default`);
                        e.target.src = '/images/restaurants/default-restaurant.jpg';
                        e.target.onerror = function() {
                          // Fallback 2: Hide image and show emoji
                          console.log('Default restaurant image not found, showing emoji fallback');
                          e.target.style.display = 'none';
                          e.target.parentElement.querySelector('.emoji-fallback').style.display = 'flex';
                        };
                      }}
                    />
                    
                    {/* Final fallback - emoji */}
                    <div className="emoji-fallback hidden absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl">🍽️</span>
                    </div>
                    
                    {/* Image overlay for better text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                    
                    {/* Optional: Restaurant status badge */}
                    {restaurant.status && (
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          restaurant.status === 'open' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {restaurant.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Restaurant Info */}
                  <div className="p-6">
                    <h3 className="heading-sm mb-2">{restaurant.name}</h3>
                    <p className="body-sm mb-4 line-clamp-2">
                      {restaurant.description || restaurant.address || 'Experience great food and atmosphere'}
                    </p>
                    
                    {/* Restaurant details */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>📍</span>
                        <span className="truncate">{restaurant.address || 'Location available'}</span>
                      </div>
                      
                      {/* Rating display (if you have ratings) */}
                      {restaurant.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">⭐</span>
                          <span className="text-sm font-medium text-white">{restaurant.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      {currentUser ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/feedback', { state: { restaurant } });
                          }}
                          className="btn-primary text-sm px-4 py-2"
                        >
                          Leave Review
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/login');
                          }}
                          className="btn-secondary text-sm px-4 py-2"
                        >
                          Sign in to Review
                        </button>
                      )}
                      
                      {/* Additional info button */}
                      <button 
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add modal or expand functionality here
                          console.log('Show more info for:', restaurant.name);
                        }}
                      >
                        <span className="text-slate-400 text-sm">More Info</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-12">
              <h2 className="heading-lg mb-4">Why Your Feedback Matters</h2>
              <p className="body-md text-slate-300 max-w-2xl mx-auto">
                Every review helps restaurants understand what they're doing well and where they can improve. Your honest feedback creates better experiences for everyone.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto border border-blue-500/30">
                  <MessageSquare size={24} className="text-blue-400" />
                </div>
                <h3 className="heading-sm">Voice & Text Reviews</h3>
                <p className="body-sm text-slate-400">
                  Share your experience through voice recordings or traditional text reviews
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto border border-green-500/30">
                  <TrendingUp size={24} className="text-green-400" />
                </div>
                <h3 className="heading-sm">AI-Powered Insights</h3>
                <p className="body-sm text-slate-400">
                  Advanced analysis helps restaurants understand patterns and improve service
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto border border-purple-500/30">
                  <Shield size={24} className="text-purple-400" />
                </div>
                <h3 className="heading-sm">Anonymous & Secure</h3>
                <p className="body-sm text-slate-400">
                  Your privacy is protected while your feedback helps improve dining experiences
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;