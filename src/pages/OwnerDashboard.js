// src/pages/OwnerDashboard.js - Food Review Themed Design
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getRestaurantsByOwner, 
  saveRestaurant, 
  deleteRestaurant,
  getOwnerAnalytics,
  verifyOwnerPassword 
} from '../services/restaurantService';

const OwnerDashboard = () => {
  const { currentUser, isOwner } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [restaurants, setRestaurants] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
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

  // Calculate analytics
  const calculateAnalytics = (reviews) => {
    try {
      const totalReviews = reviews.length;
      const thisMonth = new Date();
      thisMonth.setMonth(thisMonth.getMonth());
      
      const thisMonthReviews = reviews.filter(review => {
        const reviewDate = review.timestamp?.toDate ? review.timestamp.toDate() : new Date(review.timestamp);
        return reviewDate.getMonth() === thisMonth.getMonth() && 
               reviewDate.getFullYear() === thisMonth.getFullYear();
      }).length;

      const sentimentScores = reviews
        .map(r => r.sentiment_score || r.rating)
        .filter(score => typeof score === 'number' && score > 0);

      const averageRating = sentimentScores.length > 0
        ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length
        : 0;

      const positiveReviews = sentimentScores.filter(score => score >= 4).length;

      return {
        totalReviews,
        thisMonthReviews,
        averageRating,
        positiveReviews,
        satisfactionRate: totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : 0,
        reviews: reviews.slice(0, 10)
      };
    } catch (error) {
      console.error('Error calculating analytics:', error);
      return {
        totalReviews: 0,
        thisMonthReviews: 0,
        averageRating: 0,
        positiveReviews: 0,
        satisfactionRate: 0,
        reviews: []
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
      
      const [restaurantsData, analyticsData] = await Promise.all([
        getRestaurantsByOwner(ownerId),
        getOwnerAnalytics(ownerId)
      ]);
      
      setRestaurants(restaurantsData || []);
      setAnalytics(analyticsData || {});
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
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
      operating_hours: restaurant.operating_hours || formData.operating_hours
    });
    setShowAddForm(true);
  };

  // Handle delete
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Handle owner verification
  const handleOwnerVerification = (e) => {
    e.preventDefault();
    if (verifyOwnerPassword(ownerPassword)) {
      setPasswordVerified(true);
      setError(null);
    } else {
      setError('Incorrect owner password. Please try again.');
    }
  };

  // Check if user is owner but not verified
  if (!isOwner || !passwordVerified) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '40px auto',
        padding: '20px',
        color: 'white'
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
            width: '80px',
            height: '80px',
            background: 'linear-gradient(45deg, #f59e0b, #f97316)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px auto',
            fontSize: '40px'
          }}>
            🏪
          </div>
          
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '15px'
          }}>
            🔐 Restaurant Owner Access
          </h2>
          <p style={{
            fontSize: '16px',
            opacity: 0.8,
            marginBottom: '30px',
            lineHeight: '1.6'
          }}>
            Please enter the owner password to access your restaurant dashboard and manage your food establishments.
          </p>
          
          <form onSubmit={handleOwnerVerification} style={{ textAlign: 'left' }}>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="Enter owner password"
                required
                style={{
                  width: '100%',
                  padding: '15px 50px 15px 15px',
                  fontSize: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  color: 'white',
                  outline: 'none',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8b5cf6';
                  e.target.style.boxShadow = '0 0 0 2px rgba(139, 92, 246, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
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
            🏪 Loading restaurant dashboard...
          </p>
          
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '20px',
        color: 'white'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🚨</div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '15px',
            color: '#ef4444'
          }}>
            Dashboard Error
          </h2>
          <p style={{
            fontSize: '16px',
            opacity: 0.8,
            marginBottom: '30px',
            lineHeight: '1.6'
          }}>
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '15px 30px',
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
              +12% this month
            </span>
          </div>
          <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '5px' }}>Total Food Reviews</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
            {analytics?.totalReviews || 0}
          </p>
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
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              color: '#34d399',
              padding: '4px 8px',
              borderRadius: '12px'
            }}>
              +0.2 this month
            </span>
          </div>
          <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '5px' }}>Average Rating</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
            {analytics?.averageRating ? analytics.averageRating.toFixed(1) : '0.0'}
          </p>
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
              +18% this month
            </span>
          </div>
          <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '5px' }}>Happy Customers</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
            {analytics?.positiveReviews || 0}
          </p>
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
              backgroundColor: 'rgba(168, 85, 247, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              📊
            </div>
            <span style={{
              fontSize: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              padding: '4px 8px',
              borderRadius: '12px'
            }}>
              Goal: 95%
            </span>
          </div>
          <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '5px' }}>Satisfaction Rate</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
            {analytics?.satisfactionRate ? `${analytics.satisfactionRate}%` : '0%'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        padding: '25px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🚀 Quick Actions
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px'
        }}>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                ➕
              </div>
              <div>
                <h4 style={{ fontWeight: 'bold', marginBottom: '5px' }}>Add Restaurant</h4>
                <p style={{ fontSize: '14px', opacity: 0.8 }}>Register a new food location</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                📊
              </div>
              <div>
                <h4 style={{ fontWeight: 'bold', marginBottom: '5px' }}>View Analytics</h4>
                <p style={{ fontSize: '14px', opacity: 0.8 }}>Review food performance data</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('restaurants')}
            style={{
              padding: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                🏪
              </div>
              <div>
                <h4 style={{ fontWeight: 'bold', marginBottom: '5px' }}>Manage Restaurants</h4>
                <p style={{ fontSize: '14px', opacity: 0.8 }}>Edit your food establishments</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  // Restaurants Tab Component
  const RestaurantsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
            🏪 Your Food Establishments
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.8 }}>
            Manage your restaurant locations and information
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '12px 25px',
            fontSize: '16px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '10px',
            background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ➕ Add Restaurant
        </button>
      </div>

      {/* Restaurants Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {restaurants.map((restaurant, index) => (
          <div 
            key={restaurant.id || index}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              padding: '25px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-5px)';
              e.target.style.boxShadow = '0 10px 25px rgba(139, 92, 246, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {/* Restaurant Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <div style={{ fontSize: '40px', marginRight: '15px' }}>🍽️</div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '5px',
                  color: 'white'
                }}>
                  {restaurant.name}
                </h3>
                {restaurant.cuisine_type && (
                  <p style={{
                    fontSize: '14px',
                    color: '#f59e0b',
                    opacity: 0.9
                  }}>
                    {restaurant.cuisine_type} Cuisine
                  </p>
                )}
              </div>
              <div style={{
                padding: '4px 8px',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                color: '#34d399',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                Active
              </div>
            </div>

            {/* Restaurant Details */}
            <div style={{ marginBottom: '20px' }}>
              {restaurant.address && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  fontSize: '14px',
                  opacity: 0.8
                }}>
                  <span>📍</span>
                  <span>{restaurant.address}</span>
                </div>
              )}
              
              {restaurant.phone && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  fontSize: '14px',
                  opacity: 0.8
                }}>
                  <span>📞</span>
                  <span>{restaurant.phone}</span>
                </div>
              )}

              {restaurant.price_range && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  opacity: 0.8
                }}>
                  <span>💰</span>
                  <span>{restaurant.price_range}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              paddingTop: '15px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                onClick={() => handleEdit(restaurant)}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => setConfirmDelete(restaurant)}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {restaurants.length === 0 && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '40px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🏪</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '10px'
          }}>
            No Restaurants Yet
          </h3>
          <p style={{
            fontSize: '16px',
            opacity: 0.8,
            marginBottom: '25px'
          }}>
            Add your first restaurant to start collecting delicious feedback from customers!
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '15px 30px',
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
            🏪 Add Your First Restaurant
          </button>
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
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '400px',
            width: '100%',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#1f2937',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              Delete Restaurant?
            </h3>
            <p style={{
              fontSize: '16px',
              marginBottom: '30px',
              opacity: 0.8
            }}>
              Are you sure you want to delete "{confirmDelete.name}"? This action cannot be undone.
            </p>
            <div style={{
              display: 'flex',
              gap: '15px'
            }}>
              <button
                onClick={() => handleDeleteRestaurant(confirmDelete.restaurant_id || confirmDelete.id)}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  border: '2px solid #6b7280',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#1f2937'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {editingRestaurant ? '🏪 Edit Restaurant' : '🏪 Add New Restaurant'}
            </h3>
            
            <form onSubmit={handleSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  Cuisine Type
                </label>
                <input
                  type="text"
                  value={formData.cuisine_type}
                  onChange={(e) => setFormData({...formData, cuisine_type: e.target.value})}
                  placeholder="e.g., Italian, Chinese, American"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
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
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}>
                    Price Range
                  </label>
                  <select
                    value={formData.price_range}
                    onChange={(e) => setFormData({...formData, price_range: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                  >
                    <option value="$">$ - Budget Friendly</option>
                    <option value="$$">$$ - Moderate</option>
                    <option value="$$$">$$$ - Upscale</option>
                    <option value="$$$$">$$$$ - Fine Dining</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  placeholder="Describe your restaurant's unique features and atmosphere"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{
                display: 'flex',
                gap: '15px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingRestaurant(null);
                    resetForm();
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    border: '2px solid #6b7280',
                    borderRadius: '10px',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
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
          opacity: 0.8',
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
      {activeTab === 'analytics' && <AnalyticsTab />}
    </div>
  );
};

export default OwnerDashboard;