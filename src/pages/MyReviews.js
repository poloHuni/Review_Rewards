// src/pages/MyReviews.js - Simplified Version (Works Without Points System)
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
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MyReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedReview, setExpandedReview] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    if (user) {
      fetchReviews();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching reviews for user:', user.uid);
      
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('user_id', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(reviewsQuery);
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Fetched reviews:', reviewsData);
      setReviews(reviewsData);
      
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(`Failed to load reviews: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
      reviews.map(r => r.restaurant_id).filter(Boolean)
    ).size;

    const lastReview = reviews.length > 0 ? reviews[0].timestamp : null;

    return {
      totalReviews: reviews.length,
      averageRating,
      restaurantsReviewed: uniqueRestaurants,
      lastReview
    };
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = [...reviews];

    if (filterBy !== 'all') {
      filtered = filtered.filter(review => {
        switch (filterBy) {
          case 'high':
            return review.sentiment_score >= 4;
          case 'medium':
            return review.sentiment_score >= 2 && review.sentiment_score < 4;
          case 'low':
            return review.sentiment_score < 2;
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.sentiment_score || 0) - (a.sentiment_score || 0);
        case 'restaurant':
          return (a.restaurant_name || '').localeCompare(b.restaurant_name || '');
        case 'date':
        default:
          return new Date(b.timestamp?.seconds * 1000 || b.timestamp || 0) - 
                 new Date(a.timestamp?.seconds * 1000 || a.timestamp || 0);
      }
    });

    return filtered;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="body-md">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="glass-card rounded-2xl p-8 text-center status-error">
          <h2 className="heading-md mb-4">Error Loading Reviews</h2>
          <p className="body-md mb-6">{error}</p>
          <button 
            onClick={fetchReviews}
            className="btn-primary focus-ring"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="text-6xl mb-6">📝</div>
          <h2 className="heading-lg mb-4">No Reviews Yet</h2>
          <div className="max-w-md mx-auto space-y-4">
            <p className="body-lg">
              Start by reviewing a restaurant and help improve dining experiences!
            </p>
            <Link 
              to="/feedback"
              className="btn-primary focus-ring inline-flex items-center gap-2"
            >
              <MessageSquare size={18} />
              Leave Your First Review
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const filteredReviews = getFilteredAndSortedReviews();
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-xl">My Reviews</h1>
          <p className="body-lg">Track your feedback and dining experiences</p>
        </div>
        
        <Link to="/feedback" className="btn-primary focus-ring">
          <MessageSquare size={18} className="mr-2" />
          Leave New Review
        </Link>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card-subtle rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-sm mb-1">Total Reviews</p>
              <p className="text-3xl font-bold text-white">{stats.totalReviews}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-blue-400" size={24} />
            </div>
          </div>
        </div>
        
        <div className="glass-card-subtle rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-sm mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-white">{stats.averageRating.toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Star className="text-amber-400" size={24} />
            </div>
          </div>
        </div>
        
        <div className="glass-card-subtle rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-sm mb-1">Restaurants</p>
              <p className="text-3xl font-bold text-white">{stats.restaurantsReviewed}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <MapPin className="text-emerald-400" size={24} />
            </div>
          </div>
        </div>
        
        <div className="glass-card-subtle rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-sm mb-1">Last Review</p>
              <p className="text-lg font-bold text-white">
                {stats.lastReview ? formatDate(stats.lastReview) : 'Never'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Clock className="text-purple-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
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
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="rating">Sort by Rating</option>
            <option value="restaurant">Sort by Restaurant</option>
          </select>
        </div>
        
        <div className="text-sm text-slate-400">
          Showing {filteredReviews.length} of {reviews.length} reviews
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        <AnimatePresence>
          {filteredReviews.map((review) => (
            <motion.div
              key={review.id}
              className="glass-card rounded-xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="p-6">
                {/* Review Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex items-center gap-4 mb-2 sm:mb-0">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={`${
                            i < (review.sentiment_score || 0)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-500'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-white">
                      {review.restaurant_name || 'Restaurant'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{formatDate(review.timestamp)}</span>
                    </div>
                    <button
                      onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                      className="btn-ghost flex items-center gap-2 focus-ring"
                    >
                      {expandedReview === review.id ? 'Show Less' : 'View Details'}
                      <ChevronRight 
                        size={16} 
                        className={`transition-transform ${expandedReview === review.id ? 'rotate-90' : ''}`} 
                      />
                    </button>
                  </div>
                </div>
                
                {/* Summary */}
                <div className="mb-4">
                  <p className="text-slate-300 leading-relaxed">{review.summary || 'No summary available'}</p>
                </div>
                
                {/* Expanded Details */}
                {expandedReview === review.id && (
                  <div className="space-y-6 pt-4 border-t border-white/10">
                    {/* Detailed Ratings */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                          🍽️ Food Quality
                        </h5>
                        <p className="body-sm">{review.food_quality || 'N/A'}</p>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                          👨‍🍳 Service
                        </h5>
                        <p className="body-sm">{review.service || 'N/A'}</p>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                          🏮 Atmosphere
                        </h5>
                        <p className="body-sm">{review.atmosphere || 'N/A'}</p>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                          🎵 Music & Entertainment
                        </h5>
                        <p className="body-sm">{review.music_and_entertainment || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {/* Key Points */}
                    {review.specific_points && (
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                          🔑 Key Points
                        </h4>
                        <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
                          {Array.isArray(review.specific_points) ?
                            review.specific_points.map((point, index) => (
                              <li key={index}>{point}</li>
                            )) :
                            <li>{review.specific_points}</li>
                          }
                        </ul>
                      </div>
                    )}
                    
                    {/* Improvement Suggestions */}
                    {review.improvement_suggestions && (
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                          💡 Improvement Suggestions
                        </h4>
                        <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
                          {Array.isArray(review.improvement_suggestions) ?
                            review.improvement_suggestions.map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            )) :
                            <li>{review.improvement_suggestions}</li>
                          }
                        </ul>
                      </div>
                    )}
                    
                    {/* Audio Recording */}
                    {review.audio_url && (
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                          🎵 Audio Recording
                        </h4>
                        <audio src={review.audio_url} controls className="w-full" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyReviews;