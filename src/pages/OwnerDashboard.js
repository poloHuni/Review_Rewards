// src/pages/OwnerDashboard.js - Food Review Themed Design
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getRestaurantsByOwner, 
  saveRestaurant, 
  deleteRestaurant,
  getRestaurantAnalytics,  // Fixed: changed from getOwnerAnalytics
  verifyOwnerPassword 
} from '../services/restaurantService';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatDate } from '../utils/dateUtils';
import ReviewCategories from '../components/Reviews/ReviewCategories'; // ADD THIS LINE

const OwnerDashboard = () => {
  const { currentUser, isOwner } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [restaurants, setRestaurants] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Reviews filtering state
  const [selectedRestaurantFilter, setSelectedRestaurantFilter] = useState('');
  const [reviewSortBy, setReviewSortBy] = useState('date-desc');
  const [reviewSearchTerm, setReviewSearchTerm] = useState('');
  const [expandedReview, setExpandedReview] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    description: '',
    cuisine_type: '',
    price_range: '$',
    operating_hours: {
      monday: { open: '09:00', close: '21:00', closed: false },
      tuesday: { open: '09:00', close: '21:00', closed: false },
      wednesday: { open: '09:00', close: '21:00', closed: false },
      thursday: { open: '09:00', close: '21:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '09:00', close: '22:00', closed: false },
      sunday: { open: '10:00', close: '20:00', closed: false }
    }
  });

  // Get all reviews for owner's restaurants
  const getReviewsForOwnerRestaurants = async (restaurantIds) => {
    try {
      if (!restaurantIds || restaurantIds.length === 0) {
        return [];
      }

      const reviewsCollection = collection(db, 'reviews');
      const reviewsQuery = query(
        reviewsCollection,
        where('restaurant_id', 'in', restaurantIds.slice(0, 10)), // Firestore 'in' limit is 10
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(reviewsQuery);
      const reviews = [];
      
      querySnapshot.forEach((doc) => {
        reviews.push({ id: doc.id, ...doc.data() });
      });
      
      // If we have more than 10 restaurants, we need to make additional queries
      if (restaurantIds.length > 10) {
        const remainingIds = restaurantIds.slice(10);
        const additionalReviews = await getReviewsForOwnerRestaurants(remainingIds);
        reviews.push(...additionalReviews);
      }
      
      return reviews;
    } catch (error) {
      console.error('Error getting reviews for owner restaurants:', error);
      return [];
    }
  };

  // Calculate analytics from all restaurant data
  const calculateOwnerAnalytics = (restaurantsData) => {
    try {
      let totalReviews = 0;
      let totalSentiment = 0;
      let sentimentCount = 0;
      let thisMonthReviews = 0;
      let positiveReviews = 0;
      
      const thisMonth = new Date();
      thisMonth.setMonth(thisMonth.getMonth());
      
      restaurantsData.forEach(restaurant => {
        if (restaurant.analytics && restaurant.analytics.reviews) {
          const reviews = restaurant.analytics.reviews;
          totalReviews += reviews.length;
          
          reviews.forEach(review => {
            // Count this month's reviews
            const reviewDate = review.timestamp?.toDate ? review.timestamp.toDate() : new Date(review.timestamp);
            if (reviewDate.getMonth() === thisMonth.getMonth() && 
                reviewDate.getFullYear() === thisMonth.getFullYear()) {
              thisMonthReviews++;
            }
            
            // Calculate sentiment/rating
            const sentiment = review.sentiment_score || review.rating;
            if (typeof sentiment === 'number' && sentiment > 0) {
              totalSentiment += sentiment;
              sentimentCount++;
              
              if (sentiment >= 4) {
                positiveReviews++;
              }
            }
          });
        }
      });

      const averageRating = sentimentCount > 0 ? totalSentiment / sentimentCount : 0;
      const satisfactionRate = totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : 0;

      return {
        totalReviews,
        thisMonthReviews,
        averageRating,
        positiveReviews,
        satisfactionRate
      };
    } catch (error) {
      console.error('Error calculating owner analytics:', error);
      return {
        totalReviews: 0,
        thisMonthReviews: 0,
        averageRating: 0,
        positiveReviews: 0,
        satisfactionRate: 0
      };
    }
  };

  // Load data
  useEffect(() => {
    if (isOwner && passwordVerified) {
      loadDashboardData();
    }
  }, [isOwner, passwordVerified]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const ownerId = currentUser.uid;
      
      // First get all restaurants owned by this owner
      const restaurantsData = await getRestaurantsByOwner(ownerId);
      
      // Get restaurant IDs for fetching reviews
      const restaurantIds = restaurantsData.map(r => r.restaurant_id || r.id);
      
      // Get all reviews for owner's restaurants
      const allReviewsData = await getReviewsForOwnerRestaurants(restaurantIds);
      
      // Then get analytics for each restaurant
      const restaurantsWithAnalytics = await Promise.all(
        restaurantsData.map(async (restaurant) => {
          try {
            const restaurantAnalytics = await getRestaurantAnalytics(restaurant.restaurant_id || restaurant.id);
            return {
              ...restaurant,
              analytics: restaurantAnalytics
            };
          } catch (error) {
            console.error(`Error getting analytics for restaurant ${restaurant.restaurant_id}:`, error);
            return {
              ...restaurant,
              analytics: {
                totalReviews: 0,
                averageRating: 0,
                reviews: []
              }
            };
          }
        })
      );
      
      // Calculate overall analytics
      const ownerAnalytics = calculateOwnerAnalytics(restaurantsWithAnalytics);
      
      setRestaurants(restaurantsWithAnalytics || []);
      setAnalytics(ownerAnalytics || {});
      setAllReviews(allReviewsData || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get restaurant name by ID
  const getRestaurantName = (restaurantId) => {
    const restaurant = restaurants.find(r => (r.restaurant_id || r.id) === restaurantId);
    return restaurant ? restaurant.name : 'Unknown Restaurant';
  };

  // Filter and sort reviews
  const getFilteredAndSortedReviews = () => {
    let filtered = allReviews;
    
    // Filter by restaurant
    if (selectedRestaurantFilter) {
      filtered = filtered.filter(review => review.restaurant_id === selectedRestaurantFilter);
    }
    
    // Filter by search term
    if (reviewSearchTerm) {
      filtered = filtered.filter(review => 
        review.summary?.toLowerCase().includes(reviewSearchTerm.toLowerCase()) ||
        getRestaurantName(review.restaurant_id).toLowerCase().includes(reviewSearchTerm.toLowerCase()) ||
        review.food_quality?.toLowerCase().includes(reviewSearchTerm.toLowerCase()) ||
        review.service?.toLowerCase().includes(reviewSearchTerm.toLowerCase()) ||
        review.user_email?.toLowerCase().includes(reviewSearchTerm.toLowerCase())
      );
    }
    
    // Filter by date
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
    
    // Sort reviews
    filtered.sort((a, b) => {
      switch (reviewSortBy) {
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

  // Get available years from reviews
  const getAvailableYears = () => {
    const years = allReviews
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
      .sort((a, b) => b - a);
    return years;
  };

  // Get available months for selected year
  const getAvailableMonths = () => {
    if (!selectedYear) return [];
    
    const months = allReviews
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
      .sort((a, b) => b - a);
    
    return months;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const restaurantData = {
        ...formData,
        owner_id: currentUser.uid,
        ...(editingRestaurant && { restaurant_id: editingRestaurant.restaurant_id || editingRestaurant.id })
      };

      await saveRestaurant(restaurantData, currentUser.uid);
      await loadDashboardData();
      setShowAddForm(false);
      setEditingRestaurant(null);
      resetForm();
    } catch (err) {
      console.error('Error saving restaurant:', err);
      setError('Failed to save restaurant. Please try again.');
    }
  };

  // Handle password verification
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (verifyOwnerPassword(ownerPassword)) {
      setPasswordVerified(true);
      setError(null);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  // Handle restaurant deletion
  const handleDelete = async (restaurantId) => {
    try {
      await deleteRestaurant(restaurantId);
      await loadDashboardData();
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting restaurant:', err);
      setError('Failed to delete restaurant. Please try again.');
    }
  };

  // Handle edit
  const handleEdit = (restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      description: restaurant.description || '',
      cuisine_type: restaurant.cuisine_type || '',
      price_range: restaurant.price_range || '$',
      operating_hours: restaurant.operating_hours || {
        monday: { open: '09:00', close: '21:00', closed: false },
        tuesday: { open: '09:00', close: '21:00', closed: false },
        wednesday: { open: '09:00', close: '21:00', closed: false },
        thursday: { open: '09:00', close: '21:00', closed: false },
        friday: { open: '09:00', close: '22:00', closed: false },
        saturday: { open: '09:00', close: '22:00', closed: false },
        sunday: { open: '10:00', close: '20:00', closed: false }
      }
    });
    setShowAddForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      description: '',
      cuisine_type: '',
      price_range: '$',
      operating_hours: {
        monday: { open: '09:00', close: '21:00', closed: false },
        tuesday: { open: '09:00', close: '21:00', closed: false },
        wednesday: { open: '09:00', close: '21:00', closed: false },
        thursday: { open: '09:00', close: '21:00', closed: false },
        friday: { open: '09:00', close: '22:00', closed: false },
        saturday: { open: '09:00', close: '22:00', closed: false },
        sunday: { open: '10:00', close: '20:00', closed: false }
      }
    });
  };

  // Password verification screen
  if (!passwordVerified) {
    return (
      <div style={{
        maxWidth: '500px',
        margin: '100px auto',
        padding: '40px 20px',
        color: 'white'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔐</div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '10px',
            background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Owner Access Required
          </h2>
          <p style={{ 
            fontSize: '16px', 
            opacity: 0.8, 
            marginBottom: '30px' 
          }}>
            Please enter the owner password to access the dashboard
          </p>
          
          <form onSubmit={handlePasswordSubmit}>
            <div style={{ position: 'relative', marginBottom: '25px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="Enter owner password"
                style={{
                  width: '100%',
                  padding: '15px 50px 15px 15px',
                  fontSize: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  outline: 'none'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '15px',
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
              🚀 Access Dashboard
            </button>
            
            {error && (
              <div style={{
                color: '#fca5a5',
                fontSize: '14px',
                marginTop: '15px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(139, 92, 246, 0.3)',
            borderTop: '4px solid #8b5cf6',
            borderRadius: '50%',
            margin: '0 auto 20px auto',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ fontSize: '16px', opacity: 0.8 }}>
            Loading your restaurant data...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !passwordVerified) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '100px auto',
        padding: '40px 20px',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          borderRadius: '20px',
          padding: '40px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(220, 38, 38, 0.3)'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>
            Oops! Something went wrong
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '25px' }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
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
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // Overview Tab Component
  const OverviewTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '25px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '15px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              📝
            </div>
            <span style={{
              fontSize: '12px',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              color: '#34d399',
              padding: '4px 8px',
              borderRadius: '12px'
            }}>
              +{analytics.thisMonthReviews || 0} this month
            </span>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            {analytics.totalReviews || 0}
          </h3>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>Total Reviews</p>
        </div>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '25px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '15px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              ⭐
            </div>
            <span style={{
              fontSize: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              color: '#fbbf24',
              padding: '4px 8px',
              borderRadius: '12px'
            }}>
              rating
            </span>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            {analytics.averageRating ? analytics.averageRating.toFixed(1) : '0.0'}
          </h3>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>Average Rating</p>
        </div>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '25px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '15px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              😊
            </div>
            <span style={{
              fontSize: '12px',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              color: '#34d399',
              padding: '4px 8px',
              borderRadius: '12px'
            }}>
              satisfaction
            </span>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            {analytics.satisfactionRate || 0}%
          </h3>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>Satisfaction Rate</p>
        </div>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '25px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '15px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🏪
            </div>
            <span style={{
              fontSize: '12px',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              color: '#a78bfa',
              padding: '4px 8px',
              borderRadius: '12px'
            }}>
              active
            </span>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            {restaurants.length}
          </h3>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>Restaurants</p>
        </div>
      </div>
    </div>
  );

  // Restaurants Tab Component
  const RestaurantsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
          🏪 Your Restaurants ({restaurants.length})
        </h2>
        <button
          onClick={() => {
            setEditingRestaurant(null);
            resetForm();
            setShowAddForm(true);
          }}
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
          ➕ Add Restaurant
        </button>
      </div>

      {restaurants.length === 0 ? (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '40px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🍽️</div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
            No Restaurants Yet
          </h3>
          <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '25px' }}>
            Add your first restaurant to start collecting customer feedback!
          </p>
          <button
            onClick={() => {
              setEditingRestaurant(null);
              resetForm();
              setShowAddForm(true);
            }}
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
            ➕ Add Your First Restaurant
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.restaurant_id || restaurant.id}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                padding: '25px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '15px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}>
                    {restaurant.name}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    opacity: 0.8,
                    marginBottom: '10px'
                  }}>
                    📍 {restaurant.address}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginBottom: '15px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      color: '#60a5fa',
                      padding: '4px 8px',
                      borderRadius: '12px'
                    }}>
                      {restaurant.cuisine_type || 'Various'}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      color: '#34d399',
                      padding: '4px 8px',
                      borderRadius: '12px'
                    }}>
                      {restaurant.price_range || '$'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div>
                  <p style={{ fontSize: '12px', opacity: 0.6, marginBottom: '5px' }}>
                    Reviews
                  </p>
                  <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {restaurant.analytics?.totalReviews || 0}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', opacity: 0.6, marginBottom: '5px' }}>
                    Rating
                  </p>
                  <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    ⭐ {restaurant.analytics?.averageRating?.toFixed(1) || '0.0'}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '10px'
              }}>
                <button
                  onClick={() => handleEdit(restaurant)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(restaurant.restaurant_id || restaurant.id)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    border: '1px solid rgba(220, 38, 38, 0.5)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '30px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
              Delete Restaurant?
            </h3>
            <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '25px' }}>
              This action cannot be undone. All associated data will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Restaurant Form */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '30px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {editingRestaurant ? '✏️ Edit Restaurant' : '➕ Add Restaurant'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingRestaurant(null);
                  resetForm();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter restaurant name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                    Cuisine Type
                  </label>
                  <select
                    value={formData.cuisine_type}
                    onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      outline: 'none'
                    }}
                  >
                    <option value="" style={{ backgroundColor: '#1f2937' }}>Select cuisine type</option>
                    <option value="American" style={{ backgroundColor: '#1f2937' }}>American</option>
                    <option value="Italian" style={{ backgroundColor: '#1f2937' }}>Italian</option>
                    <option value="Chinese" style={{ backgroundColor: '#1f2937' }}>Chinese</option>
                    <option value="Japanese" style={{ backgroundColor: '#1f2937' }}>Japanese</option>
                    <option value="Mexican" style={{ backgroundColor: '#1f2937' }}>Mexican</option>
                    <option value="Indian" style={{ backgroundColor: '#1f2937' }}>Indian</option>
                    <option value="French" style={{ backgroundColor: '#1f2937' }}>French</option>
                    <option value="Thai" style={{ backgroundColor: '#1f2937' }}>Thai</option>
                    <option value="Mediterranean" style={{ backgroundColor: '#1f2937' }}>Mediterranean</option>
                    <option value="Other" style={{ backgroundColor: '#1f2937' }}>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                  Price Range
                </label>
                <select
                  value={formData.price_range}
                  onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    outline: 'none'
                  }}
                >
                  <option value="$" style={{ backgroundColor: '#1f2937' }}>$ - Budget Friendly</option>
                  <option value="$$" style={{ backgroundColor: '#1f2937' }}>$$ - Moderate</option>
                  <option value="$$$" style={{ backgroundColor: '#1f2937' }}>$$$ - Upscale</option>
                  <option value="$$$$" style={{ backgroundColor: '#1f2937' }}>$$$$ - Fine Dining</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your restaurant..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingRestaurant(null);
                    resetForm();
                  }}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '10px',
                    backgroundColor: 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
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
                  {editingRestaurant ? 'Update Restaurant' : 'Add Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Reviews Tab Component
  const ReviewsTab = () => {
    const filteredReviews = getFilteredAndSortedReviews();
    const availableYears = getAvailableYears();
    const availableMonths = getAvailableMonths();
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
            💬 Customer Reviews
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.8 }}>
            All reviews from customers across your restaurants
          </p>
        </div>

        {/* Reviews Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>📝</span>
              <span style={{ fontSize: '14px', opacity: 0.8 }}>Total Reviews</span>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>{allReviews.length}</h3>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>⭐</span>
              <span style={{ fontSize: '14px', opacity: 0.8 }}>Avg Rating</span>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {allReviews.length > 0 
                ? (allReviews.reduce((sum, r) => sum + (r.sentiment_score || 0), 0) / allReviews.length).toFixed(1)
                : '0.0'
              }
            </h3>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>📊</span>
              <span style={{ fontSize: '14px', opacity: 0.8 }}>Filtered</span>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>{filteredReviews.length}</h3>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '25px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            {/* Search */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                🔍 Search Reviews
              </label>
              <input
                type="text"
                value={reviewSearchTerm}
                onChange={(e) => setReviewSearchTerm(e.target.value)}
                placeholder="Search by content, restaurant, or customer..."
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  outline: 'none'
                }}
              />
            </div>

            {/* Restaurant Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                🏪 Restaurant
              </label>
              <select
                value={selectedRestaurantFilter}
                onChange={(e) => setSelectedRestaurantFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  outline: 'none'
                }}
              >
                <option value="" style={{ backgroundColor: '#1f2937' }}>All Restaurants</option>
                {restaurants.map((restaurant) => (
                  <option 
                    key={restaurant.restaurant_id || restaurant.id} 
                    value={restaurant.restaurant_id || restaurant.id}
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                📅 Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedMonth(''); // Reset month when year changes
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  outline: 'none'
                }}
              >
                <option value="" style={{ backgroundColor: '#1f2937' }}>All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year} style={{ backgroundColor: '#1f2937' }}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                📆 Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={!selectedYear}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  backgroundColor: selectedYear ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  color: selectedYear ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(10px)',
                  outline: 'none',
                  cursor: selectedYear ? 'pointer' : 'not-allowed'
                }}
              >
                <option value="" style={{ backgroundColor: '#1f2937' }}>All Months</option>
                {availableMonths.map(month => (
                  <option key={month} value={month} style={{ backgroundColor: '#1f2937' }}>
                    {new Date(2000, month, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                📈 Sort By
              </label>
              <select
                value={reviewSortBy}
                onChange={(e) => setReviewSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  outline: 'none'
                }}
              >
                <option value="date-desc" style={{ backgroundColor: '#1f2937' }}>Newest First</option>
                <option value="date-asc" style={{ backgroundColor: '#1f2937' }}>Oldest First</option>
                <option value="rating-desc" style={{ backgroundColor: '#1f2937' }}>Highest Rating</option>
                <option value="rating-asc" style={{ backgroundColor: '#1f2937' }}>Lowest Rating</option>
                <option value="restaurant" style={{ backgroundColor: '#1f2937' }}>Restaurant Name</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button
                onClick={() => {
                  setSelectedRestaurantFilter('');
                  setReviewSearchTerm('');
                  setSelectedYear('');
                  setSelectedMonth('');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                🗑️ Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredReviews.length === 0 ? (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              padding: '40px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>💬</div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
                No Reviews Found
              </h3>
              <p style={{ fontSize: '16px', opacity: 0.8 }}>
                {allReviews.length === 0 
                  ? 'No reviews have been submitted for your restaurants yet.'
                  : 'Try adjusting your filters to see more reviews.'
                }
              </p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div
                key={review.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '15px',
                  padding: '25px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease'
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
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      marginBottom: '5px'
                    }}>
                      {getRestaurantName(review.restaurant_id)}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      fontSize: '14px',
                      opacity: 0.8,
                      flexWrap: 'wrap'
                    }}>
                      <span>👤 {review.user_email || review.user_name || 'Anonymous'}</span>
                      <span>📅 {review.timestamp ? formatDate(review.timestamp) : 'Unknown date'}</span>
                      {review.sentiment_score && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          backgroundColor: review.sentiment_score >= 4 
                            ? 'rgba(34, 197, 94, 0.2)' 
                            : review.sentiment_score >= 3 
                            ? 'rgba(245, 158, 11, 0.2)' 
                            : 'rgba(239, 68, 68, 0.2)',
                          color: review.sentiment_score >= 4 
                            ? '#34d399' 
                            : review.sentiment_score >= 3 
                            ? '#fbbf24' 
                            : '#f87171',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          ⭐ {review.sentiment_score.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {expandedReview === review.id ? '👁️ Less' : '👁️ More'}
                  </button>
                </div>

                {/* Review Summary */}
                <div style={{ marginBottom: '15px' }}>
                  <p style={{
                    fontSize: '16px',
                    lineHeight: '1.6',
                    marginBottom: '10px'
                  }}>
                    {review.summary || 'No summary provided'}
                  </p>
                </div>

                {/* Expanded Content */}
                {expandedReview === review.id && (
                  <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    paddingTop: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                  }}>
                    {/* Categories - Updated for Consistency */}
                    <ReviewCategories 
                      review={review} 
                      layout="grid" 
                      showEmptyCategories={true}
                      style={{
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '10px'
                      }}
                    />

                    {/* Specific Points */}
                    {review.specific_points && Array.isArray(review.specific_points) && review.specific_points.length > 0 && (
                      <div style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '10px',
                        padding: '15px',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                      }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                          💡 Key Points Mentioned:
                        </h4>
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                          {review.specific_points.map((point, index) => (
                            <li key={index} style={{ fontSize: '14px', marginBottom: '4px' }}>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvement Suggestions */}
                    {review.improvement_suggestions && Array.isArray(review.improvement_suggestions) && review.improvement_suggestions.length > 0 && (
                      <div style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderRadius: '10px',
                        padding: '15px',
                        border: '1px solid rgba(245, 158, 11, 0.2)'
                      }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                          🔧 Suggestions for Improvement:
                        </h4>
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                          {review.improvement_suggestions.map((suggestion, index) => (
                            <li key={index} style={{ fontSize: '14px', marginBottom: '4px' }}>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Analytics Tab Component
  const AnalyticsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
          📊 Food Analytics & Insights
        </h2>
        <p style={{ fontSize: '16px', opacity: 0.8 }}>
          Detailed performance metrics for your restaurants
        </p>
      </div>

      {/* Placeholder for advanced analytics */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        padding: '40px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>📈</div>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          Advanced Analytics Coming Soon
        </h3>
        <p style={{
          fontSize: '16px',
          opacity: 0.8,
          lineHeight: '1.6'
        }}>
          Detailed charts, customer insights, and performance trends will be available here soon!
        </p>
      </div>
    </div>
  );

  // Main render
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
      color: 'white',
      minHeight: '100vh'
    }}>
      {/* Dashboard Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '40px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              marginBottom: '5px',
              background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🏪 Restaurant Owner Dashboard
            </h1>
            <p style={{ fontSize: '18px', opacity: 0.8 }}>
              Manage your food establishments and monitor customer feedback
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            color: '#34d399',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            <span>✅</span>
            <span>Verified Owner</span>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        padding: '5px',
        marginBottom: '30px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ display: 'flex' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              flex: 1,
              padding: '15px 25px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '10px',
              background: activeTab === 'overview' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'transparent',
              color: activeTab === 'overview' ? 'white' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('restaurants')}
            style={{
              flex: 1,
              padding: '15px 25px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '10px',
              background: activeTab === 'restaurants' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'transparent',
              color: activeTab === 'restaurants' ? 'white' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🏪 Restaurants
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            style={{
              flex: 1,
              padding: '15px 25px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '10px',
              background: activeTab === 'reviews' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'transparent',
              color: activeTab === 'reviews' ? 'white' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            💬 Reviews ({allReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              flex: 1,
              padding: '15px 25px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '10px',
              background: activeTab === 'analytics' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'transparent',
              color: activeTab === 'analytics' ? 'white' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            📈 Analytics
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'restaurants' && <RestaurantsTab />}
      {activeTab === 'reviews' && <ReviewsTab />}
      {activeTab === 'analytics' && <AnalyticsTab />}
    </div>
  );
};

export default OwnerDashboard;