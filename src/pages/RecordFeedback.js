// src/pages/RecordFeedback.js - FIXED VERSION with Restaurant Selection
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getAllRestaurants } from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import { createSlug } from '../utils/stringUtils';
import FeedbackForm from '../components/Feedback/FeedbackForm';

// Simple utility function
const slugToReadable = (slug) => {
  if (!slug) return '';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const RecordFeedback = () => {
  const { restaurantName } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [showSelection, setShowSelection] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        
        // Fetch all restaurants first
        const restaurantsData = await getAllRestaurants();
        setAllRestaurants(restaurantsData);
        
        if (restaurantName) {
          // If restaurant name is provided in URL, find the specific restaurant
          const foundRestaurant = restaurantsData.find(r => {
            const restaurantSlug = createSlug ? createSlug(r.name) : r.name.toLowerCase().replace(/\s+/g, '-');
            const urlSlug = createSlug ? createSlug(restaurantName) : restaurantName.toLowerCase();
            return restaurantSlug === urlSlug;
          });
          
          if (foundRestaurant) {
            setRestaurant(foundRestaurant);
            setShowSelection(false);
          } else {
            // Restaurant not found, show selection
            setShowSelection(true);
          }
        } else {
          // No restaurant name provided, show selection screen
          setShowSelection(true);
        }
      } catch (error) {
        console.error('Error loading restaurants:', error);
        setShowSelection(true); // Show selection as fallback
      } finally {
        setLoading(false);
      }
    };
    
    initializePage();
  }, [restaurantName]);

  const handleRestaurantSelect = (selectedRestaurant) => {
    setRestaurant(selectedRestaurant);
    setShowSelection(false);
    
    // Update URL to include restaurant name (optional, for better UX)
    const slug = createSlug ? createSlug(selectedRestaurant.name) : selectedRestaurant.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/feedback/${slug}`, { replace: true, state: { restaurant: selectedRestaurant } });
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #3b82f6',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>
            Loading Restaurants
          </h2>
          <p style={{ color: '#9ca3af' }}>
            Preparing your review experience...
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

  // Restaurant Selection Screen
  if (showSelection) {
    return (
      <div style={{
        minHeight: '100vh',
        padding: '40px 20px',
        color: 'white'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '50px'
          }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #fb923c, #ef4444, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '20px'
            }}>
              Choose a Restaurant
            </h1>
            <p style={{
              fontSize: '20px',
              opacity: 0.8,
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Select the restaurant you'd like to review and share your dining experience
            </p>
          </div>

          {allRestaurants.length === 0 ? (
            // No restaurants available
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '60px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '80px', marginBottom: '30px' }}>🏪</div>
              <h2 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                marginBottom: '20px'
              }}>
                No Restaurants Available
              </h2>
              <p style={{
                fontSize: '18px',
                opacity: 0.8,
                marginBottom: '30px'
              }}>
                There are currently no restaurants available for review. Please check back later.
              </p>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '15px 30px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '12px',
                  background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                ← Back to Home
              </button>
            </div>
          ) : (
            // Restaurant selection grid
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '25px',
                marginBottom: '40px'
              }}>
                {allRestaurants.map((rest) => (
                  <div
                    key={rest.id || rest.restaurant_id}
                    onClick={() => handleRestaurantSelect(rest)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      padding: '30px',
                      border: selectedRestaurantId === (rest.id || rest.restaurant_id) 
                        ? '2px solid #8b5cf6' 
                        : '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      transform: 'translateY(0)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Restaurant Icon */}
                    <div style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: '#fb923c',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px auto',
                      fontSize: '30px'
                    }}>
                      🍽️
                    </div>

                    {/* Restaurant Name */}
                    <h3 style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      marginBottom: '15px',
                      textAlign: 'center',
                      color: 'white'
                    }}>
                      {rest.name}
                    </h3>

                    {/* Restaurant Details */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      fontSize: '14px',
                      opacity: 0.8
                    }}>
                      {rest.address && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          justifyContent: 'center'
                        }}>
                          📍 {rest.address}
                        </div>
                      )}
                      
                      {rest.phone && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          justifyContent: 'center'
                        }}>
                          📞 {rest.phone}
                        </div>
                      )}

                      {rest.category && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          justifyContent: 'center'
                        }}>
                          🏷️ {rest.category}
                        </div>
                      )}
                    </div>

                    {/* Selection indicator */}
                    {selectedRestaurantId === (rest.id || rest.restaurant_id) && (
                      <div style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        backgroundColor: '#8b5cf6',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                    )}

                    {/* Hover effect overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: '20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid rgba(139, 92, 246, 0.5)',
                      borderRadius: '20px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#a78bfa',
                      opacity: 0,
                      transition: 'opacity 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      const overlay = e.currentTarget.querySelector('div:last-child');
                      if (overlay) overlay.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      const overlay = e.currentTarget.querySelector('div:last-child');
                      if (overlay) overlay.style.opacity = '0';
                    }}
                    >
                      Click to Review
                    </div>
                  </div>
                ))}
              </div>

              {/* Instructions */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '25px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}>
                  ✨ Ready to Share Your Experience?
                </h3>
                <p style={{
                  fontSize: '16px',
                  opacity: 0.8,
                  lineHeight: '1.6'
                }}>
                  Select any restaurant above to start your review. Your feedback helps improve dining experiences for everyone!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Feedback Page (when restaurant is selected)
  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px 20px',
      color: 'white'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Back to Selection Button */}
        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={() => setShowSelection(true)}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            ← Choose Different Restaurant
          </button>
        </div>

        {/* Restaurant Header */}
        <div style={{
          marginBottom: '40px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '40px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          {/* Restaurant Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#fb923c',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px auto',
            fontSize: '40px'
          }}>
            🍽️
          </div>

          {/* Restaurant Name */}
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            background: 'linear-gradient(to right, #fb923c, #ef4444, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '20px'
          }}>
            {restaurant?.name || 'Restaurant'}
          </h1>

          {/* Restaurant Details */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            flexWrap: 'wrap',
            color: '#d1d5db'
          }}>
            {restaurant?.address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                📍 {restaurant.address}
              </div>
            )}
            
            {restaurant?.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                📞 {restaurant.phone}
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⏰ Open for reviews
            </div>
          </div>

          {/* Decorative Element */}
          <div style={{
            marginTop: '30px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}>
            ✨ <span style={{ color: '#fbbf24', fontWeight: '600' }}>Share Your Experience</span> ✨
          </div>
        </div>

        {/* FeedbackForm Component - FIXED: Use actual restaurant ID instead of default */}
        <FeedbackForm 
          restaurantId={restaurant?.restaurant_id || restaurant?.id}
          restaurantName={restaurant?.name || 'this restaurant'}
          placeId={restaurant?.google_place_id}
        />

        {/* Additional Info */}
        <div style={{
          marginTop: '60px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            ⭐ Why Share Your Review?
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '15px'
            }}>
              <div style={{
                fontSize: '24px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                🎯
              </div>
              <div>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Help Others Decide
                </h4>
                <p style={{
                  fontSize: '14px',
                  opacity: 0.8,
                  lineHeight: '1.5'
                }}>
                  Your honest feedback helps fellow diners make informed choices about where to eat.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '15px'
            }}>
              <div style={{
                fontSize: '24px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                📈
              </div>
              <div>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Improve Service
                </h4>
                <p style={{
                  fontSize: '14px',
                  opacity: 0.8,
                  lineHeight: '1.5'
                }}>
                  Restaurants use your feedback to enhance their food quality and customer service.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '15px'
            }}>
              <div style={{
                fontSize: '24px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                🎁
              </div>
              <div>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Earn Rewards
                </h4>
                <p style={{
                  fontSize: '14px',
                  opacity: 0.8,
                  lineHeight: '1.5'
                }}>
                  Complete reviews to earn points and unlock exclusive rewards and discounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordFeedback;