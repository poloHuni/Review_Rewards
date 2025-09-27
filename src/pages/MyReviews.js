// src/pages/MyReviews.js - Beautiful Neumorphic Design
// EXACT SAME FUNCTIONALITY WITH ONLY UI CHANGES
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import ReviewCategories from '../components/Reviews/ReviewCategories';

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Check for dark mode
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

  // EXACT SAME FUNCTIONS AS ORIGINAL
  const getAuthenticatedUser = () => {
    if (currentUser && currentUser.uid) {
      return currentUser;
    }
    return null;
  };

  const getRestaurantName = (review) => {
    if (review.restaurant_name && review.restaurant_name !== 'Restaurant') {
      return review.restaurant_name;
    }
    if (review.restaurant_id && review.restaurant_id !== 'default_restaurant') {
      return review.restaurant_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return review.restaurant_name || 'Unknown Restaurant';
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

  const getUniqueRestaurants = () => {
    return [...new Set(reviews.map(r => getRestaurantName(r)))].filter(name => name !== 'Unknown Restaurant');
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = [...reviews];
    
    // Apply filters - EXACT SAME LOGIC
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
    
    // Apply sorting - EXACT SAME LOGIC
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
    return stars.join('');
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
    return filterBy !== 'all' || restaurantFilter !== 'all' || selectedMonth !== '' || selectedYear !== '' || sortBy !== 'date';
  };

  const getMonthName = (monthIndex) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
  };

  const filteredReviews = getFilteredAndSortedReviews();
  const stats = calculateStats();

  // NEUMORPHIC STYLES
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem)',
      minHeight: '100vh',
      background: 'var(--neuro-bg, #e0e0e0)'
    },
    header: {
      textAlign: 'center',
      marginBottom: 'clamp(2rem, 5vw, 3rem)'
    },
    title: {
      fontSize: 'clamp(2rem, 5vw, 3rem)',
      fontWeight: '800',
      color: 'var(--neuro-text-primary, #2c3e50)',
      marginBottom: '0.5rem',
      lineHeight: '1.2'
    },
    subtitle: {
      fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
      color: 'var(--neuro-text-secondary, #5a6c7d)',
      lineHeight: '1.5'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: 'clamp(1rem, 2vw, 1.5rem)',
      marginBottom: 'clamp(2rem, 4vw, 3rem)'
    },
    statCard: {
      background: 'var(--neuro-bg, #e0e0e0)',
      padding: 'clamp(1.25rem, 3vw, 1.75rem)',
      borderRadius: '20px',
      textAlign: 'center',
      boxShadow: isDarkMode 
        ? '10px 10px 20px rgb(25, 25, 25), -10px -10px 20px rgb(60, 60, 60)'
        : '10px 10px 20px #bebebe, -10px -10px 20px #ffffff',
      transition: 'all 0.3s ease'
    },
    statNumber: {
      fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
      fontWeight: '700',
      color: 'var(--neuro-text-primary, #2c3e50)',
      marginBottom: '0.25rem'
    },
    statLabel: {
      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
      color: 'var(--neuro-text-secondary, #5a6c7d)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    filterBar: {
      background: 'var(--neuro-bg, #e0e0e0)',
      padding: 'clamp(1rem, 2vw, 1.5rem)',
      borderRadius: '25px',
      marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
      boxShadow: 'inset 6px 6px 12px rgba(0,0,0,0.08), inset -6px -6px 12px rgba(255,255,255,0.5)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'clamp(0.5rem, 1.5vw, 1rem)',
      alignItems: 'center'
    },
    select: {
      padding: '0.625rem 1rem',
      borderRadius: '15px',
      border: 'none',
      background: 'var(--neuro-bg, #e0e0e0)',
      color: 'var(--neuro-text-primary, #2c3e50)',
      fontSize: 'clamp(0.8rem, 2vw, 0.875rem)',
      fontWeight: '500',
      cursor: 'pointer',
      boxShadow: isDarkMode
        ? '5px 5px 10px rgb(25, 25, 25), -5px -5px 10px rgb(60, 60, 60)'
        : '4px 4px 8px #bebebe, -4px -4px 8px #ffffff',
      transition: 'all 0.3s ease',
      minWidth: '100px'
    },
    clearButton: {
      padding: '0.625rem 1.25rem',
      borderRadius: '20px',
      border: 'none',
      background: 'linear-gradient(135deg, #f87171, #ef4444)',
      color: 'white',
      fontSize: 'clamp(0.8rem, 2vw, 0.875rem)',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.3s ease'
    },
    reviewCard: {
      background: 'var(--neuro-bg, #e0e0e0)',
      borderRadius: '25px',
      padding: 'clamp(1.25rem, 3vw, 2rem)',
      marginBottom: 'clamp(1.25rem, 2.5vw, 1.75rem)',
      boxShadow: isDarkMode
        ? '12px 12px 24px rgb(25, 25, 25), -12px -12px 24px rgb(60, 60, 60)'
        : '12px 12px 24px #bebebe, -12px -12px 24px #ffffff',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    reviewHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1rem',
      flexWrap: 'wrap',
      gap: '0.75rem'
    },
    restaurantName: {
      fontSize: 'clamp(1.125rem, 3vw, 1.375rem)',
      fontWeight: '700',
      color: 'var(--neuro-text-primary, #2c3e50)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    date: {
      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
      color: 'var(--neuro-text-secondary, #5a6c7d)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    },
    rating: {
      fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    summary: {
      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
      lineHeight: '1.6',
      color: 'var(--neuro-text-secondary, #5a6c7d)',
      marginBottom: '1rem'
    },
    expandIndicator: {
      textAlign: 'center',
      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
      color: 'var(--neuro-text-accent, #667eea)',
      borderTop: '1px solid rgba(0,0,0,0.1)',
      paddingTop: '0.75rem',
      marginTop: '0.75rem',
      fontWeight: '500'
    },
    emptyState: {
      textAlign: 'center',
      padding: 'clamp(3rem, 6vw, 4rem) clamp(1.5rem, 4vw, 2rem)',
      background: 'var(--neuro-bg, #e0e0e0)',
      borderRadius: '30px',
      boxShadow: 'inset 8px 8px 16px rgba(0,0,0,0.1), inset -8px -8px 16px rgba(255,255,255,0.5)'
    },
    ctaButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '1rem 2rem',
      borderRadius: '50px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: 'white',
      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
      fontWeight: '600',
      textDecoration: 'none',
      transition: 'all 0.3s ease',
      boxShadow: isDarkMode
        ? '8px 8px 16px rgb(25, 25, 25), -8px -8px 16px rgb(60, 60, 60)'
        : '8px 8px 16px #bebebe, -8px -8px 16px #ffffff'
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid var(--neuro-bg, #e0e0e0)',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            margin: '0 auto 2rem',
            animation: 'spin 1s linear infinite'
          }} />
          <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', marginBottom: '0.5rem', color: 'var(--neuro-text-primary, #2c3e50)' }}>
            Loading Your Reviews
          </h2>
          <p style={{ color: 'var(--neuro-text-secondary, #5a6c7d)' }}>
            Fetching your dining experiences...
          </p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', marginBottom: '1rem', color: 'var(--neuro-text-primary, #2c3e50)' }}>
            Oops! Something went wrong
          </h2>
          <p style={{ color: 'var(--neuro-text-secondary, #5a6c7d)', marginBottom: '2rem' }}>{error}</p>
          <button onClick={() => window.location.reload()} style={styles.ctaButton}>
            ↻ Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // No user state
  if (!getAuthenticatedUser()) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', marginBottom: '1rem', color: 'var(--neuro-text-primary, #2c3e50)' }}>
            Login Required
          </h2>
          <p style={{ color: 'var(--neuro-text-secondary, #5a6c7d)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
            Please log in to view your delicious review history
          </p>
          <Link to="/login" style={styles.ctaButton}>
            🚀 Login Now
          </Link>
        </div>
      </div>
    );
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🍽️</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '700', color: 'var(--neuro-text-primary, #2c3e50)', marginBottom: '1rem' }}>
            No Food Adventures Yet!
          </h2>
          <p style={{ color: 'var(--neuro-text-secondary, #5a6c7d)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
            Start your culinary journey by sharing your first restaurant experience. Help fellow food lovers discover amazing places!
          </p>
          <Link to="/feedback" style={styles.ctaButton}>
            ✨ Write Your First Review
          </Link>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>My Food Journey</h1>
        <p style={styles.subtitle}>Your personal collection of dining experiences</p>
      </div>

      {/* Stats Dashboard */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.totalReviews}</div>
          <div style={styles.statLabel}>Total Reviews</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.averageRating}</div>
          <div style={styles.statLabel}>Avg Rating</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.restaurantsReviewed}</div>
          <div style={styles.statLabel}>Restaurants</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.25rem' }}>
            {stats.lastReview ? formatDate(stats.lastReview).split(',')[0] : 'N/A'}
          </div>
          <div style={styles.statLabel}>Last Review</div>
        </div>
      </div>

      {/* Filter Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
        <div style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)', color: 'var(--neuro-text-secondary, #5a6c7d)' }}>
          Showing {filteredReviews.length} of {reviews.length} reviews
          {hasActiveFilters() && ' (filtered)'}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '0.875rem 1.75rem',
            borderRadius: '50px',
            border: 'none',
            background: 'var(--neuro-bg, #e0e0e0)',
            color: 'var(--neuro-text-primary, #2c3e50)',
            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: isDarkMode
              ? '8px 8px 16px rgb(25, 25, 25), -8px -8px 16px rgb(60, 60, 60)'
              : '8px 8px 16px #bebebe, -8px -8px 16px #ffffff',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>⚙️</span>
          Filter & Sort
          {hasActiveFilters() && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              width: '20px',
              height: '20px',
              background: 'linear-gradient(135deg, #f87171, #ef4444)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              color: 'white',
              fontWeight: '700'
            }}>
              {[filterBy !== 'all', restaurantFilter !== 'all', selectedMonth !== '', selectedYear !== ''].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel - Beautiful Neumorphic Modal */}
      {showFilters && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setShowFilters(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(5px)',
              zIndex: 999,
              animation: 'fadeIn 0.3s ease'
            }}
          />
          
          {/* Filter Modal */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(90%, 500px)',
            maxHeight: '80vh',
            overflowY: 'auto',
            background: 'var(--neuro-bg, #e0e0e0)',
            borderRadius: '30px',
            padding: 'clamp(1.5rem, 4vw, 2.5rem)',
            boxShadow: isDarkMode
              ? '20px 20px 40px rgb(25, 25, 25), -20px -20px 40px rgb(60, 60, 60)'
              : '20px 20px 60px #bebebe, -20px -20px 60px #ffffff',
            zIndex: 1000,
            animation: 'slideUp 0.3s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                fontWeight: '700',
                color: 'var(--neuro-text-primary, #2c3e50)'
              }}>
                Filter & Sort Reviews
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--neuro-bg, #e0e0e0)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  boxShadow: isDarkMode
                    ? '5px 5px 10px rgb(25, 25, 25), -5px -5px 10px rgb(60, 60, 60)'
                    : '5px 5px 10px #bebebe, -5px -5px 10px #ffffff',
                  transition: 'all 0.3s ease'
                }}
              >
                ✕
              </button>
            </div>

            {/* Sort By Section */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                fontWeight: '600',
                color: 'var(--neuro-text-primary, #2c3e50)',
                marginBottom: '1rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>📊</span>
                Sort By
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {[
                  { value: 'date', label: 'Date', icon: '📅' },
                  { value: 'rating', label: 'Rating', icon: '⭐' },
                  { value: 'restaurant', label: 'Restaurant', icon: '🏪' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: '20px',
                      border: 'none',
                      background: 'var(--neuro-bg, #e0e0e0)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: 'clamp(0.8rem, 2vw, 0.875rem)',
                      fontWeight: '500',
                      color: sortBy === option.value ? 'white' : 'var(--neuro-text-primary, #2c3e50)',
                      boxShadow: sortBy === option.value
                        ? 'inset 5px 5px 10px rgba(0,0,0,0.2), inset -5px -5px 10px rgba(255,255,255,0.1)'
                        : isDarkMode
                          ? '5px 5px 10px rgb(25, 25, 25), -5px -5px 10px rgb(60, 60, 60)'
                          : '5px 5px 10px #bebebe, -5px -5px 10px #ffffff',
                      background: sortBy === option.value
                        ? 'linear-gradient(135deg, #667eea, #764ba2)'
                        : 'var(--neuro-bg, #e0e0e0)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter Section */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                fontWeight: '600',
                color: 'var(--neuro-text-primary, #2c3e50)',
                marginBottom: '1rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>⭐</span>
                Rating Filter
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {[
                  { value: 'all', label: 'All Ratings', icon: '📝' },
                  { value: 'high', label: '4+ Stars', icon: '🌟' },
                  { value: 'low', label: '2- Stars', icon: '⚠️' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFilterBy(option.value)}
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: '20px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: 'clamp(0.8rem, 2vw, 0.875rem)',
                      fontWeight: '500',
                      color: filterBy === option.value ? 'white' : 'var(--neuro-text-primary, #2c3e50)',
                      boxShadow: filterBy === option.value
                        ? 'inset 5px 5px 10px rgba(0,0,0,0.2), inset -5px -5px 10px rgba(255,255,255,0.1)'
                        : isDarkMode
                          ? '5px 5px 10px rgb(25, 25, 25), -5px -5px 10px rgb(60, 60, 60)'
                          : '5px 5px 10px #bebebe, -5px -5px 10px #ffffff',
                      background: filterBy === option.value
                        ? 'linear-gradient(135deg, #667eea, #764ba2)'
                        : 'var(--neuro-bg, #e0e0e0)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Restaurant Filter - Custom Dropdown */}
            {getUniqueRestaurants().length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  fontWeight: '600',
                  color: 'var(--neuro-text-primary, #2c3e50)',
                  marginBottom: '1rem'
                }}>
                  <span style={{ fontSize: '1.25rem' }}>🏪</span>
                  Restaurant
                </label>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => {
                      const dropdown = e.currentTarget.nextElementSibling;
                      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                    }}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      borderRadius: '20px',
                      border: 'none',
                      background: 'var(--neuro-bg, #e0e0e0)',
                      color: 'var(--neuro-text-primary, #2c3e50)',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                      fontWeight: '500',
                      cursor: 'pointer',
                      boxShadow: 'inset 5px 5px 10px rgba(0,0,0,0.08), inset -5px -5px 10px rgba(255,255,255,0.5)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left'
                    }}
                  >
                    {restaurantFilter === 'all' ? 'All Restaurants' : restaurantFilter}
                    <span style={{ fontSize: '0.75rem' }}>▼</span>
                  </button>
                  
                  <ul className="dropdown-menu" style={{
                    display: 'none',
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: 'var(--neuro-bg, #e0e0e0)',
                    borderRadius: '20px',
                    padding: '0.5rem',
                    boxShadow: isDarkMode
                      ? '15px 15px 30px rgb(25, 25, 25), -15px -15px 30px rgb(60, 60, 60)'
                      : '10px 10px 20px #bebebe, -10px -10px 20px #ffffff',
                    zIndex: 1001,
                    listStyle: 'none',
                    margin: 0
                  }}>
                    <li>
                      <a className="dropdown-item" 
                         onClick={(e) => {
                           e.preventDefault();
                           setRestaurantFilter('all');
                           e.target.closest('.dropdown-menu').style.display = 'none';
                         }}
                         style={{
                           display: 'block',
                           padding: '0.75rem 1rem',
                           borderRadius: '12px',
                           color: 'var(--neuro-text-primary, #2c3e50)',
                           textDecoration: 'none',
                           cursor: 'pointer',
                           transition: 'all 0.3s ease',
                           fontSize: 'clamp(0.8rem, 2vw, 0.875rem)',
                           background: restaurantFilter === 'all' ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                         }}
                         onMouseOver={(e) => {
                           e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                         }}
                         onMouseOut={(e) => {
                           e.currentTarget.style.background = restaurantFilter === 'all' ? 'rgba(102, 126, 234, 0.1)' : 'transparent';
                         }}
                      >
                        All Restaurants
                      </a>
                    </li>
                    {getUniqueRestaurants().map(name => (
                      <li key={name}>
                        <a className="dropdown-item"
                           onClick={(e) => {
                             e.preventDefault();
                             setRestaurantFilter(name);
                             e.target.closest('.dropdown-menu').style.display = 'none';
                           }}
                           style={{
                             display: 'block',
                             padding: '0.75rem 1rem',
                             borderRadius: '12px',
                             color: 'var(--neuro-text-primary, #2c3e50)',
                             textDecoration: 'none',
                             cursor: 'pointer',
                             transition: 'all 0.3s ease',
                             fontSize: 'clamp(0.8rem, 2vw, 0.875rem)',
                             background: restaurantFilter === name ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                           }}
                           onMouseOver={(e) => {
                             e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                           }}
                           onMouseOut={(e) => {
                             e.currentTarget.style.background = restaurantFilter === name ? 'rgba(102, 126, 234, 0.1)' : 'transparent';
                           }}
                        >
                          {name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Date Range - Beautiful Neumorphic Design */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                fontWeight: '600',
                color: 'var(--neuro-text-primary, #2c3e50)',
                marginBottom: '1rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>📅</span>
                Date Range
              </label>
              
              {/* Neumorphic Date Range Container */}
              <div style={{
                background: 'var(--neuro-bg, #e0e0e0)',
                borderRadius: '25px',
                padding: '1.5rem',
                boxShadow: 'inset 6px 6px 12px rgba(0,0,0,0.08), inset -6px -6px 12px rgba(255,255,255,0.5)'
              }}>
                {/* Month Selector */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                    color: 'var(--neuro-text-secondary, #5a6c7d)',
                    marginBottom: '0.75rem',
                    display: 'block',
                    fontWeight: '500'
                  }}>
                    Select Month
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                    gap: '0.5rem'
                  }}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedMonth(selectedMonth === index.toString() ? '' : index.toString())}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '15px',
                          border: 'none',
                          background: selectedMonth === index.toString()
                            ? 'linear-gradient(135deg, #667eea, #764ba2)'
                            : 'var(--neuro-bg, #e0e0e0)',
                          color: selectedMonth === index.toString()
                            ? 'white'
                            : 'var(--neuro-text-primary, #2c3e50)',
                          fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                          fontWeight: '500',
                          cursor: 'pointer',
                          boxShadow: selectedMonth === index.toString()
                            ? 'inset 3px 3px 6px rgba(0,0,0,0.2), inset -3px -3px 6px rgba(255,255,255,0.1)'
                            : isDarkMode
                              ? '3px 3px 6px rgb(25, 25, 25), -3px -3px 6px rgb(60, 60, 60)'
                              : '3px 3px 6px #bebebe, -3px -3px 6px #ffffff',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year Selector */}
                <div>
                  <label style={{
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                    color: 'var(--neuro-text-secondary, #5a6c7d)',
                    marginBottom: '0.75rem',
                    display: 'block',
                    fontWeight: '500'
                  }}>
                    Select Year
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    overflowX: 'auto',
                    padding: '0.25rem 0'
                  }}>
                    {[...new Set(reviews.map(r => {
                      if (!r.timestamp) return null;
                      const date = r.timestamp.seconds ? new Date(r.timestamp.seconds * 1000) : new Date(r.timestamp);
                      return date.getFullYear();
                    }).filter(Boolean))].sort((a, b) => b - a).map(year => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(selectedYear === year.toString() ? '' : year.toString())}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '15px',
                          border: 'none',
                          background: selectedYear === year.toString()
                            ? 'linear-gradient(135deg, #667eea, #764ba2)'
                            : 'var(--neuro-bg, #e0e0e0)',
                          color: selectedYear === year.toString()
                            ? 'white'
                            : 'var(--neuro-text-primary, #2c3e50)',
                          fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                          fontWeight: '500',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          boxShadow: selectedYear === year.toString()
                            ? 'inset 3px 3px 6px rgba(0,0,0,0.2), inset -3px -3px 6px rgba(255,255,255,0.1)'
                            : isDarkMode
                              ? '3px 3px 6px rgb(25, 25, 25), -3px -3px 6px rgb(60, 60, 60)'
                              : '3px 3px 6px #bebebe, -3px -3px 6px #ffffff',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Range Buttons */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    {[
                      { label: 'This Month', action: () => {
                        const now = new Date();
                        setSelectedMonth(now.getMonth().toString());
                        setSelectedYear(now.getFullYear().toString());
                      }},
                      { label: 'Last 3 Months', action: () => {
                        // This would need more complex logic
                        setSelectedMonth('');
                        setSelectedYear(new Date().getFullYear().toString());
                      }},
                      { label: 'This Year', action: () => {
                        setSelectedMonth('');
                        setSelectedYear(new Date().getFullYear().toString());
                      }},
                      { label: 'All Time', action: () => {
                        setSelectedMonth('');
                        setSelectedYear('');
                      }}
                    ].map(range => (
                      <button
                        key={range.label}
                        onClick={range.action}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '15px',
                          border: 'none',
                          background: 'var(--neuro-bg, #e0e0e0)',
                          color: 'var(--neuro-text-accent, #667eea)',
                          fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: isDarkMode
                            ? '4px 4px 8px rgb(25, 25, 25), -4px -4px 8px rgb(60, 60, 60)'
                            : '4px 4px 8px #bebebe, -4px -4px 8px #ffffff',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              {hasActiveFilters() && (
                <button
                  onClick={clearAllFilters}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    borderRadius: '25px',
                    border: '2px solid #ef4444',
                    background: 'transparent',
                    color: '#ef4444',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #f87171, #ef4444)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.border = '2px solid #ef4444';
                  }}
                >
                  <span>🗑️</span>
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '25px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: isDarkMode
                    ? '8px 8px 16px rgb(25, 25, 25), -8px -8px 16px rgb(60, 60, 60)'
                    : '8px 8px 16px #bebebe, -8px -8px 16px #ffffff',
                  transition: 'all 0.3s ease'
                }}
              >
                <span>✓</span>
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translate(-50%, -40%);
          }
          to { 
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>

      {/* Reviews List */}
      <div>
        {filteredReviews.map((review) => (
          <div 
            key={review.id}
            style={{
              ...styles.reviewCard,
              transform: expandedReview === review.id ? 'scale(1.02)' : 'scale(1)'
            }}
            onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
          >
            {/* Review Header */}
            <div style={styles.reviewHeader}>
              <div>
                <div style={styles.restaurantName}>
                  🏪 {getRestaurantName(review)}
                </div>
                <div style={styles.date}>
                  📅 {formatDate(review)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={styles.rating}>
                  {renderStars(review.sentiment_score)}
                </div>
                <div style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>
                  {getRatingEmoji(review.sentiment_score)}
                </div>
              </div>
            </div>

            {/* Review Summary */}
            <div style={styles.summary}>
              {review.summary || 'No summary available'}
            </div>

            {/* Expand Indicator */}
            <div style={styles.expandIndicator}>
              {expandedReview === review.id ? '▼ Click to collapse' : '▶ Click for details'}
            </div>

            {/* Expanded Content */}
            {expandedReview === review.id && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                {/* Review Categories */}
                <ReviewCategories 
                  review={review} 
                  layout="grid" 
                  showEmptyCategories={true}
                  style={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}
                />
                
                {/* Specific Points */}
                {review.specific_points && review.specific_points.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ 
                      fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', 
                      fontWeight: '700',
                      color: 'var(--neuro-text-primary, #2c3e50)',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      💡 Key Highlights
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {review.specific_points.map((point, index) => (
                        <div key={index} style={{
                          padding: '0.75rem',
                          background: 'var(--neuro-bg, #e0e0e0)',
                          borderRadius: '12px',
                          fontSize: 'clamp(0.8rem, 2vw, 0.875rem)',
                          color: 'var(--neuro-text-secondary, #5a6c7d)',
                          boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.05), inset -3px -3px 6px rgba(255,255,255,0.5)'
                        }}>
                          ✓ {point}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvement Suggestions */}
                {review.improvement_suggestions && review.improvement_suggestions.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ 
                      fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', 
                      fontWeight: '700',
                      color: 'var(--neuro-text-primary, #2c3e50)',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      💭 Suggestions for Improvement
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {review.improvement_suggestions.map((suggestion, index) => (
                        <div key={index} style={{
                          padding: '0.75rem',
                          background: 'rgba(245, 158, 11, 0.1)',
                          borderRadius: '12px',
                          fontSize: 'clamp(0.8rem, 2vw, 0.875rem)',
                          color: '#f59e0b',
                          border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          💡 {suggestion}
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
      <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
        <Link to="/feedback" style={styles.ctaButton}>
          ✨ Share Another Food Adventure
        </Link>
      </div>
    </div>
  );
};

export default MyReviews;