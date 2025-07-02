// src/pages/MyReviews.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  MessageSquare, 
  Star, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Filter,
  Calendar,
  TrendingUp,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MyReviews = () => {
  // FIX: Use currentUser instead of user to match your AuthContext
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedReview, setExpandedReview] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [filterBy, setFilterBy] = useState('all');

  // FIX: Enhanced user checking function
  const getAuthenticatedUser = () => {
    // Try multiple sources for user (same as ReviewAnalysis)
    if (currentUser && currentUser.uid) {
      return currentUser;
    }
    return null;
  };

  useEffect(() => {
    const authenticatedUser = getAuthenticatedUser();
    
    if (authenticatedUser) {
      fetchReviews();
    } else {
      console.log('No authenticated user, skipping review fetch');
      setLoading(false);
      setError('Please log in to view your reviews');
    }
  }, [currentUser]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const authenticatedUser = getAuthenticatedUser();
      
      if (!authenticatedUser || !authenticatedUser.uid) {
        throw new Error('User not authenticated');
      }
      
      console.log('🔍 Fetching reviews for user:', authenticatedUser.uid);
      console.log('🔍 User email:', authenticatedUser.email);
      
      // FIX: Use the same query structure that works in the debug test
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('user_id', '==', authenticatedUser.uid),
        orderBy('timestamp', 'desc')
      );
      
      console.log('🔍 Executing query...');
      const querySnapshot = await getDocs(reviewsQuery);
      
      const reviewsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Review doc:', doc.id, data);
        return {
          id: doc.id,
          ...data
        };
      });
      
      console.log('✅ Fetched reviews count:', reviewsData.length);
      console.log('✅ Reviews data:', reviewsData);
      
      setReviews(reviewsData);
      
    } catch (err) {
      console.error('❌ Error fetching reviews:', err);
      setError(`Failed to load reviews: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // FIX: Enhanced filtering and sorting
  const getFilteredAndSortedReviews = () => {
    let filtered = [...reviews];
    
    // Apply filter
    switch (filterBy) {
      case 'high':
        filtered = filtered.filter(review => (review.sentiment_score || 0) >= 4);
        break;
      case 'medium':
        filtered = filtered.filter(review => {
          const score = review.sentiment_score || 0;
          return score >= 2 && score < 4;
        });
        break;
      case 'low':
        filtered = filtered.filter(review => (review.sentiment_score || 0) < 2);
        break;
      default:
        // 'all' - no filtering
        break;
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.sentiment_score || 0) - (a.sentiment_score || 0);
        case 'restaurant':
          const nameA = a.restaurant_name || 'Unknown';
          const nameB = b.restaurant_name || 'Unknown';
          return nameA.localeCompare(nameB);
        case 'date':
        default:
          // Default to date sorting (newest first)
          const dateA = a.timestamp ? 
            (a.timestamp.seconds ? new Date(a.timestamp.seconds * 1000) : new Date(a.timestamp)) : 
            new Date(0);
          const dateB = b.timestamp ? 
            (b.timestamp.seconds ? new Date(b.timestamp.seconds * 1000) : new Date(b.timestamp)) : 
            new Date(0);
          return dateB - dateA;
      }
    });
    
    return filtered;
  };

  const calculateStats = () => {
    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        restaurantsReviewed: 0,
        lastReview: null
      };
    }

    const validRatings = reviews
      .map(r => r.sentiment_score)
      .filter(score => score && !isNaN(score));
    
    const averageRating = validRatings.length > 0 
      ? validRatings.reduce((sum, score) => sum + score, 0) / validRatings.length 
      : 0;

    const uniqueRestaurants = new Set(
      reviews.map(r => r.restaurant_id || r.restaurant_name).filter(Boolean)
    ).size;

    const lastReview = reviews.length > 0 ? reviews[0] : null;

    return {
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      restaurantsReviewed: uniqueRestaurants,
      lastReview
    };
  };

  const formatDate = (review) => {
    if (!review || !review.timestamp) return 'Unknown date';
    
    try {
      let date;
      if (review.timestamp.seconds) {
        // Firestore timestamp
        date = new Date(review.timestamp.seconds * 1000);
      } else {
        // Regular date
        date = new Date(review.timestamp);
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown date';
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const numRating = rating || 0;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={`${
            i <= numRating
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300'
          }`}
        />
      );
    }
    
    return <div className="flex items-center gap-1">{stars}</div>;
  };

  const filteredReviews = getFilteredAndSortedReviews();
  const stats = calculateStats();

  // Debug info for troubleshooting
  useEffect(() => {
    console.log('🔍 MyReviews Debug Info:');
    console.log('- currentUser:', currentUser);
    console.log('- authenticatedUser:', getAuthenticatedUser());
    console.log('- reviews count:', reviews.length);
    console.log('- loading:', loading);
    console.log('- error:', error);
  }, [currentUser, reviews, loading, error]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-blue-500" size={32} />
          <p className="body-md">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="glass-card rounded-2xl p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-500" size={32} />
          <h2 className="heading-md mb-4 text-red-600">Unable to Load Reviews</h2>
          <p className="body-md mb-6 text-gray-600">{error}</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={fetchReviews}
              className="btn-primary focus-ring"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="btn-secondary focus-ring"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No user state
  if (!getAuthenticatedUser()) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="glass-card rounded-2xl p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 text-yellow-500" size={32} />
          <h2 className="heading-md mb-4">Authentication Required</h2>
          <p className="body-md mb-6">Please log in to view your reviews.</p>
          <Link to="/login" className="btn-primary focus-ring">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MessageSquare className="text-white" size={32} />
            </div>
            <h2 className="heading-lg mb-4">No Reviews Yet</h2>
            <p className="body-lg mb-8 max-w-md mx-auto">
              You haven't shared any feedback yet. Start by reviewing a restaurant and help improve dining experiences!
            </p>
            <Link 
              to="/feedback" 
              className="btn-primary focus-ring"
            >
              Record Your First Review
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="heading-xl mb-4">My Reviews</h1>
        <p className="body-lg text-gray-600">
          Track your dining experiences and see your impact
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="glass-card rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="text-blue-400" size={24} />
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-1">
            {stats.totalReviews}
          </div>
          <p className="text-sm text-gray-600">Total Reviews</p>
        </div>

        <div className="glass-card rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Star className="text-yellow-400" size={24} />
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-1">
            {stats.averageRating}/5
          </div>
          <p className="text-sm text-gray-600">Average Rating</p>
        </div>

        <div className="glass-card rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <MapPin className="text-green-400" size={24} />
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-1">
            {stats.restaurantsReviewed}
          </div>
          <p className="text-sm text-gray-600">Restaurants</p>
        </div>

        <div className="glass-card rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Clock className="text-purple-400" size={24} />
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-1">
            {stats.lastReview ? formatDate(stats.lastReview) : 'Never'}
          </div>
          <p className="text-sm text-gray-600">Last Review</p>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Reviews</option>
              <option value="high">High Rated (4-5)</option>
              <option value="medium">Medium Rated (2-3)</option>
              <option value="low">Low Rated (1-2)</option>
            </select>
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="rating">Sort by Rating</option>
            <option value="restaurant">Sort by Restaurant</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-500">
          Showing {filteredReviews.length} of {reviews.length} reviews
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        <AnimatePresence>
          {filteredReviews.map((review) => (
            <motion.div
              key={review.id}
              className="glass-card rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="p-6">
                {/* Review Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex items-center gap-4 mb-2 sm:mb-0">
                    <div className="flex items-center">
                      {renderStars(review.sentiment_score)}
                      <span className="ml-2 text-sm text-gray-600">
                        {review.sentiment_score || 0}/5
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(review)}
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedReview(
                      expandedReview === review.id ? null : review.id
                    )}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {expandedReview === review.id ? 'Show Less' : 'Show More'}
                    <ChevronRight 
                      size={16} 
                      className={`transition-transform ${
                        expandedReview === review.id ? 'rotate-90' : ''
                      }`} 
                    />
                  </button>
                </div>

                {/* Restaurant Name */}
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="font-medium text-gray-800">
                    {review.restaurant_name || review.restaurant_id || 'Unknown Restaurant'}
                  </span>
                </div>

                {/* Review Summary */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Summary</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {review.summary || 'No summary provided'}
                  </p>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedReview === review.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      {/* Category Ratings */}
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {[
                          { key: 'food_quality', label: 'Food Quality' },
                          { key: 'service', label: 'Service' },
                          { key: 'atmosphere', label: 'Atmosphere' },
                          { key: 'music_and_entertainment', label: 'Music & Entertainment' }
                        ].map(({ key, label }) => (
                          review[key] && (
                            <div key={key} className="bg-gray-50 rounded-lg p-3">
                              <div className="font-medium text-gray-700 mb-1">{label}</div>
                              <p className="text-sm text-gray-600">{review[key]}</p>
                            </div>
                          )
                        ))}
                      </div>

                      {/* Specific Points */}
                      {review.specific_points && review.specific_points.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-800 mb-2">Key Points</h4>
                          <ul className="space-y-1">
                            {review.specific_points.map((point, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Improvement Suggestions */}
                      {review.improvement_suggestions && review.improvement_suggestions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Suggestions</h4>
                          <ul className="space-y-1">
                            {review.improvement_suggestions.map((suggestion, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add New Review Button */}
      <div className="text-center pt-8">
        <Link 
          to="/feedback" 
          className="btn-primary focus-ring"
        >
          Record New Review
        </Link>
      </div>
    </div>
  );
};

export default MyReviews;