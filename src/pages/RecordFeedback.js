// src/pages/RecordFeedback.js - Beautiful Neumorphic Design Edition
// Updated with Home Page Restaurant Card Design
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
  const [hoveredCard, setHoveredCard] = useState(null);

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
    navigate(`/feedback/${slug}`, { replace: true });
  };

  // Restaurant Selection Screen
  if (showSelection || loading) {
    return (
      <div className="neuro-body">
        <style jsx>{`
          .neuro-selection-hero {
            min-height: 100vh;
            padding: 4rem 0;
            display: flex;
            align-items: center;
          }

          .neuro-selection-header {
            text-align: center;
            margin-bottom: 3rem;
          }

          .neuro-selection-badge {
            display: inline-block;
            padding: 0.5rem 1.5rem;
            background: var(--neuro-bg, #e0e0e0);
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--neuro-text-accent, #667eea);
            margin-bottom: 1rem;
            box-shadow: 
              inset 3px 3px 6px rgba(0,0,0,0.1),
              inset -3px -3px 6px rgba(255,255,255,0.9);
          }

          .neuro-selection-title {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--neuro-text-primary, #2c3e50);
            margin-bottom: 1rem;
            line-height: 1.2;
          }

          .neuro-selection-subtitle {
            font-size: 1.125rem;
            color: var(--neuro-text-secondary, #5a6c7d);
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.6;
          }

          .neuro-selection-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
          }

          .neuro-restaurant-select-card {
            background: var(--neuro-bg, #e0e0e0);
            border-radius: 24px;
            padding: 2rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            box-shadow: 
              12px 12px 24px rgba(0,0,0,0.15),
              -12px -12px 24px rgba(255,255,255,0.9);
          }

          .neuro-restaurant-select-card:hover {
            transform: translateY(-4px);
            box-shadow: 
              16px 16px 32px rgba(0,0,0,0.2),
              -16px -16px 32px rgba(255,255,255,0.95);
          }

          .neuro-restaurant-select-card:active {
            transform: translateY(-2px);
            box-shadow: 
              inset 4px 4px 8px rgba(0,0,0,0.15),
              inset -4px -4px 8px rgba(255,255,255,0.9);
          }

          .neuro-empty-state {
            text-align: center;
            padding: 4rem 2rem;
          }

          .neuro-empty-icon {
            font-size: 4rem;
            margin-bottom: 1.5rem;
          }

          .neuro-empty-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--neuro-text-primary, #2c3e50);
            margin-bottom: 1rem;
          }

          .neuro-empty-text {
            color: var(--neuro-text-secondary, #5a6c7d);
            font-size: 1rem;
            line-height: 1.6;
          }

          @media (min-width: 768px) {
            .neuro-selection-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 2rem;
            }
          }

          @media (min-width: 1024px) {
            .neuro-selection-grid {
              grid-template-columns: repeat(3, 1fr);
            }

            .neuro-selection-title {
              font-size: 3.5rem;
            }
          }

          /* Dark mode support */
          [data-theme="dark"] .neuro-restaurant-select-card {
            background: #212121;
            box-shadow: 
              15px 15px 30px rgb(25, 25, 25),
              -15px -15px 30px rgb(60, 60, 60);
          }

          [data-theme="dark"] .neuro-restaurant-select-card:hover {
            box-shadow: 
              20px 20px 40px rgb(25, 25, 25),
              -20px -20px 40px rgb(60, 60, 60);
          }

          [data-theme="dark"] .neuro-selection-badge {
            background: #212121;
            box-shadow: 
              inset 4px 4px 8px rgb(25, 25, 25),
              inset -4px -4px 8px rgb(60, 60, 60);
          }
        `}</style>

        <section className="neuro-selection-hero">
          <div className="neuro-container">
            {/* Header */}
            <div className="neuro-selection-header">
              <div className="neuro-selection-badge">
                Step 1 of 2
              </div>
              <h1 className="neuro-selection-title">
                Choose Your Restaurant
              </h1>
              <p className="neuro-selection-subtitle">
                Select the restaurant you'd like to review and help others discover great dining experiences
              </p>
            </div>

            {/* Restaurant Grid */}
            {allRestaurants.length > 0 ? (
              <div className="neuro-selection-grid">
                {allRestaurants.map((restaurant, index) => (
                  <div 
                    key={restaurant.restaurant_id}
                    className="neuro-restaurant-select-card"
                    onClick={() => handleRestaurantSelect(restaurant)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '12px',
                        background: 'var(--neuro-bg, #e0e0e0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.1), inset -3px -3px 6px rgba(255,255,255,0.9)'
                      }}>
                        {restaurant.icon || '🍽️'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: '700',
                          color: 'var(--neuro-text-primary, #2c3e50)',
                          marginBottom: '0.25rem'
                        }}>
                          {restaurant.name}
                        </h3>
                        <p style={{ 
                          fontSize: '0.875rem',
                          color: 'var(--neuro-text-secondary, #5a6c7d)',
                          margin: 0
                        }}>
                          {restaurant.cuisine || 'Restaurant'} • {restaurant.address?.split(',')[0] || 'Location'}
                        </p>
                      </div>
                      <span style={{ transform: hoveredCard === index ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 0.3s' }}>→</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="neuro-empty-state">
                <div className="neuro-empty-icon">📍</div>
                <h3 className="neuro-empty-title">No Restaurants Available</h3>
                <p className="neuro-empty-text">
                  We're currently setting up our restaurant network. Please check back soon!
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // Main Feedback Page with Home Page Card Design
  return (
    <div className="neuro-body">
      <style jsx>{`
        /* Feedback Page Styles - Matching Home Page */
        .neuro-feedback-section {
          padding: 3rem 0;
          min-height: 100vh;
        }

        .neuro-feedback-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        /* Back Button */
        .neuro-back-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: var(--neuro-bg, #e0e0e0);
          border: none;
          border-radius: 50px;
          color: var(--neuro-text-secondary, #5a6c7d);
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 2rem;
          box-shadow: 
            6px 6px 12px rgba(0,0,0,0.15),
            -6px -6px 12px rgba(255,255,255,0.9);
        }

        .neuro-back-button:hover {
          color: var(--neuro-text-primary, #2c3e50);
          transform: translateY(-2px);
          box-shadow: 
            8px 8px 16px rgba(0,0,0,0.2),
            -8px -8px 16px rgba(255,255,255,0.95);
        }

        .neuro-back-button:active {
          transform: translateY(0);
          box-shadow: 
            inset 2px 2px 4px rgba(0,0,0,0.15),
            inset -2px -2px 4px rgba(255,255,255,0.9);
        }

        /* Restaurant Card - Matching Home Page Design */
        .restaurant-header-section {
          margin-bottom: 3rem;
        }

        .restaurant-card-container {
          max-width: 600px;
          margin: 0 auto;
        }

        /* Override existing card styles to match home page exactly */
        .restaurant-card {
          border-radius: var(--neuro-radius-lg, 20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          overflow: hidden !important;
          transition: all 0.3s ease !important;
          background: var(--neuro-bg, #e0e0e0) !important;
          padding: 0 !important;
          box-shadow: 
            8px 8px 20px var(--neuro-shadow-dark, rgba(0,0,0,0.15)),
            -8px -8px 20px var(--neuro-shadow-light, rgba(255,255,255,0.9)),
            0 0 0 1px rgba(255, 255, 255, 0.05) !important;
        }

        .restaurant-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 
            12px 12px 30px var(--neuro-shadow-dark, rgba(0,0,0,0.15)),
            -12px -12px 30px var(--neuro-shadow-light, rgba(255,255,255,0.9)),
            0 0 0 1px rgba(255, 255, 255, 0.1) !important;
        }

        .restaurant-card-img-top {
          height: 280px !important;
          width: 100% !important;
          object-fit: cover !important;
          border-radius: 0 !important;
          display: block !important;
          margin: 0 !important;
        }

        .restaurant-card-body {
          padding: 2rem !important;
        }

        .restaurant-category-badge {
          color: #6c757d !important;
          font-weight: 400 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          font-size: 0.75rem !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          margin-bottom: 1rem !important;
        }

        .restaurant-category-icon {
          font-size: 0.75rem !important;
        }

        .restaurant-card-title {
          color: var(--neuro-text-primary, #2c3e50) !important;
          font-weight: 600 !important;
          font-size: 1.5rem !important;
          line-height: 1.4 !important;
          margin-bottom: 0.75rem !important;
        }

        .restaurant-card-text {
          color: var(--neuro-text-secondary, #5a6c7d) !important;
          font-size: 0.875rem !important;
          line-height: 1.6 !important;
          margin-bottom: 1.5rem !important;
        }

        .restaurant-rating-badge {
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          background: var(--neuro-text-accent, #667eea) !important;
          color: white !important;
          padding: 0.5rem 1rem !important;
          border-radius: 20px !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          margin-bottom: 1rem !important;
        }



        /* Dark mode adjustments */
        [data-theme="dark"] .restaurant-card {
          background: var(--neuro-bg, #212121) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          box-shadow: 
            15px 15px 30px var(--neuro-shadow-dark, rgb(25, 25, 25)),
            -15px -15px 30px var(--neuro-shadow-light, rgb(60, 60, 60)),
            0 0 0 1px rgba(255, 255, 255, 0.03) !important;
        }

        [data-theme="dark"] .restaurant-card:hover {
          box-shadow: 
            20px 20px 40px var(--neuro-shadow-dark, rgb(25, 25, 25)),
            -20px -20px 40px var(--neuro-shadow-light, rgb(60, 60, 60)),
            0 0 0 1px rgba(255,255,255,0.1) !important;
        }

        [data-theme="dark"] .restaurant-category-badge {
          color: var(--neuro-text-secondary, #b8b8b8) !important;
        }

        [data-theme="dark"] .restaurant-card-title {
          color: var(--neuro-text-primary, #e8e8e8) !important;
        }

        [data-theme="dark"] .restaurant-card-text {
          color: var(--neuro-text-secondary, #b8b8b8) !important;
        }

        [data-theme="dark"] .restaurant-rating-badge {
          background: var(--neuro-text-accent, #7c9aff) !important;
        }

        [data-theme="dark"] .neuro-back-button {
          background: #212121;
          box-shadow: 
            10px 10px 20px rgb(25, 25, 25),
            -10px -10px 20px rgb(60, 60, 60);
        }

        [data-theme="dark"] .neuro-back-button:hover {
          box-shadow: 
            15px 15px 30px rgb(25, 25, 25),
            -15px -15px 30px rgb(60, 60, 60);
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .neuro-feedback-section {
            padding: 2rem 0;
          }

          .restaurant-card-container {
            max-width: 100%;
          }

          .restaurant-card-img-top {
            height: 220px !important;
          }

          .restaurant-card-body {
            padding: 1.5rem !important;
          }

          .restaurant-card-title {
            font-size: 1.25rem !important;
          }
        }
      `}</style>

      <section className="neuro-feedback-section">
        <div className="neuro-feedback-container">
          {/* Back Button */}
          <button
            onClick={() => setShowSelection(true)}
            className="neuro-back-button"
          >
            <span>←</span>
            <span>Choose Different Restaurant</span>
          </button>

          {/* Restaurant Header - Matching Home Page Card Design */}
          <div className="restaurant-header-section">
            <div className="restaurant-card-container">
              <div className="restaurant-card card bg-primary border-light shadow-soft">
                {/* Restaurant Image */}
                {(() => {
                  const luxuryImages = [
                    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1551218808-94e220e084d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                  ];
                  
                  // Use restaurant ID to consistently pick the same image
                  const imageIndex = restaurant.restaurant_id ? 
                    Math.abs(restaurant.restaurant_id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % luxuryImages.length : 
                    0;
                  
                  return (
                    <img 
                      src={luxuryImages[imageIndex]}
                      className="restaurant-card-img-top card-img-top rounded-top" 
                      alt={restaurant.name}
                    />
                  );
                })()}
                
                <div className="restaurant-card-body card-body">
                  {/* Category Badge */}
                  <span className="restaurant-category-badge h6 icon-tertiary small">
                    <span className="restaurant-category-icon fas fa-utensils mr-2">🍴</span>
                    {restaurant.category || restaurant.cuisine || 'Restaurant'}
                  </span>
                  
                  {/* Restaurant Title */}
                  <h2 className="restaurant-card-title h4 card-title mt-3">
                    {restaurant.name}
                  </h2>
                  
                  {/* Description */}
                  <p className="restaurant-card-text card-text">
                    {restaurant.address ? (
                      `Located in ${restaurant.address.split(',')[0] || restaurant.address}. `
                    ) : ''}
                    {restaurant.description || 
                     `Experience exceptional dining at ${restaurant.name}. Share your thoughts about the food, service, and atmosphere to help other diners discover this amazing place.`}
                  </p>
                  
                  {/* Rating and Reviews Info */}
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {restaurant.averageRating && (
                      <div className="restaurant-rating-badge">
                        <span>⭐</span>
                        <span>{restaurant.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                    
                    {restaurant.reviewCount && (
                      <span style={{ 
                        fontSize: '0.875rem',
                        color: 'var(--neuro-text-secondary, #5a6c7d)',
                        fontWeight: '500'
                      }}>
                        {restaurant.reviewCount} review{restaurant.reviewCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  

                </div>
              </div>
            </div>
          </div>

          {/* Feedback Form */}
          <FeedbackForm 
            restaurantId={restaurant.restaurant_id} 
            restaurantName={restaurant.name}
            placeId={restaurant.place_id}
          />
        </div>
      </section>
    </div>
  );
};

export default RecordFeedback;