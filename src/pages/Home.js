// src/pages/Home.js - Beautiful Neumorphic Restaurant Review Homepage with Dark Mode
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
  const [stats, setStats] = useState({ totalReviews: 0, totalRestaurants: 0 });
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const { currentUser, isOwner } = useAuth();
  const navigate = useNavigate();
  
  // Dark mode toggle
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-theme', !isDarkMode ? 'dark' : 'light');
  };

  // Initialize theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('neuro-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark;
    
    setIsDarkMode(initialDarkMode);
    document.documentElement.setAttribute('data-theme', initialDarkMode ? 'dark' : 'light');
  }, []);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('neuro-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);
  
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const restaurantsData = await getAllRestaurants();
        setRestaurants(restaurantsData);
        
        // Calculate stats
        setStats({
          totalRestaurants: restaurantsData.length,
          totalReviews: restaurantsData.reduce((sum, r) => sum + (r.reviewCount || 0), 0)
        });
        
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
      navigate('/login');
      return;
    }
    
    const slug = createSlug ? createSlug(restaurant.name) : restaurant.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/feedback/${slug}`, { state: { restaurant } });
  };
  
  // Beautiful loading state
  if (loading) {
    return (
      <div className="neuro-body neuro-full-screen neuro-center-content">
        {/* Dark Mode Toggle */}
        <div className="neuro-theme-toggle">
          <button onClick={toggleDarkMode} className="neuro-toggle-button">
            <span className="neuro-toggle-icon">{isDarkMode ? '☀️' : '🌙'}</span>
          </button>
        </div>
        
        <div className="neuro-loading-container">
          <div className="neuro-loading-card">
            <div className="neuro-loading-spinner">
              <div className="neuro-spinner-ring"></div>
              <div className="neuro-spinner-inner"></div>
            </div>
            <div className="neuro-loading-icon">🍽️</div>
            <h3 className="neuro-loading-title">Discovering Restaurants</h3>
            <p className="neuro-loading-text">Finding amazing places for you...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Beautiful error state
  if (error) {
    return (
      <div className="neuro-body neuro-full-screen neuro-center-content">
        {/* Dark Mode Toggle */}
        <div className="neuro-theme-toggle">
          <button onClick={toggleDarkMode} className="neuro-toggle-button">
            <span className="neuro-toggle-icon">{isDarkMode ? '☀️' : '🌙'}</span>
          </button>
        </div>
        
        <div className="neuro-error-container">
          <div className="neuro-error-card">
            <div className="neuro-error-icon">😅</div>
            <h2 className="neuro-error-title">Oops! Something went wrong</h2>
            <p className="neuro-error-message">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="neuro-button neuro-button-primary neuro-error-button"
            >
              <span className="neuro-button-icon">🔄</span>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="neuro-body">
      {/* Dark Mode Toggle */}
      <div className="neuro-theme-toggle">
        <button onClick={toggleDarkMode} className="neuro-toggle-button">
          <span className="neuro-toggle-icon">{isDarkMode ? '☀️' : '🌙'}</span>
          <span className="neuro-toggle-text">{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* Hero Section */}
      <section className="neuro-hero-section">
        <div className="neuro-container">
          {/* Simplified header card */}
          <div className="neuro-hero-header">
            <div className="neuro-hero-card">
              <h1 className="neuro-hero-title">
                Share Your
                <span className="neuro-title-accent">Food Journey</span>
              </h1>
              
              <p className="neuro-hero-description">
                Discover amazing restaurants and help others find their next favorite meal.
              </p>
              
              {/* Action buttons */}
              <div className="neuro-hero-actions">
                {currentUser ? (
                  <Link to="/feedback" className="neuro-button neuro-button-primary neuro-hero-primary">
                    <div className="neuro-icon neuro-icon-write"></div>
                    <span className="neuro-button-text">Write Review</span>
                    <span className="neuro-button-shine"></span>
                  </Link>
                ) : (
                  <Link to="/login" className="neuro-button neuro-button-primary neuro-hero-primary">
                    <div className="neuro-icon neuro-icon-rocket"></div>
                    <span className="neuro-button-text">Get Started</span>
                    <span className="neuro-button-shine"></span>
                  </Link>
                )}
                
                <button 
                  onClick={() => document.getElementById('restaurants-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="neuro-button neuro-button-secondary neuro-hero-secondary"
                >
                  <div className="neuro-icon neuro-icon-explore"></div>
                  <span className="neuro-button-text">Explore</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats.totalRestaurants > 0 && (
        <section className="neuro-stats-section">
          <div className="neuro-container">
            <div className="neuro-stats-grid">
              <div className="neuro-stat-card">
                <div className="neuro-stat-icon-container">
                  <div className="neuro-icon neuro-icon-restaurant"></div>
                </div>
                <div className="neuro-stat-content">
                  <div className="neuro-stat-number">{stats.totalRestaurants}</div>
                  <div className="neuro-stat-label">Amazing Restaurants</div>
                </div>
                <div className="neuro-stat-decoration"></div>
              </div>
              
              <div className="neuro-stat-card">
                <div className="neuro-stat-icon-container">
                  <div className="neuro-icon neuro-icon-star"></div>
                </div>
                <div className="neuro-stat-content">
                  <div className="neuro-stat-number">{stats.totalReviews}</div>
                  <div className="neuro-stat-label">Honest Reviews</div>
                </div>
                <div className="neuro-stat-decoration"></div>
              </div>
              
              <div className="neuro-stat-card">
                <div className="neuro-stat-icon-container">
                  <div className="neuro-icon neuro-icon-community"></div>
                </div>
                <div className="neuro-stat-content">
                  <div className="neuro-stat-number">500+</div>
                  <div className="neuro-stat-label">Food Lovers</div>
                </div>
                <div className="neuro-stat-decoration"></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="neuro-how-section">
        <div className="neuro-container">
          <div className="neuro-section-header">
            <div className="neuro-section-title-card">
              <h2 className="neuro-section-title">How It Works</h2>
              <div className="neuro-title-underline"></div>
            </div>
            <p className="neuro-section-subtitle">
              Three simple steps to share your dining experience
            </p>
          </div>
          
          <div className="neuro-steps-container">
            <div className="neuro-step-card">
              <div className="neuro-step-header">
                <div className="neuro-step-number">
                  <span>1</span>
                </div>
                <div className="neuro-step-icon-wrapper">
                  <div className="neuro-step-icon">🏪</div>
                </div>
              </div>
              <div className="neuro-step-content">
                <h3 className="neuro-step-title">Choose Restaurant</h3>
                <p className="neuro-step-description">
                  Pick from our carefully curated list of local favorites and hidden gems
                </p>
              </div>
              <div className="neuro-step-glow"></div>
            </div>
            
            <div className="neuro-step-card">
              <div className="neuro-step-header">
                <div className="neuro-step-number">
                  <span>2</span>
                </div>
                <div className="neuro-step-icon-wrapper">
                  <div className="neuro-step-icon">✍️</div>
                </div>
              </div>
              <div className="neuro-step-content">
                <h3 className="neuro-step-title">Share Experience</h3>
                <p className="neuro-step-description">
                  Tell us about your visit using our intuitive and engaging review system
                </p>
              </div>
              <div className="neuro-step-glow"></div>
            </div>
            
            <div className="neuro-step-card">
              <div className="neuro-step-header">
                <div className="neuro-step-number">
                  <span>3</span>
                </div>
                <div className="neuro-step-icon-wrapper">
                  <div className="neuro-step-icon">🌟</div>
                </div>
              </div>
              <div className="neuro-step-content">
                <h3 className="neuro-step-title">Help Community</h3>
                <p className="neuro-step-description">
                  Your insights help others discover amazing dining experiences
                </p>
              </div>
              <div className="neuro-step-glow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      {restaurants.length > 0 && (
        <section id="restaurants-section" className="neuro-restaurants-section">
          <div className="neuro-container">
            <div className="neuro-section-header">
              <div className="neuro-section-title-card">
                <h2 className="neuro-section-title">Featured Restaurants</h2>
                <div className="neuro-title-underline"></div>
              </div>
              <p className="neuro-section-subtitle">
                Discover amazing dining experiences shared by our community
              </p>
            </div>
            
            <div className="neuro-restaurants-grid">
              {restaurants.slice(0, 6).map((restaurant) => (
                <div key={restaurant.restaurant_id} className="neuro-restaurant-card">
                  <div className="neuro-restaurant-header">
                    <div className="neuro-restaurant-icon-container">
                      <div className="neuro-icon neuro-icon-food">
                        {restaurant.icon || '🍽️'}
                      </div>
                    </div>
                    <div className="neuro-restaurant-info">
                      <h3 className="neuro-restaurant-name">{restaurant.name}</h3>
                      <p className="neuro-restaurant-category">{restaurant.category}</p>
                    </div>
                    <div className="neuro-restaurant-favorite">
                      <div className="neuro-favorite-button">
                        <div className="neuro-icon neuro-icon-heart"></div>
                      </div>
                    </div>
                  </div>
                  
                  {restaurant.address && (
                    <div className="neuro-restaurant-address">
                      <div className="neuro-icon neuro-icon-location"></div>
                      <span className="neuro-address-text">{restaurant.address}</span>
                    </div>
                  )}
                  
                  <div className="neuro-restaurant-meta">
                    <div className="neuro-rating-container">
                      <div className="neuro-rating-stars">
                        <div className="neuro-icon neuro-icon-star-filled"></div>
                        <span className="neuro-rating-value">
                          {restaurant.averageRating ? restaurant.averageRating.toFixed(1) : 'New'}
                        </span>
                      </div>
                      <div className="neuro-review-count">
                        {restaurant.reviewCount || 0} reviews
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRecordFeedback(restaurant)}
                    className="neuro-button neuro-button-secondary neuro-restaurant-button"
                  >
                    <div className="neuro-icon neuro-icon-write"></div>
                    <span className="neuro-button-text">Write Review</span>
                  </button>
                  
                  <div className="neuro-card-shine"></div>
                </div>
              ))}
            </div>
            
            {restaurants.length > 6 && (
              <div className="neuro-view-all-container">
                <Link 
                  to="/restaurants"
                  className="neuro-button neuro-button-primary neuro-view-all-button"
                >
                  <div className="neuro-icon neuro-icon-explore"></div>
                  <span className="neuro-button-text">View All Restaurants</span>
                  <span className="neuro-button-shine"></span>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="neuro-cta-section">
        <div className="neuro-container">
          <div className="neuro-cta-card">
            <div className="neuro-cta-decoration">
              <div className="neuro-icon-large neuro-icon-food-large"></div>
              <div className="neuro-cta-sparkles">
                <span className="neuro-sparkle neuro-sparkle-1">✨</span>
                <span className="neuro-sparkle neuro-sparkle-2">✨</span>
                <span className="neuro-sparkle neuro-sparkle-3">✨</span>
              </div>
            </div>
            
            <div className="neuro-cta-content">
              <h2 className="neuro-cta-title">Ready to Start Your Food Journey?</h2>
              <p className="neuro-cta-description">
                Join our community and help others discover amazing dining experiences.
              </p>
              
              <div className="neuro-cta-actions">
                {!currentUser ? (
                  <>
                    <Link 
                      to="/login"
                      className="neuro-button neuro-button-primary neuro-cta-primary"
                    >
                      <div className="neuro-icon neuro-icon-rocket"></div>
                      <span className="neuro-button-text">Join Now - It's Free!</span>
                      <span className="neuro-button-shine"></span>
                    </Link>
                    <p className="neuro-cta-note">No spam, just great food discoveries</p>
                  </>
                ) : (
                  <Link 
                    to="/feedback"
                    className="neuro-button neuro-button-primary neuro-cta-primary"
                  >
                    <div className="neuro-icon neuro-icon-write"></div>
                    <span className="neuro-button-text">Write Your First Review</span>
                    <span className="neuro-button-shine"></span>
                  </Link>
                )}
              </div>
            </div>
            
            <div className="neuro-cta-glow"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;