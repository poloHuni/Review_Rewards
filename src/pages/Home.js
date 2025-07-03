// src/pages/Home.js - Food Review Themed Design
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllRestaurants } from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import { createSlug } from '../utils/stringUtils';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  
  const { currentUser, isOwner } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const restaurantsData = await getAllRestaurants();
        setRestaurants(restaurantsData);
        
        // Set default selected restaurant if available
        if (restaurantsData.length > 0) {
          setSelectedRestaurant(restaurantsData[0]);
        }
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError('Failed to load restaurants. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurants();
  }, []);

  const handleRecordFeedback = (restaurant) => {
    if (!currentUser) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }
    
    // Navigate to feedback page for specific restaurant
    const slug = createSlug ? createSlug(restaurant.name) : restaurant.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/feedback/${slug}`, { state: { restaurant } });
  };
  
  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
            🍽️ Loading delicious restaurants...
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
            Unable to Load Restaurants
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
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // No restaurants state
  if (restaurants.length === 0) {
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
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🏪</div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '15px'
          }}>
            No Restaurants Available
          </h2>
          
          {isOwner ? (
            <div>
              <p style={{
                fontSize: '16px',
                opacity: 0.8,
                marginBottom: '30px',
                lineHeight: '1.6'
              }}>
                As a restaurant owner, you can add your first restaurant to start collecting feedback.
              </p>
              <Link
                to="/owner/dashboard"
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
                🏪 Add Restaurant
              </Link>
            </div>
          ) : (
            <p style={{
              fontSize: '16px',
              opacity: 0.8,
              lineHeight: '1.6'
            }}>
              No restaurants are currently available for review. Please check back later!
            </p>
          )}
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
      color: 'white',
      minHeight: '100vh'
    }}>
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: '60px'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '20px',
          background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🍽️ Food Review Hub
        </h1>
        <p style={{
          fontSize: '20px',
          opacity: 0.8,
          marginBottom: '40px',
          maxWidth: '600px',
          margin: '0 auto 40px auto',
          lineHeight: '1.6'
        }}>
          Share your dining experiences, discover amazing restaurants, and help fellow food lovers make the best choices
        </p>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '20px',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '5px' }}>🏪</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
              {restaurants.length}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Restaurants</div>
          </div>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '5px' }}>📝</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
              Easy
            </div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Voice Reviews</div>
          </div>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '5px' }}>🎁</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
              Rewards
            </div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Earn Points</div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '40px',
        marginBottom: '50px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          🚀 How It Works
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px'
        }}>
          {/* Step 1 */}
          <div style={{
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              fontSize: '36px',
              border: '2px solid rgba(59, 130, 246, 0.4)'
            }}>
              🏪
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              Choose Restaurant
            </h3>
            <p style={{
              fontSize: '14px',
              opacity: 0.8,
              lineHeight: '1.5'
            }}>
              Select from our curated list of amazing restaurants to review
            </p>
          </div>

          {/* Step 2 */}
          <div style={{
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              fontSize: '36px',
              border: '2px solid rgba(139, 92, 246, 0.4)'
            }}>
              🎤
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              Record Your Experience
            </h3>
            <p style={{
              fontSize: '14px',
              opacity: 0.8,
              lineHeight: '1.5'
            }}>
              Use voice recording or text to share your dining experience
            </p>
          </div>

          {/* Step 3 */}
          <div style={{
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: 'rgba(236, 72, 153, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              fontSize: '36px',
              border: '2px solid rgba(236, 72, 153, 0.4)'
            }}>
              🎁
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              Earn Rewards
            </h3>
            <p style={{
              fontSize: '14px',
              opacity: 0.8,
              lineHeight: '1.5'
            }}>
              Get points for reviews and redeem them for delicious rewards
            </p>
          </div>
        </div>
      </div>

      {/* Restaurant Selection */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '40px',
        marginBottom: '50px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          🍽️ Choose Your Restaurant
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {restaurants.map((restaurant, index) => (
            <div 
              key={restaurant.id || index}
              style={{
                backgroundColor: selectedRestaurant?.id === restaurant.id 
                  ? 'rgba(34, 197, 94, 0.15)' 
                  : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '15px',
                padding: '25px',
                border: selectedRestaurant?.id === restaurant.id 
                  ? '2px solid rgba(34, 197, 94, 0.4)' 
                  : '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onClick={() => setSelectedRestaurant(restaurant)}
              onMouseEnter={(e) => {
                if (selectedRestaurant?.id !== restaurant.id) {
                  e.target.style.transform = 'translateY(-5px)';
                  e.target.style.boxShadow = '0 10px 25px rgba(139, 92, 246, 0.15)';
                }
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
                <div style={{
                  fontSize: '40px',
                  marginRight: '15px'
                }}>
                  🍽️
                </div>
                <div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginBottom: '5px',
                    color: 'white'
                  }}>
                    {restaurant.name}
                  </h3>
                  {restaurant.cuisine && (
                    <p style={{
                      fontSize: '14px',
                      opacity: 0.7,
                      color: '#f59e0b'
                    }}>
                      {restaurant.cuisine} Cuisine
                    </p>
                  )}
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

                {restaurant.rating && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px'
                  }}>
                    <span>⭐</span>
                    <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                      {restaurant.rating}/5
                    </span>
                  </div>
                )}
              </div>

              {/* Selection Indicator */}
              {selectedRestaurant?.id === restaurant.id && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#22c55e',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  <span>✅</span>
                  <span>Selected</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Button */}
        {selectedRestaurant && (
          <div style={{
            textAlign: 'center',
            marginTop: '40px'
          }}>
            <button
              onClick={() => handleRecordFeedback(selectedRestaurant)}
              style={{
                padding: '20px 40px',
                fontSize: '20px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '15px',
                background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                margin: '0 auto',
                boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 30px rgba(139, 92, 246, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)';
              }}
            >
              🎤 Share Your Experience at {selectedRestaurant.name}
            </button>
            
            <p style={{
              fontSize: '14px',
              opacity: 0.7,
              marginTop: '15px'
            }}>
              {currentUser ? '✨ Earn 10 points for each review' : '🔐 Please log in to start reviewing'}
            </p>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '40px',
        marginBottom: '50px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          ✨ Why Food Lovers Choose Us
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px'
        }}>
          {/* Feature 1 */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '25px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎤</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              Voice & Text Reviews
            </h3>
            <p style={{
              fontSize: '14px',
              opacity: 0.8,
              lineHeight: '1.5'
            }}>
              Record your thoughts naturally or type them out - we make sharing your experience effortless
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '25px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎁</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              Delicious Rewards
            </h3>
            <p style={{
              fontSize: '14px',
              opacity: 0.8,
              lineHeight: '1.5'
            }}>
              Earn points for every review and redeem them for free coffee, meals, and exclusive discounts
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '25px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🤖</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              AI-Powered Analysis
            </h3>
            <p style={{
              fontSize: '14px',
              opacity: 0.8,
              lineHeight: '1.5'
            }}>
              Our smart AI analyzes your feedback and formats it perfectly for sharing on Google Reviews
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      {currentUser && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            🚀 Quick Access
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <Link
              to="/my-reviews"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderRadius: '15px',
                padding: '25px',
                textDecoration: 'none',
                color: 'white',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'block'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-5px)';
                e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📝</div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>My Food Adventures</h3>
            </Link>

            <Link
              to="/rewards"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderRadius: '15px',
                padding: '25px',
                textDecoration: 'none',
                color: 'white',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                display: 'block'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-5px)';
                e.target.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎁</div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Food Rewards Store</h3>
            </Link>

            <Link
              to="/vouchers"
              style={{
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                borderRadius: '15px',
                padding: '25px',
                textDecoration: 'none',
                color: 'white',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                display: 'block'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-5px)';
                e.target.style.backgroundColor = 'rgba(168, 85, 247, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.backgroundColor = 'rgba(168, 85, 247, 0.2)';
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎫</div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>My Food Vouchers</h3>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;