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
  
  // Admin Rewards State
  const [rewards, setRewards] = useState([
    {
      id: '1',
      name: 'Free Coffee',
      pointCost: 100,
      category: 'beverage',
      icon: '☕',
      active: true
    },
    {
      id: '2',
      name: 'Free Appetizer',
      pointCost: 200,
      category: 'food',
      icon: '🥨',
      active: true
    },
    {
      id: '3',
      name: '10% Off Meal',
      pointCost: 150,
      category: 'discount',
      icon: '💰',
      active: false
    },
    {
      id: '4',
      name: 'Free Dessert',
      pointCost: 120,
      category: 'food',
      icon: '🍰',
      active: true
    }
  ]);
  const [editingId, setEditingId] = useState(null);
  const [newReward, setNewReward] = useState({
    name: '',
    pointCost: 100,
    category: 'beverage',
    icon: '☕',
    active: true
  });
  
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

  // Admin Rewards Handlers
  const handleUpdate = (id, field, value) => {
    setRewards(prev => prev.map(reward => 
      reward.id === id ? { ...reward, [field]: value } : reward
    ));
  };

  const handleSave = (id) => {
    setEditingId(null);
    // Here you would typically save to your backend
    console.log('Saved reward:', rewards.find(r => r.id === id));
  };

  const handleDelete = async (id) => {
    setRewards(prev => prev.filter(reward => reward.id !== id));
  };

  const handleAddReward = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const rewardToAdd = {
      ...newReward,
      id: newId
    };
    
    setRewards(prev => [...prev, rewardToAdd]);
    setNewReward({
      name: '',
      pointCost: 100,
      category: 'beverage',
      icon: '☕',
      active: true
    });
  };

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
      
      return reviews;
    } catch (error) {
      console.error('Error getting owner reviews:', error);
      return [];
    }
  };

  // Calculate overall analytics for owner
  const calculateOwnerAnalytics = (restaurantsData) => {
    try {
      let totalReviews = 0;
      let totalRating = 0;
      let positiveReviews = 0;
      let thisMonthReviews = 0;
      let totalSentiment = 0;
      let sentimentCount = 0;

      restaurantsData.forEach(restaurant => {
        if (restaurant.analytics) {
          totalReviews += restaurant.analytics.totalReviews || 0;
          
          if (restaurant.analytics.averageRating) {
            totalRating += restaurant.analytics.averageRating * (restaurant.analytics.totalReviews || 0);
          }
          
          positiveReviews += restaurant.analytics.positiveReviews || 0;
          thisMonthReviews += restaurant.analytics.thisMonthReviews || 0;
          
          // Calculate sentiment if available
          if (restaurant.analytics.reviews) {
            restaurant.analytics.reviews.forEach(review => {
              if (review.sentiment_score !== undefined) {
                totalSentiment += review.sentiment_score;
                sentimentCount++;
              }
            });
          }
        }
      });

      const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
      const averageSentiment = sentimentCount > 0 ? totalSentiment / sentimentCount : 0;
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      const restaurantData = {
        ...formData,
        owner_id: currentUser.uid,
        created_at: editingRestaurant ? undefined : new Date()
      };
      
      if (editingRestaurant) {
        restaurantData.updated_at = new Date();
        await saveRestaurant(restaurantData, editingRestaurant.id);
      } else {
        await saveRestaurant(restaurantData);
      }
      
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
  const handleDeleteRestaurant = async (restaurantId) => {
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
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                color: '#fca5a5',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            
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
          </form>
          
          <p style={{
            fontSize: '12px',
            opacity: 0.6,
            marginTop: '20px'
          }}>
            Only authorized restaurant owners can access this area
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        maxWidth: '1200px',
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
          🏪 Loading Owner Dashboard...
        </h2>
        <p style={{ opacity: 0.8 }}>Gathering your restaurant data</p>
        
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
  if (error && restaurants.length === 0) {
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
          <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '25px' }}>
            {error}
          </p>
          <button
            onClick={loadDashboardData}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter and sort reviews
  const filteredReviews = allReviews.filter(review => {
    const matchesRestaurant = !selectedRestaurantFilter || 
      review.restaurant_id === selectedRestaurantFilter;
    
    const matchesSearch = !reviewSearchTerm || 
      review.feedback?.toLowerCase().includes(reviewSearchTerm.toLowerCase()) ||
      review.user_name?.toLowerCase().includes(reviewSearchTerm.toLowerCase());
    
    const reviewDate = new Date(review.timestamp?.toDate ? review.timestamp.toDate() : review.timestamp);
    const matchesMonth = !selectedMonth || 
      reviewDate.getMonth() + 1 === parseInt(selectedMonth);
    const matchesYear = !selectedYear || 
      reviewDate.getFullYear() === parseInt(selectedYear);
    
    return matchesRestaurant && matchesSearch && matchesMonth && matchesYear;
  }).sort((a, b) => {
    const dateA = new Date(a.timestamp?.toDate ? a.timestamp.toDate() : a.timestamp);
    const dateB = new Date(b.timestamp?.toDate ? b.timestamp.toDate() : b.timestamp);
    
    switch (reviewSortBy) {
      case 'date-desc':
        return dateB - dateA;
      case 'date-asc':
        return dateA - dateB;
      case 'rating-high':
        return (b.overall_rating || 0) - (a.overall_rating || 0);
      case 'rating-low':
        return (a.overall_rating || 0) - (b.overall_rating || 0);
      default:
        return dateB - dateA;
    }
  });

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      color: 'white',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '30px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '15px' }}>🏪</div>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '10px',
          background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Restaurant Owner Dashboard
        </h1>
        <p style={{ fontSize: '16px', opacity: 0.8 }}>
          Welcome back, {currentUser?.displayName || currentUser?.name || 'Owner'}! 
          Manage your restaurants and track performance.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        padding: '10px',
        marginBottom: '30px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        gap: '10px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'restaurants', label: 'Restaurants', icon: '🏪' },
          { id: 'reviews', label: 'Reviews', icon: '⭐' },
          { id: 'admin-rewards', label: 'Manage Rewards', icon: '🎁' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderRadius: '10px',
              background: activeTab === tab.id 
                ? 'linear-gradient(45deg, #8b5cf6, #ec4899)' 
                : 'transparent',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              opacity: activeTab === tab.id ? 1 : 0.7
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Analytics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {[
              {
                title: 'Total Reviews',
                value: analytics.totalReviews || 0,
                icon: '📝',
                gradient: 'linear-gradient(45deg, #10b981, #059669)'
              },
              {
                title: 'Average Rating',
                value: analytics.averageRating ? analytics.averageRating.toFixed(1) : '0.0',
                icon: '⭐',
                gradient: 'linear-gradient(45deg, #f59e0b, #d97706)'
              },
              {
                title: 'This Month',
                value: analytics.thisMonthReviews || 0,
                icon: '📈',
                gradient: 'linear-gradient(45deg, #8b5cf6, #7c3aed)'
              },
              {
                title: 'Satisfaction Rate',
                value: `${analytics.satisfactionRate || 0}%`,
                icon: '😊',
                gradient: 'linear-gradient(45deg, #ec4899, #db2777)'
              }
            ].map((stat, index) => (
              <div
                key={index}
                style={{
                  background: stat.gradient,
                  borderRadius: '15px',
                  padding: '25px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                  {stat.icon}
                </div>
                <h3 style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  marginBottom: '5px'
                }}>
                  {stat.value}
                </h3>
                <p style={{
                  fontSize: '14px',
                  opacity: 0.9,
                  fontWeight: '500'
                }}>
                  {stat.title}
                </p>
              </div>
            ))}
          </div>

          {/* Restaurant Performance */}
          {restaurants.length > 0 && (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              padding: '25px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '20px',
                color: '#a78bfa'
              }}>
                🏪 Restaurant Performance
              </h2>
              <div style={{ display: 'grid', gap: '15px' }}>
                {restaurants.map(restaurant => (
                  <div
                    key={restaurant.id}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      padding: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                        {restaurant.name}
                      </h3>
                      <div style={{
                        display: 'flex',
                        gap: '15px',
                        fontSize: '14px'
                      }}>
                        <span>
                          ⭐ {restaurant.analytics?.averageRating?.toFixed(1) || '0.0'}
                        </span>
                        <span>
                          📝 {restaurant.analytics?.totalReviews || 0} reviews
                        </span>
                      </div>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      opacity: 0.7,
                      marginBottom: '10px'
                    }}>
                      📍 {restaurant.address}
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      fontSize: '12px'
                    }}>
                      <span style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        color: '#4ade80',
                        padding: '4px 8px',
                        borderRadius: '12px'
                      }}>
                        {restaurant.cuisine_type || 'Restaurant'}
                      </span>
                      <span style={{
                        backgroundColor: 'rgba(251, 191, 36, 0.2)',
                        color: '#fbbf24',
                        padding: '4px 8px',
                        borderRadius: '12px'
                      }}>
                        {restaurant.price_range || '$'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Restaurants Tab */}
      {activeTab === 'restaurants' && (
        <div>
          {/* Add Restaurant Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#a78bfa'
            }}>
              🏪 Your Restaurants ({restaurants.length})
            </h2>
            <button
              onClick={() => {
                setEditingRestaurant(null);
                resetForm();
                setShowAddForm(true);
              }}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '10px',
                background: 'linear-gradient(45deg, #10b981, #059669)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              ➕ Add New Restaurant
            </button>
          </div>

          {/* Restaurant List */}
          {restaurants.length === 0 ? (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              padding: '40px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>🏪</div>
              <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>
                No Restaurants Yet
              </h3>
              <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '25px' }}>
                Start by adding your first restaurant to collect feedback from customers.
              </p>
              <button
                onClick={() => {
                  setEditingRestaurant(null);
                  resetForm();
                  setShowAddForm(true);
                }}
                style={{
                  padding: '15px 30px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '10px',
                  background: 'linear-gradient(45deg, #10b981, #059669)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                🚀 Add Your First Restaurant
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {restaurants.map(restaurant => (
                <div
                  key={restaurant.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '15px',
                    padding: '25px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '15px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        marginBottom: '8px'
                      }}>
                        {restaurant.name}
                      </h3>
                      <p style={{
                        fontSize: '14px',
                        opacity: 0.8,
                        marginBottom: '8px'
                      }}>
                        📍 {restaurant.address}
                      </p>
                      <div style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '10px'
                      }}>
                        <span style={{
                          backgroundColor: 'rgba(34, 197, 94, 0.2)',
                          color: '#4ade80',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {restaurant.cuisine_type || 'Restaurant'}
                        </span>
                        <span style={{
                          backgroundColor: 'rgba(251, 191, 36, 0.2)',
                          color: '#fbbf24',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {restaurant.price_range || '$'}
                        </span>
                      </div>
                      {restaurant.description && (
                        <p style={{
                          fontSize: '14px',
                          opacity: 0.7,
                          fontStyle: 'italic'
                        }}>
                          {restaurant.description}
                        </p>
                      )}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      marginLeft: '20px'
                    }}>
                      <button
                        onClick={() => handleEdit(restaurant)}
                        style={{
                          padding: '8px 12px',
                          fontSize: '12px',
                          border: 'none',
                          borderRadius: '6px',
                          background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
                          color: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(restaurant.id)}
                        style={{
                          padding: '8px 12px',
                          fontSize: '12px',
                          border: 'none',
                          borderRadius: '6px',
                          background: 'linear-gradient(45deg, #ef4444, #dc2626)',
                          color: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  
                  {/* Restaurant Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '15px',
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#10b981'
                      }}>
                        {restaurant.analytics?.totalReviews || 0}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        opacity: 0.7
                      }}>
                        Total Reviews
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#f59e0b'
                      }}>
                        {restaurant.analytics?.averageRating?.toFixed(1) || '0.0'}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        opacity: 0.7
                      }}>
                        Avg Rating
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#8b5cf6'
                      }}>
                        {restaurant.analytics?.thisMonthReviews || 0}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        opacity: 0.7
                      }}>
                        This Month
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div>
          {/* Filters */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '25px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '15px',
              color: '#a78bfa'
            }}>
              🔍 Filter Reviews
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              <select
                value={selectedRestaurantFilter}
                onChange={(e) => setSelectedRestaurantFilter(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="">All Restaurants</option>
                {restaurants.map(restaurant => (
                  <option 
                    key={restaurant.id} 
                    value={restaurant.restaurant_id || restaurant.id}
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    {restaurant.name}
                  </option>
                ))}
              </select>
              
              <select
                value={reviewSortBy}
                onChange={(e) => setReviewSortBy(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="date-desc" style={{ backgroundColor: '#1f2937' }}>Newest First</option>
                <option value="date-asc" style={{ backgroundColor: '#1f2937' }}>Oldest First</option>
                <option value="rating-high" style={{ backgroundColor: '#1f2937' }}>Highest Rating</option>
                <option value="rating-low" style={{ backgroundColor: '#1f2937' }}>Lowest Rating</option>
              </select>
              
              <input
                type="text"
                placeholder="Search reviews..."
                value={reviewSearchTerm}
                onChange={(e) => setReviewSearchTerm(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          
          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              padding: '40px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>📝</div>
              <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>
                No Reviews Found
              </h3>
              <p style={{ fontSize: '16px', opacity: 0.8 }}>
                {allReviews.length === 0 
                  ? "You haven't received any reviews yet."
                  : "No reviews match your current filters."
                }
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {filteredReviews.map(review => (
                <div
                  key={review.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '15px',
                    padding: '25px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '15px'
                  }}>
                    <div>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        marginBottom: '5px'
                      }}>
                        {review.user_name || 'Anonymous Customer'}
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        opacity: 0.7,
                        marginBottom: '5px'
                      }}>
                        🏪 {getRestaurantName(review.restaurant_id)}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        opacity: 0.6
                      }}>
                        📅 {formatDate(review.timestamp?.toDate ? review.timestamp.toDate() : review.timestamp)}
                      </p>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: 'rgba(251, 191, 36, 0.2)',
                        padding: '5px 10px',
                        borderRadius: '8px'
                      }}>
                        <span style={{ fontSize: '14px' }}>⭐</span>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#fbbf24'
                        }}>
                          {review.overall_rating || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Review Content */}
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '15px',
                    marginBottom: '15px'
                  }}>
                    <p style={{
                      fontSize: '14px',
                      lineHeight: '1.5',
                      marginBottom: review.categories ? '10px' : '0'
                    }}>
                      {review.feedback || 'No feedback provided.'}
                    </p>
                    
                    {review.categories && (
                      <ReviewCategories categories={review.categories} />
                    )}
                  </div>
                  
                  {/* Expand/Collapse Button */}
                  {review.additional_comments && (
                    <button
                      onClick={() => setExpandedReview(
                        expandedReview === review.id ? null : review.id
                      )}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#a78bfa',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      {expandedReview === review.id ? '▲ Show Less' : '▼ Show More'}
                    </button>
                  )}
                  
                  {/* Expanded Content */}
                  {expandedReview === review.id && review.additional_comments && (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      padding: '15px',
                      marginTop: '10px'
                    }}>
                      <h5 style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        opacity: 0.8,
                        marginBottom: '8px'
                      }}>
                        Additional Comments:
                      </h5>
                      <p style={{
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        {review.additional_comments}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Rewards Tab */}
      {activeTab === 'admin-rewards' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#a78bfa'
            }}>
              🎁 Manage Rewards ({rewards.length})
            </h2>
          </div>

          {/* Add New Reward Section */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '25px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#a78bfa'
            }}>
              ➕ Add New Reward
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <input
                type="text"
                placeholder="Reward name"
                value={newReward.name}
                onChange={(e) => setNewReward({...newReward, name: e.target.value})}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
              
              <input
                type="number"
                placeholder="Point cost"
                value={newReward.pointCost}
                onChange={(e) => setNewReward({...newReward, pointCost: parseInt(e.target.value)})}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
              
              <select
                value={newReward.category}
                onChange={(e) => setNewReward({...newReward, category: e.target.value})}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="beverage" style={{ backgroundColor: '#1f2937' }}>Beverage</option>
                <option value="food" style={{ backgroundColor: '#1f2937' }}>Food</option>
                <option value="discount" style={{ backgroundColor: '#1f2937' }}>Discount</option>
                <option value="special" style={{ backgroundColor: '#1f2937' }}>Special</option>
              </select>
              
              <input
                type="text"
                placeholder="Icon (emoji)"
                value={newReward.icon}
                onChange={(e) => setNewReward({...newReward, icon: e.target.value})}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <button
              onClick={handleAddReward}
              disabled={!newReward.name.trim()}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '10px',
                background: newReward.name.trim() 
                  ? 'linear-gradient(45deg, #10b981, #059669)' 
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                cursor: newReward.name.trim() ? 'pointer' : 'not-allowed',
                opacity: newReward.name.trim() ? 1 : 0.5
              }}
            >
              ➕ Add Reward
            </button>
          </div>

          {/* Existing Rewards List */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '25px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#a78bfa'
            }}>
              🏆 Current Rewards
            </h3>
            
            {rewards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎁</div>
                <h4 style={{ fontSize: '20px', marginBottom: '10px' }}>No Rewards Yet</h4>
                <p style={{ fontSize: '16px', opacity: 0.8 }}>
                  Add your first reward to start incentivizing customer feedback!
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {rewards.map(reward => (
                  <div
                    key={reward.id}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}>
                      <div style={{
                        fontSize: '40px',
                        minWidth: '60px',
                        textAlign: 'center'
                      }}>
                        {reward.icon}
                      </div>
                      
                      {editingId === reward.id ? (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: '10px',
                          flex: 1
                        }}>
                          <input
                            type="text"
                            value={reward.name}
                            onChange={(e) => handleUpdate(reward.id, 'name', e.target.value)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              fontSize: '14px'
                            }}
                          />
                          <input
                            type="number"
                            value={reward.pointCost}
                            onChange={(e) => handleUpdate(reward.id, 'pointCost', parseInt(e.target.value))}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              fontSize: '14px'
                            }}
                          />
                          <select
                            value={reward.category}
                            onChange={(e) => handleUpdate(reward.id, 'category', e.target.value)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              fontSize: '14px'
                            }}
                          >
                            <option value="beverage" style={{ backgroundColor: '#1f2937' }}>Beverage</option>
                            <option value="food" style={{ backgroundColor: '#1f2937' }}>Food</option>
                            <option value="discount" style={{ backgroundColor: '#1f2937' }}>Discount</option>
                            <option value="special" style={{ backgroundColor: '#1f2937' }}>Special</option>
                          </select>
                          <input
                            type="text"
                            value={reward.icon}
                            onChange={(e) => handleUpdate(reward.id, 'icon', e.target.value)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            marginBottom: '5px'
                          }}>
                            {reward.name}
                          </h4>
                          <p style={{
                            fontSize: '14px',
                            opacity: 0.7,
                            marginBottom: '5px'
                          }}>
                            {reward.pointCost} points • {reward.category}
                          </p>
                          <div style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: reward.active 
                              ? 'rgba(34, 197, 94, 0.2)' 
                              : 'rgba(239, 68, 68, 0.2)',
                            color: reward.active ? '#4ade80' : '#f87171'
                          }}>
                            {reward.active ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={reward.active}
                            onChange={(e) => handleUpdate(reward.id, 'active', e.target.checked)}
                            style={{
                              width: '16px',
                              height: '16px',
                              accentColor: '#10b981'
                            }}
                          />
                          <span style={{
                            fontSize: '12px',
                            opacity: 0.8
                          }}>
                            Active
                          </span>
                        </label>

                        {editingId === reward.id ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleSave(reward.id)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                border: 'none',
                                borderRadius: '6px',
                                background: 'linear-gradient(45deg, #10b981, #059669)',
                                color: 'white',
                                cursor: 'pointer'
                              }}
                            >
                              ✅ Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                border: 'none',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                cursor: 'pointer'
                              }}
                            >
                              ❌ Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setEditingId(reward.id)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                border: 'none',
                                borderRadius: '6px',
                                background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
                                color: 'white',
                                cursor: 'pointer'
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(reward.id)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                border: 'none',
                                borderRadius: '6px',
                                background: 'linear-gradient(45deg, #ef4444, #dc2626)',
                                color: 'white',
                                cursor: 'pointer'
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Restaurant Form Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <h3 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {editingRestaurant ? '✏️ Edit Restaurant' : '➕ Add New Restaurant'}
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
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '20px' }}>
                {/* Basic Info */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: '8px'
                  }}>
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      backdropFilter: 'blur(10px)'
                    }}
                    placeholder="Enter restaurant name"
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: '8px'
                  }}>
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      backdropFilter: 'blur(10px)'
                    }}
                    placeholder="Enter full address"
                    required
                  />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '15px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: '8px'
                    }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        backdropFilter: 'blur(10px)'
                      }}
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: '8px'
                    }}>
                      Cuisine Type
                    </label>
                    <select
                      value={formData.cuisine_type}
                      onChange={(e) => setFormData({...formData, cuisine_type: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <option value="" style={{ backgroundColor: '#1f2937' }}>Select cuisine</option>
                      <option value="American" style={{ backgroundColor: '#1f2937' }}>American</option>
                      <option value="Italian" style={{ backgroundColor: '#1f2937' }}>Italian</option>
                      <option value="Chinese" style={{ backgroundColor: '#1f2937' }}>Chinese</option>
                      <option value="Mexican" style={{ backgroundColor: '#1f2937' }}>Mexican</option>
                      <option value="Indian" style={{ backgroundColor: '#1f2937' }}>Indian</option>
                      <option value="Thai" style={{ backgroundColor: '#1f2937' }}>Thai</option>
                      <option value="Japanese" style={{ backgroundColor: '#1f2937' }}>Japanese</option>
                      <option value="Mediterranean" style={{ backgroundColor: '#1f2937' }}>Mediterranean</option>
                      <option value="Other" style={{ backgroundColor: '#1f2937' }}>Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: '8px'
                  }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    placeholder="Brief description of your restaurant"
                  />
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '15px',
                  justifyContent: 'flex-end',
                  marginTop: '10px'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingRestaurant(null);
                      resetForm();
                    }}
                    style={{
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      backgroundColor: 'transparent',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      border: 'none',
                      borderRadius: '10px',
                      background: 'linear-gradient(45deg, #10b981, #059669)',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {editingRestaurant ? '💾 Update Restaurant' : '🚀 Add Restaurant'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              fontSize: '60px',
              marginBottom: '20px'
            }}>
              🗑️
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '15px',
              color: 'white'
            }}>
              Delete Restaurant?
            </h3>
            <p style={{
              fontSize: '16px',
              opacity: 0.8,
              marginBottom: '25px',
              color: 'white'
            }}>
              This action cannot be undone. All reviews and data associated with this restaurant will be permanently deleted.
            </p>
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRestaurant(confirmDelete)}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '10px',
                  background: 'linear-gradient(45deg, #ef4444, #dc2626)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                🗑️ Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;