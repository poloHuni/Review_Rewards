// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
            <p className="body-md">
              No restaurants are currently available for feedback. Please check back later.
            </p>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight text-white mb-6">
            Transform Customer Feedback with{' '}
            <span className="gradient-text">AI-Powered Insights</span>
          </h1>
          <p className="body-lg max-w-2xl mx-auto mb-8">
            Share your dining experience through voice or text and help restaurants improve their service with detailed, actionable feedback powered by artificial intelligence.
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
                {/* Restaurant Image */}
                <div className="lg:col-span-1">
                  <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center border border-white/10">
                    <span className="text-6xl">🍽️</span>
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
                  {/* Restaurant Image */}
                  <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <span className="text-4xl">🍽️</span>
                  </div>
                  
                  {/* Restaurant Info */}
                  <div className="p-6">
                    <h3 className="heading-sm mb-2">{restaurant.name}</h3>
                    <p className="body-sm mb-4 line-clamp-1">
                      {restaurant.address || 'Address not provided'}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      {currentUser ? (
                        <Link
                          to={`/feedback/${createSlug(restaurant.name)}`}
                          className="text-blue-400 hover:text-blue-300 font-medium text-sm flex items-center gap-1 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Leave Feedback
                          <ArrowRight size={14} />
                        </Link>
                      ) : (
                        <Link
                          to={`/login?restaurant_id=${restaurant.restaurant_id}`}
                          className="text-blue-400 hover:text-blue-300 font-medium text-sm flex items-center gap-1 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Sign In
                          <ArrowRight size={14} />
                        </Link>
                      )}
                      
                      <div className="text-slate-500 body-sm">
                        ID: {restaurant.restaurant_id}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section>
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-12">
              <h2 className="heading-lg mb-4">How It Works</h2>
              <p className="body-lg max-w-2xl mx-auto">
                Our AI-powered system transforms your feedback into actionable insights for restaurants
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                  <Mic className="text-white" size={24} />
                </div>
                <h3 className="heading-sm">Share Your Experience</h3>
                <p className="body-md">
                  Record your thoughts via voice or text. Talk about food quality, service, atmosphere, and what could be improved.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <h3 className="heading-sm">AI Analysis</h3>
                <p className="body-md">
                  Our advanced AI analyzes your feedback, extracting key insights about sentiment, specific issues, and improvement suggestions.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <h3 className="heading-sm">Actionable Insights</h3>
                <p className="body-md">
                  Restaurants receive detailed analytics and trends to improve their service and create better dining experiences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-12">
              <h2 className="heading-lg mb-4">Why Choose Our Platform</h2>
              <p className="body-lg max-w-2xl mx-auto">
                Designed for both customers and restaurant owners with cutting-edge technology
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto border border-blue-500/30">
                  <Mic className="text-blue-400" size={20} />
                </div>
                <h4 className="font-semibold text-white">Voice & Text</h4>
                <p className="body-sm">Multiple input methods for convenience</p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto border border-emerald-500/30">
                  <Shield className="text-emerald-400" size={20} />
                </div>
                <h4 className="font-semibold text-white">Secure & Private</h4>
                <p className="body-sm">Your data is protected and encrypted</p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto border border-purple-500/30">
                  <TrendingUp className="text-purple-400" size={20} />
                </div>
                <h4 className="font-semibold text-white">Real-time Analytics</h4>
                <p className="body-sm">Instant insights and trends</p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mx-auto border border-amber-500/30">
                  <Users className="text-amber-400" size={20} />
                </div>
                <h4 className="font-semibold text-white">Community Driven</h4>
                <p className="body-sm">Help improve dining experiences</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!currentUser && (
        <section>
          <div className="glass-card rounded-2xl overflow-hidden bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="p-8 text-center">
              <h2 className="heading-lg mb-4">Ready to Get Started?</h2>
              <p className="body-lg mb-8 max-w-2xl mx-auto">
                Join our community of food enthusiasts and help restaurants create better dining experiences through intelligent feedback.
              </p>
              <Link to="/login" className="btn-primary text-lg px-8 py-4 focus-ring">
                Create Your Account
                <ArrowRight size={20} className="ml-2" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;