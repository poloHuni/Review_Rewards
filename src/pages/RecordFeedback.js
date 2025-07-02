// src/pages/RecordFeedback.js - Updated for Enhanced Recording Interface
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getRestaurantById, getRestaurantByNameOrSlug } from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import FeedbackForm from '../components/Feedback/FeedbackForm';
import { slugToReadable } from '../utils/stringUtils';
import { 
  MapPin, 
  Clock, 
  Users, 
  Star,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

const RecordFeedback = () => {
  const { restaurantName } = useParams();
  const [searchParams] = useSearchParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        setError(null);
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
        console.error('Error fetching restaurant data:', err);
        setError('Failed to load restaurant information. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurantData();
  }, [restaurantName, searchParams]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  // Loading state with enhanced animation
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-purple-200/20 border-t-purple-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Loading Restaurant
          </h2>
          <p className="text-gray-400">Preparing your review experience...</p>
        </motion.div>
      </div>
    );
  }

  // Error state with enhanced styling
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          className="glass-card-enhanced rounded-3xl p-8 max-w-md w-full text-center border border-red-500/20"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Restaurant Not Found</h2>
          <p className="text-gray-300 mb-8">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 border border-white/20"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // No user state
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          className="glass-card-enhanced rounded-3xl p-8 max-w-md w-full text-center border border-yellow-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Users className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
          <p className="text-gray-300 mb-8">Please log in to share your restaurant review and earn points.</p>
          <div className="space-y-3">
            <a
              href="/login"
              className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 text-center transform hover:scale-105"
            >
              Log In to Continue
            </a>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 border border-white/20"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main content with restaurant information
  return (
    <div className="min-h-screen py-8">
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Enhanced Restaurant Header */}
        <motion.div 
          className="mb-12"
          variants={headerVariants}
        >
          <div className="glass-card-enhanced rounded-3xl p-8 border border-white/20">
            <div className="text-center">
              {/* Restaurant Icon/Logo */}
              <motion.div 
                className="w-20 h-20 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="text-3xl">🍽️</span>
              </motion.div>

              {/* Restaurant Name */}
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent mb-4">
                {restaurant?.name || slugToReadable(restaurantName) || 'Restaurant'}
              </h1>

              {/* Restaurant Details */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-gray-300">
                {restaurant?.address && (
                  <motion.div 
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    <MapPin size={18} className="text-orange-400" />
                    <span>{restaurant.address}</span>
                  </motion.div>
                )}
                
                {restaurant?.phone && (
                  <motion.div 
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="text-orange-400">📞</span>
                    <span>{restaurant.phone}</span>
                  </motion.div>
                )}
                
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <Clock size={18} className="text-orange-400" />
                  <span>Open for reviews</span>
                </motion.div>
              </div>

              {/* Decorative Elements */}
              <div className="mt-8 flex justify-center">
                <motion.div
                  className="flex items-center gap-2"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="text-yellow-400" size={20} />
                  <span className="text-yellow-300 font-medium">Share Your Experience</span>
                  <Sparkles className="text-yellow-400" size={20} />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feedback Form with enhanced presentation */}
        <motion.div variants={itemVariants}>
          <FeedbackForm 
            restaurantId={restaurant?.restaurant_id || restaurant?.id || 'default_restaurant'}
            restaurantName={restaurant?.name || slugToReadable(restaurantName) || 'this restaurant'}
            placeId={restaurant?.google_place_id}
          />
        </motion.div>

        {/* Additional Information Section */}
        <motion.div 
          className="mt-12"
          variants={itemVariants}
        >
          <div className="glass-card-enhanced rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="text-yellow-400" size={24} />
              Why Share Your Review?
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="text-blue-400" size={24} />
                </div>
                <h4 className="font-semibold text-white mb-2">Help Others</h4>
                <p className="text-gray-300 text-sm">Your feedback helps other diners make informed decisions</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="text-green-400" size={24} />
                </div>
                <h4 className="font-semibold text-white mb-2">Earn Points</h4>
                <p className="text-gray-300 text-sm">Get points for every review and redeem amazing rewards</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Star className="text-purple-400" size={24} />
                </div>
                <h4 className="font-semibold text-white mb-2">Improve Service</h4>
                <p className="text-gray-300 text-sm">Your insights help restaurants provide better experiences</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Floating Background Elements */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <motion.div
            className="absolute top-20 left-10 w-32 h-32 bg-purple-500/5 rounded-full"
            animate={{ 
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-40 right-20 w-24 h-24 bg-pink-500/5 rounded-full"
            animate={{ 
              y: [0, 15, 0],
              scale: [1, 0.9, 1],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute bottom-40 left-1/4 w-20 h-20 bg-blue-500/5 rounded-full"
            animate={{ 
              y: [0, -10, 0],
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 5, repeat: Infinity, delay: 2 }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default RecordFeedback;