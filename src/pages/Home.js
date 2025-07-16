// src/pages/Home.js - Enhanced Food Review Home Page
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllRestaurants } from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import { createSlug } from '../utils/stringUtils';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [stats, setStats] = useState({ totalReviews: 0, totalRestaurants: 0 });
  
  const { currentUser, isOwner } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const restaurantsData = await getAllRestaurants();
        setRestaurants(restaurantsData);
        
        // Calculate stats
        setStats({
          totalRestaurants: restaurantsData.length,
          totalReviews: restaurantsData.reduce((sum, r) => sum + (r.reviewCount || 0), 0)
        });
        
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

  const handleRecordFeedback = (restaurant) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const slug = createSlug ? createSlug(restaurant.name) : restaurant.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/feedback/${slug}`, { state: { restaurant } });
  };
  
  // Loading state with enhanced animation
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500/30 border-b-blue-500 rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <div className="text-2xl mb-2">🍽️</div>
          <p className="text-slate-300 text-lg">Discovering amazing restaurants...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-12 px-4">
        <div className="glass-card rounded-2xl p-8 text-center border border-red-500/20">
          <div className="text-6xl mb-4">😅</div>
          <h2 className="text-2xl font-bold mb-4 text-red-400">Oops! Something went wrong</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary px-6 py-3"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight">
            Share Your<br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Food Journey
            </span>
          </h1>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4 shadow-lg">
                1
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">Choose Restaurant</h3>
              <p className="text-slate-400 text-sm">Pick a restaurant from our list</p>
            </div>
            
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4 shadow-lg">
                2
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">Record Review</h3>
              <p className="text-slate-400 text-sm">Share your dining experience</p>
            </div>
            
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4 shadow-lg">
                3
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">Earn Rewards</h3>
              <p className="text-slate-400 text-sm">Get points for every review</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      {restaurants.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                Choose a Restaurant to Review
              </h2>
              <p className="text-slate-400 text-lg">Select a restaurant and share your dining experience</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8">
              {restaurants.slice(0, 6).map((restaurant, index) => (
                <div
                  key={restaurant.id}
                  className="relative glass-card rounded-2xl overflow-hidden group hover:scale-105 transition-all duration-500 hover:shadow-2xl w-80"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'slideInUp 0.6s ease-out forwards'
                  }}
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Content */}
                  <div className="relative p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-white mb-3 group-hover:text-purple-200 transition-colors">
                          {restaurant.name}
                        </h3>
                        {restaurant.category && (
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
                            <span className="text-purple-300 text-sm capitalize font-medium">
                              {restaurant.category}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-4xl ml-4 group-hover:scale-110 transition-transform duration-300">
                        {restaurant.emoji || '🍽️'}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-slate-300 text-sm">
                          {restaurant.reviewCount || 0} reviews
                        </span>
                      </div>
                      {restaurant.rating && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          <span className="text-yellow-400 font-medium">
                            ★ {restaurant.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleRecordFeedback(restaurant)}
                      className="w-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-white/20 hover:border-white/30 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 group-hover:transform group-hover:translateY(-1px)"
                    >
                      <span className="mr-2">🎤</span>
                      Leave Review
                    </button>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              ))}
            </div>

            {/* View All Button */}
            {restaurants.length > 6 && (
              <div className="text-center mt-12">
                <button className="btn-secondary px-8 py-3 rounded-xl border border-white/30 hover:border-white/50 transition-all duration-300">
                  <span className="mr-2">👀</span>
                  View All Restaurants
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      {currentUser && (
        <section className="py-16 px-4 bg-gradient-to-t from-white/3 to-transparent">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-white">
              <span className="mr-2">⚡</span>
              Quick Actions
            </h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/my-reviews"
                className="glass-card p-4 rounded-lg text-center group hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📝</div>
                <h3 className="font-bold text-white mb-1 text-sm">My Reviews</h3>
                <p className="text-xs text-slate-400">View your food adventures</p>
              </Link>

              <Link
                to="/rewards"
                className="glass-card p-4 rounded-lg text-center group hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🎁</div>
                <h3 className="font-bold text-white mb-1 text-sm">Rewards</h3>
                <p className="text-xs text-slate-400">Check your points</p>
              </Link>

              <Link
                to="/vouchers"
                className="glass-card p-4 rounded-lg text-center group hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🎫</div>
                <h3 className="font-bold text-white mb-1 text-sm">Vouchers</h3>
                <p className="text-xs text-slate-400">Redeem rewards</p>
              </Link>

              {restaurants.length > 0 && (
                <button
                  onClick={() => handleRecordFeedback(restaurants[0])}
                  className="glass-card p-4 rounded-lg text-center group hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20"
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🎤</div>
                  <h3 className="font-bold text-white mb-1 text-sm">New Review</h3>
                  <p className="text-xs text-slate-400">Record feedback</p>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
          color: white;
          border: none;
          transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
        }
        
        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default Home;