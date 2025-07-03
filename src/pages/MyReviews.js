// src/pages/MyReviews.js - Food Review Themed Design
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import ReviewCategories from '../components/Reviews/ReviewCategories'; // ADD THIS LINE

const MyReviews = () => {
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

  // Enhanced user checking function
  const getAuthenticatedUser = () => {
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
      
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('user_id', '==', authenticatedUser.uid),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(reviewsQuery);
      
      const reviewsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
      
      console.log('✅ Fetched reviews count:', reviewsData.length);
      setReviews(reviewsData);
    } catch (err) {
      console.error('❌ Error fetching reviews:', err);
      setError(`Failed to load reviews: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getUniqueRestaurants = () => {
    const restaurants = reviews
      .map(review => review.restaurant_name)
      .filter(name => name && name.trim() !== '')
      .filter((name, index, arr) => arr.indexOf(name) === index)
      .sort();
    return restaurants;
  };

  const getAvailableYears = () => {
    const years = reviews
      .map(review => {
        if (!review.timestamp) return null;
        let date;
        if (review.timestamp.seconds) {
          date = new Date(review.timestamp.seconds * 1000);
        } else {
          date = new Date(review.timestamp);
        }
        return date.getFullYear();
      })
      .filter(year => year !== null)
      .filter((year, index, arr) => arr.indexOf(year) === index)
      .sort((a, b) => b - a); // Most recent first
    return years;
  };

  const getAvailableMonths = () => {
    if (!selectedYear) return [];
    
    const months = reviews
      .map(review => {
        if (!review.timestamp) return null;
        let date;
        if (review.timestamp.seconds) {
          date = new Date(review.timestamp.seconds * 1000);
        } else {
          date = new Date(review.timestamp);
        }
        if (date.getFullYear() !== parseInt(selectedYear)) return null;
        return date.getMonth();
      })
      .filter(month => month !== null)
      .filter((month, index, arr) => arr.indexOf(month) === index)
      .sort((a, b) => b - a); // Most recent first
    
    return months;
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = reviews;
    
    // Apply rating filters
    if (filterBy !== 'all') {
      filtered = filtered.filter(review => {
        const score = review.sentiment_score || 0;
        if (filterBy === 'high') return score >= 4;
        if (filterBy === 'medium') return score >= 2 && score < 4;
        if (filterBy === 'low') return score < 2;
        return true;
      });
    }

    // Apply restaurant filter
    if (restaurantFilter !== 'all') {
      filtered = filtered.filter(review => 
        review.restaurant_name === restaurantFilter
      );
    }

    // Apply date filters (month/year)
    if (selectedYear || selectedMonth) {
      filtered = filtered.filter(review => {
        if (!review.timestamp) return true;
        
        let reviewDate;
        if (review.timestamp.seconds) {
          reviewDate = new Date(review.timestamp.seconds * 1000);
        } else {
          reviewDate = new Date(review.timestamp);
        }
        
        if (selectedYear && reviewDate.getFullYear() !== parseInt(selectedYear)) {
          return false;
        }
        if (selectedMonth && reviewDate.getMonth() !== parseInt(selectedMonth)) {
          return false;
        }
        return true;
      });
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.sentiment_score || 0) - (a.sentiment_score || 0);
      }
      if (sortBy === 'restaurant') {
        return (a.restaurant_name || '').localeCompare(b.restaurant_name || '');
      }
      // Default: sort by date
      return new Date(b.timestamp?.seconds ? b.timestamp.seconds * 1000 : b.timestamp) - 
             new Date(a.timestamp?.seconds ? a.timestamp.seconds * 1000 : a.timestamp);
    });
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
      .filter(score => typeof score === 'number' && score > 0);

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
        stars.push('⭐');
      } else {
        stars.push('☆');
      }
    }
    
    return (
      <div style={{ fontSize: '18px', display: 'flex', gap: '2px' }}>
        {stars.join('')} ({numRating}/5)
      </div>
    );
  };

  const getRatingEmoji = (score) => {
    if (score >= 4.5) return '🤩';
    if (score >= 4) return '😋';
    if (score >= 3) return '😊';
    if (score >= 2) return '😐';
    return '😔';
  };

  const clearAllFilters = () => {
    setFilterBy('all');
    setRestaurantFilter('all');
    setSelectedMonth('');
    setSelectedYear('');
    setSortBy('date');
  };

  const hasActiveFilters = () => {
    return filterBy !== 'all' || 
           restaurantFilter !== 'all' || 
           selectedMonth !== '' || 
           selectedYear !== '' ||
           sortBy !== 'date';
  };

  const getMonthName = (monthIndex) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
  };

  const filteredReviews = getFilteredAndSortedReviews();
  const stats = calculateStats();

  // Loading state
  if (loading) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        color: 'white',
        minHeight: '100vh',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          border: '4px solid rgba(139, 92, 246, 0.3)',
          borderTop: '4px solid #8b5cf6',
          borderRadius: '50%',
          margin: '0 auto 30px auto',
          animation: 'spin 1s linear infinite'
        }} />
        <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>
          🍽️ Loading Your Food Adventures...
        </h2>
        <p style={{ opacity: 0.8 }}>Gathering your delicious memories</p>
        
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        color: 'white',
        minHeight: '100vh'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            fontSize: '60px',
            marginBottom: '20px'
          }}>
            🚨
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '15px', color: '#ef4444' }}>
            Oops! Something went wrong
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '30px' }}>
            {error}
          </p>
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={fetchReviews}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '10px',
                background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              🔄 Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              ↻ Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No user state
  if (!getAuthenticatedUser()) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        color: 'white',
        minHeight: '100vh'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            fontSize: '60px',
            marginBottom: '20px'
          }}>
            🔐
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>
            Login Required
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '30px' }}>
            Please log in to view your delicious review history
          </p>
          <Link 
            to="/login"
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
              color: 'white',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.3s ease'
            }}
          >
            🚀 Login Now
          </Link>
        </div>
      </div>
    );
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        color: 'white',
        minHeight: '100vh'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            fontSize: '80px',
            marginBottom: '20px'
          }}>
            🍽️
          </div>
          <h2 style={{ 
            fontSize: '28px', 
            marginBottom: '15px',
            background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            No Food Adventures Yet!
          </h2>
          <p style={{ 
            fontSize: '16px', 
            opacity: 0.8, 
            marginBottom: '30px',
            maxWidth: '400px',
            margin: '0 auto 30px auto',
            lineHeight: '1.6'
          }}>
            Start your culinary journey by sharing your first restaurant experience. 
            Help fellow food lovers discover amazing places!
          </p>
          <Link 
            to="/feedback"
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
              color: 'white',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.3s ease'
            }}
          >
            🎤 Leave Your First Review
          </Link>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      color: 'white',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '32px',
          marginBottom: '10px',
          background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          🍽️ My Food Adventures
        </h1>
        <p style={{ fontSize: '16px', opacity: 0.8 }}>
          Your culinary journey and restaurant experiences
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Total Reviews */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '20px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '30px', marginBottom: '5px' }}>📝</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
            {stats.totalReviews}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Total Reviews</div>
        </div>

        {/* Average Rating */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '20px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '30px', marginBottom: '5px' }}>
            {getRatingEmoji(stats.averageRating)}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
            {stats.averageRating}/5
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Average Rating</div>
        </div>

        {/* Restaurants Visited */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '20px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '30px', marginBottom: '5px' }}>🏪</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
            {stats.restaurantsReviewed}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Restaurants</div>
        </div>

        {/* Last Review */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '20px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '30px', marginBottom: '5px' }}>📅</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
            {stats.lastReview ? formatDate(stats.lastReview) : 'Never'}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Last Review</div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        padding: '25px',
        marginBottom: '20px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🔍 Filter & Sort Your Adventures
          </h3>
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 'bold',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.2)';
              }}
            >
              🗑️ Clear All
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          {/* Rating Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px',
              opacity: 0.9
            }}>
              ⭐ Rating Filter
            </label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '10px',
                color: 'white',
                outline: 'none',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#8b5cf6';
                e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.25)';
                e.target.style.boxShadow = '0 0 0 2px rgba(139, 92, 246, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="all" style={{ 
                color: 'white', 
                backgroundColor: '#1e293b',
                padding: '8px'
              }}>All Ratings</option>
              <option value="high" style={{ 
                color: 'white', 
                backgroundColor: '#1e293b',
                padding: '8px'
              }}>Excellent (4-5) 🤩</option>
              <option value="medium" style={{ 
                color: 'white', 
                backgroundColor: '#1e293b',
                padding: '8px'
              }}>Good (2-3) 😊</option>
              <option value="low" style={{ 
                color: 'white', 
                backgroundColor: '#1e293b',
                padding: '8px'
              }}>Needs Work (1-2) 😔</option>
            </select>
          </div>

          {/* Restaurant Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px',
              opacity: 0.9
            }}>
              🏪 Restaurant Filter
            </label>
            <select
              value={restaurantFilter}
              onChange={(e) => setRestaurantFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '10px',
                color: 'white',
                outline: 'none',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#8b5cf6';
                e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.25)';
                e.target.style.boxShadow = '0 0 0 2px rgba(139, 92, 246, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="all" style={{ 
                color: 'white', 
                backgroundColor: '#1e293b',
                padding: '8px'
              }}>All Restaurants</option>
              {getUniqueRestaurants().map(restaurant => (
                <option 
                  key={restaurant} 
                  value={restaurant}
                  style={{ 
                    color: 'white', 
                    backgroundColor: '#1e293b',
                    padding: '8px'
                  }}
                >
                  {restaurant}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px',
              opacity: 0.9
            }}>
              📊 Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '10px',
                color: 'white',
                outline: 'none',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#8b5cf6';
                e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.25)';
                e.target.style.boxShadow = '0 0 0 2px rgba(139, 92, 246, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="date" style={{ 
                color: 'white', 
                backgroundColor: '#1e293b',
                padding: '8px'
              }}>Newest First</option>
              <option value="rating" style={{ 
                color: 'white', 
                backgroundColor: '#1e293b',
                padding: '8px'
              }}>Highest Rated</option>
              <option value="restaurant" style={{ 
                color: 'white', 
                backgroundColor: '#1e293b',
                padding: '8px'
              }}>Restaurant A-Z</option>
            </select>
          </div>
        </div>

        {/* Date Filter Section */}
        <div style={{
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: 0.9
          }}>
            📅 Filter by Date
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '15px'
          }}>
            {/* Year Filter */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '8px',
                opacity: 0.9
              }}>
                📆 Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedMonth(''); // Reset month when year changes
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  backgroundColor: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '10px',
                  color: 'white',
                  outline: 'none',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#a855f7';
                  e.target.style.backgroundColor = 'rgba(168, 85, 247, 0.25)';
                  e.target.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(168, 85, 247, 0.4)';
                  e.target.style.backgroundColor = 'rgba(168, 85, 247, 0.15)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="" style={{ 
                  color: 'white', 
                  backgroundColor: '#1e293b',
                  padding: '8px'
                }}>All Years</option>
                {getAvailableYears().map(year => (
                  <option 
                    key={year} 
                    value={year}
                    style={{ 
                      color: 'white', 
                      backgroundColor: '#1e293b',
                      padding: '8px'
                    }}
                  >
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div style={{ opacity: selectedYear ? 1 : 0.5 }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '8px',
                opacity: 0.9
              }}>
                🗓️ Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={!selectedYear}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  backgroundColor: selectedYear ? 'rgba(236, 72, 153, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                  border: selectedYear ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid rgba(107, 114, 128, 0.4)',
                  borderRadius: '10px',
                  color: selectedYear ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  outline: 'none',
                  cursor: selectedYear ? 'pointer' : 'not-allowed',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  if (selectedYear) {
                    e.target.style.borderColor = '#ec4899';
                    e.target.style.backgroundColor = 'rgba(236, 72, 153, 0.25)';
                    e.target.style.boxShadow = '0 0 0 2px rgba(236, 72, 153, 0.3)';
                  }
                }}
                onBlur={(e) => {
                  if (selectedYear) {
                    e.target.style.borderColor = 'rgba(236, 72, 153, 0.4)';
                    e.target.style.backgroundColor = 'rgba(236, 72, 153, 0.15)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                <option value="" style={{ 
                  color: 'white', 
                  backgroundColor: '#1e293b',
                  padding: '8px'
                }}>All Months</option>
                {getAvailableMonths().map(monthIndex => (
                  <option 
                    key={monthIndex} 
                    value={monthIndex}
                    style={{ 
                      color: 'white', 
                      backgroundColor: '#1e293b',
                      padding: '8px'
                    }}
                  >
                    {getMonthName(monthIndex)}
                  </option>
                ))}
              </select>
              {!selectedYear && (
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginTop: '5px',
                  fontStyle: 'italic'
                }}>
                  Select a year first
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Results Summary */}
        <div style={{
          fontSize: '14px',
          opacity: 0.8,
          textAlign: 'center',
          marginTop: '20px',
          paddingTop: '15px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          Showing <span style={{ fontWeight: 'bold', color: '#8b5cf6' }}>{filteredReviews.length}</span> of <span style={{ fontWeight: 'bold' }}>{reviews.length}</span> food adventures 🍴
          {hasActiveFilters() && (
            <span style={{ marginLeft: '10px', color: '#f59e0b' }}>
              (Filtered)
            </span>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              padding: '25px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {/* Review Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '15px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🏪 {review.restaurant_name || 'Restaurant'}
                </div>
                <div style={{
                  fontSize: '14px',
                  opacity: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  flexWrap: 'wrap'
                }}>
                  <span>📅 {formatDate(review)}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {renderStars(review.sentiment_score)}
                <div style={{
                  fontSize: '24px',
                  marginTop: '5px'
                }}>
                  {getRatingEmoji(review.sentiment_score)}
                </div>
              </div>
            </div>

            {/* Review Summary */}
            <div style={{
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '15px',
              opacity: 0.9
            }}>
              {review.summary || 'No summary available'}
            </div>

            {/* Expand/Collapse Indicator */}
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              opacity: 0.7,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '15px'
            }}>
              {expandedReview === review.id ? '👆 Click to collapse' : '👇 Click to see full details'}
            </div>

            {/* Expanded Content */}
            {expandedReview === review.id && (
              <div style={{
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {/* Detailed Breakdown - Updated for Consistency */}
                <div style={{ marginBottom: '20px' }}>
                  <ReviewCategories 
                    review={review} 
                    layout="grid" 
                    showEmptyCategories={true}
                    style={{
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '15px'
                    }}
                  />
                </div>
                {/* Specific Points */}
                {review.specific_points && review.specific_points.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🎯 Key Highlights
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {review.specific_points.map((point, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            fontSize: '14px',
                            opacity: 0.9
                          }}
                        >
                          <span style={{ color: '#22c55e' }}>✓</span>
                          {point}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvement Suggestions */}
                {review.improvement_suggestions && review.improvement_suggestions.length > 0 && (
                  <div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      💡 Suggestions for Improvement
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {review.improvement_suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            fontSize: '14px',
                            opacity: 0.9
                          }}
                        >
                          <span style={{ color: '#f59e0b' }}>💭</span>
                          {suggestion}
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

      {/* Add New Review Button */}
      <div style={{ textAlign: 'center', paddingTop: '20px' }}>
        <Link 
          to="/feedback"
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '10px',
            background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
            color: 'white',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.4)';
          }}
        >
          🎤 Share Another Food Adventure
        </Link>
      </div>
    </div>
  );
};

export default MyReviews;