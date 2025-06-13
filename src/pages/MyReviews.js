// src/pages/MyReviews.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReviewsByUser } from '../services/reviewService';
import { getAllRestaurants } from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import StarRating from '../components/Reviews/StarRating';
import { 
  MessageSquare, 
  Filter, 
  Calendar, 
  MapPin, 
  ChevronDown, 
  ChevronRight,
  Search,
  SortAsc,
  SortDesc,
  Volume2,
  ExternalLink,
  TrendingUp,
  Award,
  Clock,
  Star
} from 'lucide-react';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [sortBy, setSortBy] = useState('date-desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedReview, setExpandedReview] = useState(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  
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

  // Close dropdowns when one opens
  useEffect(() => {
    if (filterDropdownOpen) {
      setSortDropdownOpen(false);
    }
  }, [filterDropdownOpen]);

  useEffect(() => {
    if (sortDropdownOpen) {
      setFilterDropdownOpen(false);
    }
  }, [sortDropdownOpen]);
  
  // Get restaurant name by ID
  const getRestaurantName = (restaurantId) => {
    const restaurant = restaurants.find(r => r.restaurant_id === restaurantId);
    return restaurant ? restaurant.name : 'Unknown Restaurant';
  };
  
  // Filter and sort reviews
  const getFilteredAndSortedReviews = () => {
    let filtered = reviews;
    
    // Filter by restaurant
    if (selectedRestaurant) {
      filtered = filtered.filter(review => review.restaurant_id === selectedRestaurant);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(review => 
        review.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getRestaurantName(review.restaurant_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.food_quality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.service?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort reviews
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          const dateA = a.timestamp ? new Date(a.timestamp.seconds * 1000) : new Date(0);
          const dateB = b.timestamp ? new Date(b.timestamp.seconds * 1000) : new Date(0);
          return dateB - dateA;
        case 'date-asc':
          const dateA2 = a.timestamp ? new Date(a.timestamp.seconds * 1000) : new Date(0);
          const dateB2 = b.timestamp ? new Date(b.timestamp.seconds * 1000) : new Date(0);
          return dateA2 - dateB2;
        case 'rating-desc':
          return (b.sentiment_score || 0) - (a.sentiment_score || 0);
        case 'rating-asc':
          return (a.sentiment_score || 0) - (b.sentiment_score || 0);
        case 'restaurant':
          return getRestaurantName(a.restaurant_id).localeCompare(getRestaurantName(b.restaurant_id));
        default:
          return 0;
      }
    });
    
    return filtered;
  };
  
  // Extract unique restaurant IDs from reviews
  const restaurantIds = [...new Set(reviews.map(review => review.restaurant_id))];
  
  // Calculate statistics
  const stats = {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + (review.sentiment_score || 0), 0) / reviews.length 
      : 0,
    restaurantsReviewed: restaurantIds.length,
    lastReview: reviews.length > 0 ? reviews[0] : null
  };
  
  // Display loading state
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
  
  // Display error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="glass-card rounded-2xl p-8 text-center status-error">
          <h2 className="heading-md mb-4">Unable to Load Reviews</h2>
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
  
  // Handle empty state
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
              to="/"
              className="btn-primary focus-ring"
            >
              Browse Restaurants
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
                {stats.lastReview ? formatDate(stats.lastReview.timestamp, 'relative') : 'Never'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Clock className="text-purple-400" size={24} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="glass-card-subtle rounded-xl p-6 relative z-50 isolate">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          {/* Restaurant Filter */}
          {restaurantIds.length > 1 && (
            <div className="relative z-50">
              <button
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className="btn-secondary flex items-center gap-2 focus-ring"
              >
                <Filter size={18} />
                {selectedRestaurant ? getRestaurantName(selectedRestaurant) : 'All Restaurants'}
                <ChevronDown size={16} className={`transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {filterDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 !z-[9998]" 
                    onClick={() => setFilterDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-white/20 shadow-2xl !z-[9999]">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setSelectedRestaurant(null);
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          !selectedRestaurant ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        All Restaurants
                      </button>
                      {restaurantIds.map(id => (
                        <button
                          key={id}
                          onClick={() => {
                            setSelectedRestaurant(id);
                            setFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            selectedRestaurant === id ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-700'
                          }`}
                        >
                          {getRestaurantName(id)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Sort */}
          <div className="relative z-50">
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="btn-secondary flex items-center gap-2 focus-ring lg:w-48"
            >
              <span className="flex-1 text-left">
                {sortBy === 'date-desc' ? 'Newest First' :
                 sortBy === 'date-asc' ? 'Oldest First' :
                 sortBy === 'rating-desc' ? 'Highest Rating' :
                 sortBy === 'rating-asc' ? 'Lowest Rating' :
                 sortBy === 'restaurant' ? 'Restaurant Name' : 'Sort By'}
              </span>
              <ChevronDown size={16} className={`transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {sortDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 !z-[9998]" 
                  onClick={() => setSortDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-white/20 shadow-2xl !z-[9999]">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSortBy('date-desc');
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        sortBy === 'date-desc' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      Newest First
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('date-asc');
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        sortBy === 'date-asc' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      Oldest First
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('rating-desc');
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        sortBy === 'rating-desc' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      Highest Rating
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('rating-asc');
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        sortBy === 'rating-asc' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      Lowest Rating
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('restaurant');
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        sortBy === 'restaurant' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      Restaurant Name
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <p className="body-sm">
            Showing {filteredReviews.length} of {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </p>
          
          {(selectedRestaurant || searchTerm) && (
            <button
              onClick={() => {
                setSelectedRestaurant(null);
                setSearchTerm('');
              }}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.length === 0 ? (
          <div className="glass-card-subtle rounded-xl p-8 text-center">
            <h3 className="heading-sm mb-2">No Reviews Found</h3>
            <p className="body-md">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id || review.review_id} className="glass-card rounded-xl overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="heading-sm mb-1">
                      {getRestaurantName(review.restaurant_id)}
                    </h3>
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {review.timestamp ? formatDate(review.timestamp) : 'Unknown date'}
                      </div>
                      {typeof review.sentiment_score === 'number' && (
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.sentiment_score} size="sm" />
                        </div>
                      )}
                    </div>
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
                    
                    {/* Audio playback */}
                    {review.audio_url && (
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                          <Volume2 size={16} />
                          Original Audio Recording
                        </h4>
                        <audio src={review.audio_url} controls className="w-full" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyReviews;