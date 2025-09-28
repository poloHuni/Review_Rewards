// src/pages/MyReviews.js - Enhanced Neumorphic Design
// EXACT SAME FUNCTIONALITY WITH ONLY UI CHANGES
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import ReviewCategories from '../components/Reviews/ReviewCategories';
import { 
  FileTextIcon, 
  StarIcon, 
  CalendarIcon, 
  FilterIcon, 
  SortAscIcon, 
  SortDescIcon,
  MapPinIcon,
  ClockIcon,
  TrendingUpIcon,
  EyeIcon,
  EyeOffIcon,
  RefreshCcwIcon,
  XIcon,
  CheckIcon,
  ArrowRightIcon,
  LoaderIcon,
  AlertTriangleIcon,
  LockIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BarChart3Icon,
  UtensilsIcon,
  SmileIcon,
  MehIcon,
  FrownIcon
} from 'lucide-react';

const MyReviews = () => {
  // EXACT SAME STATE MANAGEMENT AS ORIGINAL
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedReview, setExpandedReview] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [filterBy, setFilterBy] = useState('all');
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // EXACT SAME DARK MODE DETECTION AS ORIGINAL
  useEffect(() => {
    const checkDarkMode = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDarkMode(theme === 'dark');
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);

  // EXACT SAME HELPER FUNCTIONS AS ORIGINAL
  const getAuthenticatedUser = () => {
    if (currentUser && currentUser.uid) {
      return currentUser;
    }
    return null;
  };

  const getRestaurantName = (review) => {
    if (review.restaurant_name && review.restaurant_name.trim() && review.restaurant_name !== 'Unknown Restaurant') {
      return review.restaurant_name.trim();
    }
    
    if (review.restaurantName && review.restaurantName.trim() && review.restaurantName !== 'Unknown Restaurant') {
      return review.restaurantName.trim();
    }
    
    return 'Unknown Restaurant';
  };

  // ENHANCED DATA LOADING WITH PROPER FIELD NAMES
  useEffect(() => {
    const fetchReviews = async () => {
      const user = getAuthenticatedUser();
      
      if (!user) {
        console.log('❌ No authenticated user found');
        setError('Please log in to view your reviews');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching reviews for user:', user.uid);
        console.log('🔗 Database connection:', db ? 'Connected' : 'Not connected');
        
        // Try different query approaches based on your data structure
        let reviewsData = [];
        
        // Method 1: Try with user_id (underscore) - based on your reviewService.js
        try {
          console.log('📝 Trying query with user_id (underscore)...');
          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('user_id', '==', user.uid),
            orderBy('timestamp', 'desc')
          );
          
          const snapshot = await getDocs(reviewsQuery);
          reviewsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log('✅ Successfully fetched with user_id:', reviewsData.length, 'reviews');
          
        } catch (userIdError) {
          console.log('⚠️ user_id query failed, trying userId (camelCase):', userIdError.message);
          
          // Method 2: Try with userId (camelCase)
          try {
            const reviewsQuery = query(
              collection(db, 'reviews'),
              where('userId', '==', user.uid),
              orderBy('timestamp', 'desc')
            );
            
            const snapshot = await getDocs(reviewsQuery);
            reviewsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            console.log('✅ Successfully fetched with userId:', reviewsData.length, 'reviews');
            
          } catch (orderByError) {
            console.log('⚠️ OrderBy query failed, trying without orderBy:', orderByError.message);
            
            // Method 3: Try without orderBy (simpler query) - first with user_id
            try {
              const simpleQuery = query(
                collection(db, 'reviews'),
                where('user_id', '==', user.uid)
              );
              
              const snapshot = await getDocs(simpleQuery);
              reviewsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              
              console.log('✅ Successfully fetched with user_id (no orderBy):', reviewsData.length, 'reviews');
              
            } catch (finalError) {
              // Method 4: Try userId without orderBy
              const simpleQuery2 = query(
                collection(db, 'reviews'),
                where('userId', '==', user.uid)
              );
              
              const snapshot = await getDocs(simpleQuery2);
              reviewsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              
              console.log('✅ Successfully fetched with userId (no orderBy):', reviewsData.length, 'reviews');
            }
          }
        }
        
        // Sort manually in JavaScript if we didn't use orderBy
        if (reviewsData.length > 0) {
          reviewsData.sort((a, b) => {
            const dateA = a.timestamp?.seconds || a.timestamp || 0;
            const dateB = b.timestamp?.seconds || b.timestamp || 0;
            return dateB - dateA;
          });
        }
        
        // Debug the data structure
        if (reviewsData.length > 0) {
          console.log('📊 Sample review data:', reviewsData[0]);
          console.log('🔍 Available fields:', Object.keys(reviewsData[0]));
        } else {
          console.log('📭 No reviews found for this user');
          console.log('🔍 Debugging: Let\'s check what\'s in the reviews collection...');
          
          // Debug: Try to get all reviews to see the structure
          try {
            const allReviewsSnapshot = await getDocs(collection(db, 'reviews'));
            const allReviews = allReviewsSnapshot.docs.map(doc => doc.data());
            console.log('🔍 Total reviews in collection:', allReviews.length);
            if (allReviews.length > 0) {
              console.log('🔍 Sample review structure:', allReviews[0]);
              console.log('🔍 User ID fields in reviews:', allReviews.map(r => ({ user_id: r.user_id, userId: r.userId })));
            }
          } catch (debugError) {
            console.log('🔍 Could not debug collection:', debugError.message);
          }
        }
        
        setReviews(reviewsData);
        
      } catch (err) {
        console.error('❌ Error fetching reviews:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to load reviews. ';
        
        if (err.code === 'permission-denied') {
          errorMessage += 'Permission denied. Please check your Firebase security rules.';
        } else if (err.code === 'unavailable') {
          errorMessage += 'Service temporarily unavailable. Please try again later.';
        } else if (err.message.includes('index')) {
          errorMessage += 'Database index required. Using fallback method...';
        } else if (err.code === 'failed-precondition') {
          errorMessage += 'Database operation failed. The collection may not exist yet.';
        } else {
          errorMessage += err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [currentUser]);

  // EXACT SAME FILTERING AND SORTING LOGIC AS ORIGINAL
  const getFilteredAndSortedReviews = () => {
    let filtered = [...reviews];
    
    // Apply filters
    if (filterBy === 'high') {
      filtered = filtered.filter(r => (r.sentiment_score || 0) >= 4);
    } else if (filterBy === 'low') {
      filtered = filtered.filter(r => (r.sentiment_score || 0) <= 2);
    }
    
    if (restaurantFilter !== 'all') {
      filtered = filtered.filter(r => getRestaurantName(r) === restaurantFilter);
    }
    
    if (selectedMonth !== '' || selectedYear !== '') {
      filtered = filtered.filter(r => {
        if (!r.timestamp) return false;
        let date;
        if (r.timestamp.seconds) {
          date = new Date(r.timestamp.seconds * 1000);
        } else {
          date = new Date(r.timestamp);
        }
        
        if (selectedYear && date.getFullYear().toString() !== selectedYear) return false;
        if (selectedMonth && date.getMonth().toString() !== selectedMonth) return false;
        return true;
      });
    }
    
    // Apply sorting
    if (sortBy === 'date') {
      filtered.sort((a, b) => {
        const dateA = a.timestamp?.seconds || a.timestamp || 0;
        const dateB = b.timestamp?.seconds || b.timestamp || 0;
        return dateB - dateA;
      });
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.sentiment_score || 0) - (a.sentiment_score || 0));
    } else if (sortBy === 'restaurant') {
      filtered.sort((a, b) => getRestaurantName(a).localeCompare(getRestaurantName(b)));
    }
    
    return filtered;
  };

  // EXACT SAME STATS CALCULATION AS ORIGINAL
  const calculateStats = () => {
    const validRatings = reviews.filter(r => r.sentiment_score).map(r => r.sentiment_score);
    const averageRating = validRatings.length > 0 ? validRatings.reduce((sum, score) => sum + score, 0) / validRatings.length : 0;
    const uniqueRestaurants = new Set(reviews.map(r => getRestaurantName(r)).filter(name => name !== 'Unknown Restaurant')).size;
    const lastReview = reviews.length > 0 ? reviews[0] : null;

    return {
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      restaurantsReviewed: uniqueRestaurants,
      lastReview
    };
  };

  // EXACT SAME HELPER FUNCTIONS AS ORIGINAL
  const formatDate = (review) => {
    if (!review || !review.timestamp) return 'Unknown date';
    try {
      let date;
      if (review.timestamp.seconds) {
        date = new Date(review.timestamp.seconds * 1000);
      } else {
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
      if (i <= numRating) {
        stars.push(<StarIcon key={i} size={16} fill="currentColor" className="neuro-star-filled" />);
      } else {
        stars.push(<StarIcon key={i} size={16} className="neuro-star-empty" />);
      }
    }
    return stars;
  };

  const getRatingEmoji = (score) => {
    if (score >= 4.5) return <SmileIcon size={20} className="neuro-emoji-excellent" />;
    if (score >= 4) return <SmileIcon size={20} className="neuro-emoji-good" />;
    if (score >= 3) return <MehIcon size={20} className="neuro-emoji-okay" />;
    if (score >= 2) return <MehIcon size={20} className="neuro-emoji-poor" />;
    return <FrownIcon size={20} className="neuro-emoji-bad" />;
  };

  const clearAllFilters = () => {
    setFilterBy('all');
    setRestaurantFilter('all');
    setSelectedMonth('');
    setSelectedYear('');
    setSortBy('date');
  };

  const hasActiveFilters = () => {
    return filterBy !== 'all' || restaurantFilter !== 'all' || selectedMonth !== '' || selectedYear !== '' || sortBy !== 'date';
  };

  const getMonthName = (monthIndex) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
  };

  const getUniqueRestaurants = () => {
    return [...new Set(reviews.map(r => getRestaurantName(r)).filter(name => name !== 'Unknown Restaurant'))];
  };

  const getUniqueYears = () => {
    const years = reviews.map(r => {
      if (!r.timestamp) return null;
      let date;
      if (r.timestamp.seconds) {
        date = new Date(r.timestamp.seconds * 1000);
      } else {
        date = new Date(r.timestamp);
      }
      return date.getFullYear();
    }).filter(year => year !== null);
    return [...new Set(years)].sort((a, b) => b - a);
  };

  const filteredReviews = getFilteredAndSortedReviews();
  const stats = calculateStats();

  // LOADING STATE - NEUMORPHIC DESIGN
  if (loading) {
    return (
      <div className="neuro-reviews-page">
        <div className="neuro-container">
          <div className="neuro-loading-container">
            <div className="neuro-loading-card">
              <div className="neuro-loading-icon">
                <LoaderIcon size={32} className="neuro-spin" />
              </div>
              <h2 className="neuro-loading-title">Loading Your Reviews</h2>
              <p className="neuro-loading-text">Fetching your dining experiences...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ERROR STATE - NEUMORPHIC DESIGN
  if (error) {
    return (
      <div className="neuro-reviews-page">
        <div className="neuro-container">
          <div className="neuro-error-container">
            <div className="neuro-error-card">
              <div className="neuro-error-icon">
                <AlertTriangleIcon size={48} />
              </div>
              <h2 className="neuro-error-title">Oops! Something went wrong</h2>
              <p className="neuro-error-text">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="neuro-error-button"
              >
                <RefreshCcwIcon size={18} />
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NO USER STATE - NEUMORPHIC DESIGN
  if (!getAuthenticatedUser()) {
    return (
      <div className="neuro-reviews-page">
        <div className="neuro-container">
          <div className="neuro-auth-container">
            <div className="neuro-auth-card">
              <div className="neuro-auth-icon">
                <LockIcon size={48} />
              </div>
              <h2 className="neuro-auth-title">Login Required</h2>
              <p className="neuro-auth-text">
                Please log in to view your delicious review history
              </p>
              <Link to="/login" className="neuro-auth-button">
                <ArrowRightIcon size={18} />
                Login Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY STATE - NEUMORPHIC DESIGN
  if (reviews.length === 0) {
    return (
      <div className="neuro-reviews-page">
        <div className="neuro-container">
          <div className="neuro-empty-container">
            <div className="neuro-empty-card">
              <div className="neuro-empty-icon">
                <UtensilsIcon size={64} />
              </div>
              <h2 className="neuro-empty-title">No Food Adventures Yet!</h2>
              <p className="neuro-empty-text">
                Start your culinary journey by sharing your first restaurant experience. Help fellow food lovers discover amazing places!
              </p>
              <Link to="/feedback" className="neuro-empty-button">
                <PlusIcon size={18} />
                Write Your First Review
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="neuro-reviews-page">
      <div className="neuro-container">
        {/* Page Header */}
        <div className="neuro-page-header">
          <div className="neuro-header-icon">
            <FileTextIcon size={32} />
          </div>
          <div className="neuro-header-content">
            <h1 className="neuro-page-title">My Food Journey</h1>
            <p className="neuro-page-subtitle">Your personal collection of dining experiences</p>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="neuro-stats-grid">
          <div className="neuro-stat-card">
            <div className="neuro-stat-icon">
              <FileTextIcon size={24} />
            </div>
            <div className="neuro-stat-content">
              <div className="neuro-stat-number">{stats.totalReviews}</div>
              <div className="neuro-stat-label">Total Reviews</div>
            </div>
          </div>
          
          <div className="neuro-stat-card">
            <div className="neuro-stat-icon">
              <StarIcon size={24} />
            </div>
            <div className="neuro-stat-content">
              <div className="neuro-stat-number">{stats.averageRating}</div>
              <div className="neuro-stat-label">Avg Rating</div>
            </div>
          </div>
          
          <div className="neuro-stat-card">
            <div className="neuro-stat-icon">
              <UtensilsIcon size={24} />
            </div>
            <div className="neuro-stat-content">
              <div className="neuro-stat-number">{stats.restaurantsReviewed}</div>
              <div className="neuro-stat-label">Restaurants</div>
            </div>
          </div>
          
          <div className="neuro-stat-card">
            <div className="neuro-stat-icon">
              <CalendarIcon size={24} />
            </div>
            <div className="neuro-stat-content">
              <div className="neuro-stat-number">
                {stats.lastReview ? formatDate(stats.lastReview).split(',')[0] : 'N/A'}
              </div>
              <div className="neuro-stat-label">Last Review</div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="neuro-controls-bar">
          <div className="neuro-reviews-count">
            Showing {filteredReviews.length} of {reviews.length} reviews
            {hasActiveFilters() && <span className="neuro-filtered-badge">filtered</span>}
          </div>
          
          <div className="neuro-controls-actions">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`neuro-filter-button ${showFilters ? 'active' : ''}`}
            >
              <FilterIcon size={16} />
              Filters
              {hasActiveFilters() && <div className="neuro-active-indicator" />}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="neuro-filter-panel">
            <div className="neuro-filter-header">
              <h3>Filter & Sort Reviews</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="neuro-close-button"
              >
                <XIcon size={20} />
              </button>
            </div>
            
            <div className="neuro-filter-grid">
              {/* Sort By */}
              <div className="neuro-filter-group">
                <label className="neuro-filter-label">Sort By</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="neuro-select"
                >
                  <option value="date">Date (Newest)</option>
                  <option value="rating">Rating (Highest)</option>
                  <option value="restaurant">Restaurant (A-Z)</option>
                </select>
              </div>

              {/* Filter By Rating */}
              <div className="neuro-filter-group">
                <label className="neuro-filter-label">Rating Filter</label>
                <select 
                  value={filterBy} 
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="neuro-select"
                >
                  <option value="all">All Ratings</option>
                  <option value="high">High (4+ stars)</option>
                  <option value="low">Low (2- stars)</option>
                </select>
              </div>

              {/* Restaurant Filter */}
              <div className="neuro-filter-group">
                <label className="neuro-filter-label">Restaurant</label>
                <select 
                  value={restaurantFilter} 
                  onChange={(e) => setRestaurantFilter(e.target.value)}
                  className="neuro-select"
                >
                  <option value="all">All Restaurants</option>
                  {getUniqueRestaurants().map(restaurant => (
                    <option key={restaurant} value={restaurant}>{restaurant}</option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div className="neuro-filter-group">
                <label className="neuro-filter-label">Year</label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="neuro-select"
                >
                  <option value="">All Years</option>
                  {getUniqueYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div className="neuro-filter-group">
                <label className="neuro-filter-label">Month</label>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="neuro-select"
                >
                  <option value="">All Months</option>
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i} value={i}>{getMonthName(i)}</option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters() && (
              <div className="neuro-filter-actions">
                <button 
                  onClick={clearAllFilters}
                  className="neuro-clear-button"
                >
                  <RefreshCcwIcon size={16} />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reviews List */}
        <div className="neuro-reviews-list">
          {filteredReviews.map((review) => (
            <div 
              key={review.id}
              className={`neuro-review-card ${expandedReview === review.id ? 'expanded' : ''}`}
            >
              {/* Review Header */}
              <div 
                className="neuro-review-header"
                onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
              >
                <div className="neuro-review-main-info">
                  <div className="neuro-restaurant-info">
                    <div className="neuro-restaurant-icon">
                      <MapPinIcon size={16} />
                    </div>
                    <h3 className="neuro-restaurant-name">{getRestaurantName(review)}</h3>
                  </div>
                  <div className="neuro-review-date">
                    <CalendarIcon size={14} />
                    <span>{formatDate(review)}</span>
                  </div>
                </div>
                
                <div className="neuro-review-rating">
                  <div className="neuro-stars">
                    {renderStars(review.sentiment_score)}
                  </div>
                  <div className="neuro-rating-emoji">
                    {getRatingEmoji(review.sentiment_score)}
                  </div>
                </div>
                
                <div className="neuro-expand-button">
                  {expandedReview === review.id ? (
                    <ChevronUpIcon size={20} />
                  ) : (
                    <ChevronDownIcon size={20} />
                  )}
                </div>
              </div>

              {/* Review Summary */}
              <div className="neuro-review-summary">
                {review.summary || 'No summary available'}
              </div>

              {/* Expanded Content */}
              {expandedReview === review.id && (
                <div className="neuro-review-expanded">
                  {/* Review Categories */}
                  <div className="neuro-categories-section">
                    <ReviewCategories 
                      review={review} 
                      layout="grid" 
                      showEmptyCategories={true}
                      style={{
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem'
                      }}
                    />
                  </div>
                  
                  {/* Specific Points */}
                  {review.specific_points && review.specific_points.length > 0 && (
                    <div className="neuro-points-section">
                      <h4 className="neuro-section-title">
                        <CheckIcon size={16} />
                        Key Highlights
                      </h4>
                      <div className="neuro-points-list">
                        {review.specific_points.map((point, index) => (
                          <div key={index} className="neuro-point-item">
                            <CheckIcon size={14} />
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvement Suggestions */}
                  {review.improvement_suggestions && review.improvement_suggestions.length > 0 && (
                    <div className="neuro-suggestions-section">
                      <h4 className="neuro-section-title">
                        <TrendingUpIcon size={16} />
                        Improvement Suggestions
                      </h4>
                      <div className="neuro-suggestions-list">
                        {review.improvement_suggestions.map((suggestion, index) => (
                          <div key={index} className="neuro-suggestion-item">
                            <TrendingUpIcon size={14} />
                            <span>{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .neuro-reviews-page {
          background: var(--neuro-bg);
          min-height: 100vh;
          padding: 2rem 0;
          color: var(--neuro-text-primary);
        }

        .neuro-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Page Header */
        .neuro-page-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 2rem;
          background: var(--neuro-bg);
          border-radius: var(--neuro-radius-lg);
          box-shadow: 
            8px 8px 20px var(--neuro-shadow-dark),
            -8px -8px 20px var(--neuro-shadow-light);
        }

        .neuro-header-icon {
          background: var(--neuro-bg);
          width: 4rem;
          height: 4rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--neuro-text-accent);
          box-shadow: 
            inset 4px 4px 8px var(--neuro-shadow-inner-dark),
            inset -4px -4px 8px var(--neuro-shadow-inner-light);
        }

        .neuro-page-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: var(--neuro-text-primary);
        }

        .neuro-page-subtitle {
          font-size: 1rem;
          color: var(--neuro-text-secondary);
          margin: 0;
        }

        /* Stats Grid */
        .neuro-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .neuro-stat-card {
          background: var(--neuro-bg);
          padding: 1.5rem;
          border-radius: var(--neuro-radius-lg);
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: var(--neuro-transition);
          box-shadow: 
            8px 8px 20px var(--neuro-shadow-dark),
            -8px -8px 20px var(--neuro-shadow-light);
        }

        .neuro-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 
            12px 12px 25px var(--neuro-shadow-dark),
            -12px -12px 25px var(--neuro-shadow-light);
        }

        .neuro-stat-icon {
          background: var(--neuro-bg);
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--neuro-text-accent);
          box-shadow: 
            inset 4px 4px 8px var(--neuro-shadow-inner-dark),
            inset -4px -4px 8px var(--neuro-shadow-inner-light);
        }

        .neuro-stat-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--neuro-text-primary);
          line-height: 1;
        }

        .neuro-stat-label {
          font-size: 0.875rem;
          color: var(--neuro-text-secondary);
          font-weight: 500;
        }

        /* Controls Bar */
        .neuro-controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: var(--neuro-bg);
          border-radius: var(--neuro-radius-md);
          box-shadow: 
            4px 4px 12px var(--neuro-shadow-dark),
            -4px -4px 12px var(--neuro-shadow-light);
        }

        .neuro-reviews-count {
          font-size: 0.875rem;
          color: var(--neuro-text-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .neuro-filtered-badge {
          background: var(--neuro-text-accent);
          color: white;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
        }

        .neuro-filter-button {
          background: var(--neuro-bg);
          border: none;
          padding: 0.75rem 1rem;
          border-radius: var(--neuro-radius-md);
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--neuro-text-primary);
          position: relative;
          transition: var(--neuro-transition);
          box-shadow: 
            4px 4px 8px var(--neuro-shadow-dark),
            -4px -4px 8px var(--neuro-shadow-light);
        }

        .neuro-filter-button:hover {
          transform: translateY(-1px);
          box-shadow: 
            6px 6px 12px var(--neuro-shadow-dark),
            -6px -6px 12px var(--neuro-shadow-light);
        }

        .neuro-filter-button.active {
          box-shadow: 
            inset 2px 2px 4px var(--neuro-shadow-inner-dark),
            inset -2px -2px 4px var(--neuro-shadow-inner-light);
        }

        .neuro-active-indicator {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: var(--neuro-text-accent);
          border-radius: 50%;
        }

        /* Filter Panel */
        .neuro-filter-panel {
          background: var(--neuro-bg);
          border-radius: var(--neuro-radius-lg);
          padding: 1.5rem;
          box-shadow: 
            8px 8px 20px var(--neuro-shadow-dark),
            -8px -8px 20px var(--neuro-shadow-light);
        }

        .neuro-filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .neuro-filter-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
          color: var(--neuro-text-primary);
        }

        .neuro-close-button {
          background: var(--neuro-bg);
          border: none;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--neuro-text-secondary);
          transition: var(--neuro-transition);
          box-shadow: 
            4px 4px 8px var(--neuro-shadow-dark),
            -4px -4px 8px var(--neuro-shadow-light);
        }

        .neuro-close-button:hover {
          color: var(--neuro-text-primary);
          transform: scale(1.1);
        }

        .neuro-filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .neuro-filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .neuro-filter-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--neuro-text-primary);
        }

        .neuro-select {
          background: var(--neuro-bg);
          border: none;
          padding: 0.75rem;
          border-radius: var(--neuro-radius-sm);
          color: var(--neuro-text-primary);
          font-size: 0.875rem;
          cursor: pointer;
          box-shadow: 
            inset 2px 2px 4px var(--neuro-shadow-inner-dark),
            inset -2px -2px 4px var(--neuro-shadow-inner-light);
        }

        .neuro-select:focus {
          outline: 2px solid var(--neuro-text-accent);
          outline-offset: 2px;
        }

        .neuro-clear-button {
          background: var(--neuro-bg);
          border: none;
          padding: 0.75rem 1rem;
          border-radius: var(--neuro-radius-md);
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--neuro-text-secondary);
          transition: var(--neuro-transition);
          box-shadow: 
            4px 4px 8px var(--neuro-shadow-dark),
            -4px -4px 8px var(--neuro-shadow-light);
        }

        .neuro-clear-button:hover {
          color: var(--neuro-text-primary);
          transform: translateY(-1px);
        }

        /* Reviews List */
        .neuro-reviews-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .neuro-review-card {
          background: var(--neuro-bg);
          border-radius: var(--neuro-radius-lg);
          padding: 1.5rem;
          transition: var(--neuro-transition);
          cursor: pointer;
          box-shadow: 
            8px 8px 20px var(--neuro-shadow-dark),
            -8px -8px 20px var(--neuro-shadow-light);
        }

        .neuro-review-card:hover {
          transform: translateY(-2px);
          box-shadow: 
            12px 12px 25px var(--neuro-shadow-dark),
            -12px -12px 25px var(--neuro-shadow-light);
        }

        .neuro-review-card.expanded {
          transform: scale(1.01);
          box-shadow: 
            12px 12px 30px var(--neuro-shadow-dark),
            -12px -12px 30px var(--neuro-shadow-light);
        }

        .neuro-review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .neuro-review-main-info {
          flex: 1;
        }

        .neuro-restaurant-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .neuro-restaurant-icon {
          background: var(--neuro-bg);
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--neuro-text-accent);
          box-shadow: 
            inset 2px 2px 4px var(--neuro-shadow-inner-dark),
            inset -2px -2px 4px var(--neuro-shadow-inner-light);
        }

        .neuro-restaurant-name {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
          color: var(--neuro-text-primary);
        }

        .neuro-review-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--neuro-text-secondary);
        }

        .neuro-review-rating {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .neuro-stars {
          display: flex;
          gap: 0.25rem;
        }

        .neuro-star-filled {
          color: #fbbf24;
        }

        .neuro-star-empty {
          color: var(--neuro-text-light);
        }

        .neuro-rating-emoji {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .neuro-emoji-excellent { color: #10b981; }
        .neuro-emoji-good { color: #22c55e; }
        .neuro-emoji-okay { color: #f59e0b; }
        .neuro-emoji-poor { color: #ef4444; }
        .neuro-emoji-bad { color: #dc2626; }

        .neuro-expand-button {
          background: var(--neuro-bg);
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--neuro-text-secondary);
          transition: var(--neuro-transition);
          box-shadow: 
            4px 4px 8px var(--neuro-shadow-dark),
            -4px -4px 8px var(--neuro-shadow-light);
        }

        .neuro-expand-button:hover {
          color: var(--neuro-text-primary);
          transform: scale(1.1);
        }

        .neuro-review-summary {
          color: var(--neuro-text-secondary);
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .neuro-review-expanded {
          padding-top: 1.5rem;
          border-top: 2px solid var(--neuro-shadow-dark);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .neuro-section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
          color: var(--neuro-text-primary);
        }

        .neuro-points-list,
        .neuro-suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .neuro-point-item,
        .neuro-suggestion-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--neuro-bg);
          border-radius: var(--neuro-radius-sm);
          color: var(--neuro-text-secondary);
          font-size: 0.875rem;
          line-height: 1.5;
          box-shadow: 
            inset 2px 2px 4px var(--neuro-shadow-inner-dark),
            inset -2px -2px 4px var(--neuro-shadow-inner-light);
        }

        /* Loading, Error, Auth, Empty States */
        .neuro-loading-container,
        .neuro-error-container,
        .neuro-auth-container,
        .neuro-empty-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
        }

        .neuro-loading-card,
        .neuro-error-card,
        .neuro-auth-card,
        .neuro-empty-card {
          background: var(--neuro-bg);
          padding: 3rem;
          border-radius: var(--neuro-radius-lg);
          text-align: center;
          max-width: 500px;
          box-shadow: 
            12px 12px 25px var(--neuro-shadow-dark),
            -12px -12px 25px var(--neuro-shadow-light);
        }

        .neuro-loading-icon,
        .neuro-error-icon,
        .neuro-auth-icon,
        .neuro-empty-icon {
          color: var(--neuro-text-accent);
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }

        .neuro-loading-title,
        .neuro-error-title,
        .neuro-auth-title,
        .neuro-empty-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--neuro-text-primary);
        }

        .neuro-loading-text,
        .neuro-error-text,
        .neuro-auth-text,
        .neuro-empty-text {
          color: var(--neuro-text-secondary);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .neuro-error-button,
        .neuro-auth-button,
        .neuro-empty-button {
          background: var(--neuro-primary);
          color: white;
          border: none;
          padding: 0.875rem 1.5rem;
          border-radius: var(--neuro-radius-md);
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          transition: var(--neuro-transition);
          box-shadow: 
            4px 4px 12px var(--neuro-primary-shadow),
            -2px -2px 8px rgba(255, 255, 255, 0.1);
        }

        .neuro-error-button:hover,
        .neuro-auth-button:hover,
        .neuro-empty-button:hover {
          transform: translateY(-2px);
          box-shadow: 
            6px 6px 16px var(--neuro-primary-shadow),
            -3px -3px 12px rgba(255, 255, 255, 0.1);
        }

        .neuro-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .neuro-container {
            padding: 0 0.5rem;
            gap: 1.5rem;
          }

          .neuro-page-header {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
            padding: 1.5rem;
          }

          .neuro-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .neuro-controls-bar {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .neuro-filter-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .neuro-review-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .neuro-review-rating {
            flex-direction: row;
            justify-content: space-between;
          }

          .neuro-page-title {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .neuro-stats-grid {
            grid-template-columns: 1fr;
          }

          .neuro-stat-card {
            padding: 1rem;
          }

          .neuro-review-card {
            padding: 1rem;
          }

          .neuro-filter-panel {
            padding: 1rem;
          }

          .neuro-stat-number {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MyReviews;