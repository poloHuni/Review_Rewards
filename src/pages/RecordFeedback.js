// src/pages/RecordFeedback.js - Beautiful Neumorphic Design Edition
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

  // Neumorphic Loading State
  if (loading) {
    return (
      <div className="neuro-body neuro-full-screen neuro-center-content">
        <div className="neuro-loading-container">
          <div className="neuro-loading-card">
            <div className="neuro-loading-spinner">
              <div className="neuro-spinner-ring"></div>
              <div className="neuro-spinner-inner"></div>
            </div>
            <div className="neuro-loading-icon">🎙️</div>
            <h3 className="neuro-loading-title">Preparing Review System</h3>
            <p className="neuro-loading-text">Setting up your feedback experience...</p>
          </div>
        </div>
      </div>
    );
  }

  // Neumorphic Restaurant Selection Screen
  if (showSelection || !restaurant) {
    return (
      <div className="neuro-body">
        <style jsx>{`
          /* Neumorphic Restaurant Selection Styles */
          .neuro-selection-hero {
            padding: 3rem 0;
            min-height: 100vh;
          }

          .neuro-selection-header {
            text-align: center;
            margin-bottom: 3rem;
            padding: 0 1rem;
          }

          .neuro-selection-badge {
            display: inline-block;
            padding: 0.5rem 1.5rem;
            background: var(--neuro-bg, #e0e0e0);
            border-radius: 30px;
            margin-bottom: 1.5rem;
            box-shadow: 
              inset 4px 4px 8px rgba(0,0,0,0.1),
              inset -4px -4px 8px rgba(255,255,255,0.9);
            color: var(--neuro-text-accent, #667eea);
            font-weight: 600;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
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

          .neuro-restaurant-select-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
          }

          .neuro-restaurant-info {
            flex: 1;
          }

          .neuro-restaurant-name {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--neuro-text-primary, #2c3e50);
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .neuro-restaurant-icon-box {
            width: 3rem;
            height: 3rem;
            border-radius: 12px;
            background: var(--neuro-bg, #e0e0e0);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: 
              inset 3px 3px 6px rgba(0,0,0,0.1),
              inset -3px -3px 6px rgba(255,255,255,0.9);
          }

          .neuro-restaurant-cuisine {
            display: inline-block;
            padding: 0.375rem 1rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 1rem;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }

          .neuro-restaurant-meta {
            display: flex;
            gap: 2rem;
            margin-bottom: 1rem;
          }

          .neuro-meta-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--neuro-text-secondary, #5a6c7d);
            font-size: 0.9rem;
          }

          .neuro-restaurant-description {
            color: var(--neuro-text-secondary, #5a6c7d);
            line-height: 1.6;
            margin-bottom: 1.5rem;
            font-size: 0.95rem;
          }

          .neuro-select-button {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 16px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 
              0 8px 20px rgba(102, 126, 234, 0.4),
              8px 8px 16px rgba(0,0,0,0.1),
              -8px -8px 16px rgba(255,255,255,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
          }

          .neuro-select-button:hover {
            transform: translateY(-2px);
            box-shadow: 
              0 12px 28px rgba(102, 126, 234, 0.5),
              10px 10px 20px rgba(0,0,0,0.15),
              -10px -10px 20px rgba(255,255,255,0.95);
          }

          .neuro-empty-state {
            text-align: center;
            padding: 4rem 2rem;
            background: var(--neuro-bg, #e0e0e0);
            border-radius: 24px;
            box-shadow: 
              inset 8px 8px 16px rgba(0,0,0,0.1),
              inset -8px -8px 16px rgba(255,255,255,0.9);
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
            line-height: 1.6;
            max-width: 400px;
            margin: 0 auto;
          }

          /* Responsive Design */
          @media (min-width: 768px) {
            .neuro-selection-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 2rem;
            }

            .neuro-selection-title {
              font-size: 3rem;
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

          [data-theme="dark"] .neuro-restaurant-icon-box {
            background: #212121;
            box-shadow: 
              inset 3px 3px 6px rgb(25, 25, 25),
              inset -3px -3px 6px rgb(60, 60, 60);
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
                {allRestaurants.map((rest) => (
                  <div 
                    key={rest.id}
                    className="neuro-restaurant-select-card"
                    onClick={() => handleRestaurantSelect(rest)}
                    onMouseEnter={() => setHoveredCard(rest.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className="neuro-restaurant-select-header">
                      <div className="neuro-restaurant-info">
                        <div className="neuro-restaurant-name">
                          <div className="neuro-restaurant-icon-box">
                            {rest.icon || '🍽️'}
                          </div>
                          {rest.name}
                        </div>
                      </div>
                    </div>

                    {rest.cuisine && (
                      <div className="neuro-restaurant-cuisine">
                        {rest.cuisine}
                      </div>
                    )}

                    <div className="neuro-restaurant-meta">
                      <div className="neuro-meta-item">
                        ⭐ {rest.averageRating?.toFixed(1) || 'New'}
                      </div>
                      <div className="neuro-meta-item">
                        💬 {rest.reviewCount || 0} reviews
                      </div>
                    </div>

                    {rest.description && (
                      <p className="neuro-restaurant-description">
                        {rest.description}
                      </p>
                    )}

                    <button className="neuro-select-button">
                      <span>Write Review</span>
                      <span style={{ transform: hoveredCard === rest.id ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 0.3s' }}>→</span>
                    </button>
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

  // Main Feedback Page with Neumorphic Design
  return (
    <div className="neuro-body">
      <style jsx>{`
        /* Neumorphic Feedback Page Styles */
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

        /* Restaurant Header Card */
        .neuro-restaurant-header {
          background: var(--neuro-bg, #e0e0e0);
          border-radius: 32px;
          padding: 2.5rem;
          margin-bottom: 3rem;
          box-shadow: 
            20px 20px 40px rgba(0,0,0,0.15),
            -20px -20px 40px rgba(255,255,255,0.9);
          position: relative;
          overflow: hidden;
        }

        .neuro-restaurant-header::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          opacity: 0.05;
          transform: translate(50%, -50%);
        }

        .neuro-restaurant-header-content {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .neuro-restaurant-details {
          flex: 1;
          min-width: 280px;
        }

        .neuro-restaurant-title-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .neuro-restaurant-icon-large {
          width: 4rem;
          height: 4rem;
          border-radius: 16px;
          background: var(--neuro-bg, #e0e0e0);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          box-shadow: 
            inset 4px 4px 8px rgba(0,0,0,0.1),
            inset -4px -4px 8px rgba(255,255,255,0.9);
        }

        .neuro-restaurant-title {
          font-size: 2rem;
          font-weight: 800;
          color: var(--neuro-text-primary, #2c3e50);
        }

        .neuro-restaurant-badge-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .neuro-info-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--neuro-bg, #e0e0e0);
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--neuro-text-secondary, #5a6c7d);
          box-shadow: 
            inset 3px 3px 6px rgba(0,0,0,0.1),
            inset -3px -3px 6px rgba(255,255,255,0.9);
        }

        .neuro-restaurant-desc {
          color: var(--neuro-text-secondary, #5a6c7d);
          line-height: 1.6;
          margin-top: 1rem;
        }

        /* Stats Panel */
        .neuro-stats-panel {
          display: flex;
          gap: 1.5rem;
          padding: 1.5rem;
          background: var(--neuro-bg, #e0e0e0);
          border-radius: 20px;
          box-shadow: 
            inset 6px 6px 12px rgba(0,0,0,0.1),
            inset -6px -6px 12px rgba(255,255,255,0.9);
        }

        .neuro-stat-item {
          text-align: center;
          padding: 0.5rem 1rem;
        }

        .neuro-stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--neuro-text-primary, #2c3e50);
          display: block;
          margin-bottom: 0.25rem;
        }

        .neuro-stat-label {
          font-size: 0.75rem;
          color: var(--neuro-text-secondary, #5a6c7d);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        /* Form Container */
        .neuro-form-container {
          background: var(--neuro-bg, #e0e0e0);
          border-radius: 32px;
          padding: 2.5rem;
          box-shadow: 
            20px 20px 40px rgba(0,0,0,0.15),
            -20px -20px 40px rgba(255,255,255,0.9);
          margin-bottom: 3rem;
        }

        /* Why Review Section */
        .neuro-why-section {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-top: 3rem;
        }

        .neuro-why-card {
          background: var(--neuro-bg, #e0e0e0);
          border-radius: 24px;
          padding: 2rem;
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
          box-shadow: 
            12px 12px 24px rgba(0,0,0,0.15),
            -12px -12px 24px rgba(255,255,255,0.9);
          transition: all 0.3s ease;
        }

        .neuro-why-card:hover {
          transform: translateY(-3px);
          box-shadow: 
            16px 16px 32px rgba(0,0,0,0.2),
            -16px -16px 32px rgba(255,255,255,0.95);
        }

        .neuro-why-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
        }

        .neuro-why-content {
          flex: 1;
        }

        .neuro-why-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--neuro-text-primary, #2c3e50);
          margin-bottom: 0.5rem;
        }

        .neuro-why-text {
          font-size: 0.9rem;
          color: var(--neuro-text-secondary, #5a6c7d);
          line-height: 1.6;
        }

        /* Responsive Design */
        @media (min-width: 768px) {
          .neuro-restaurant-header {
            padding: 3rem;
          }

          .neuro-form-container {
            padding: 3rem;
          }

          .neuro-why-section {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* Dark mode support */
        [data-theme="dark"] .neuro-feedback-section {
          background: #212121;
        }

        [data-theme="dark"] .neuro-back-button {
          background: #212121;
          color: #b8b8b8;
          box-shadow: 
            8px 8px 16px rgb(25, 25, 25),
            -8px -8px 16px rgb(60, 60, 60);
        }

        [data-theme="dark"] .neuro-restaurant-header {
          background: #212121;
          box-shadow: 
            25px 25px 50px rgb(25, 25, 25),
            -25px -25px 50px rgb(60, 60, 60);
        }

        [data-theme="dark"] .neuro-restaurant-icon-large,
        [data-theme="dark"] .neuro-info-badge,
        [data-theme="dark"] .neuro-stats-panel {
          background: #212121;
          box-shadow: 
            inset 6px 6px 12px rgb(25, 25, 25),
            inset -6px -6px 12px rgb(60, 60, 60);
        }

        [data-theme="dark"] .neuro-form-container {
          background: #212121;
          box-shadow: 
            25px 25px 50px rgb(25, 25, 25),
            -25px -25px 50px rgb(60, 60, 60);
        }

        [data-theme="dark"] .neuro-why-card {
          background: #212121;
          box-shadow: 
            15px 15px 30px rgb(25, 25, 25),
            -15px -15px 30px rgb(60, 60, 60);
        }

        [data-theme="dark"] .neuro-why-card:hover {
          box-shadow: 
            20px 20px 40px rgb(25, 25, 25),
            -20px -20px 40px rgb(60, 60, 60);
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

          {/* Restaurant Header */}
          <div className="neuro-restaurant-header">
            <div className="neuro-restaurant-header-content">
              <div className="neuro-restaurant-details">
                <div className="neuro-restaurant-title-row">
                  <div className="neuro-restaurant-icon-large">
                    {restaurant.icon || '🍽️'}
                  </div>
                  <h1 className="neuro-restaurant-title">
                    {restaurant.name}
                  </h1>
                </div>

                <div className="neuro-restaurant-badge-row">
                  {restaurant.cuisine && (
                    <span className="neuro-info-badge">
                      🍴 {restaurant.cuisine}
                    </span>
                  )}
                  <span className="neuro-info-badge">
                    ⭐ {restaurant.averageRating?.toFixed(1) || 'New'}
                  </span>
                  <span className="neuro-info-badge">
                    📍 {restaurant.location || 'Local'}
                  </span>
                </div>

                {restaurant.description && (
                  <p className="neuro-restaurant-desc">
                    {restaurant.description}
                  </p>
                )}
              </div>

              {/* Stats Panel */}
              <div className="neuro-stats-panel">
                <div className="neuro-stat-item">
                  <span className="neuro-stat-value">
                    {restaurant.reviewCount || 0}
                  </span>
                  <span className="neuro-stat-label">Reviews</span>
                </div>
                <div className="neuro-stat-item">
                  <span className="neuro-stat-value">
                    {restaurant.averageRating?.toFixed(1) || '—'}
                  </span>
                  <span className="neuro-stat-label">Rating</span>
                </div>
                <div className="neuro-stat-item">
                  <span className="neuro-stat-value">
                    {restaurant.recommendationRate || 85}%
                  </span>
                  <span className="neuro-stat-label">Recommend</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Form Container */}
          <div className="neuro-form-container">
            <FeedbackForm 
              restaurant={restaurant}
              onSuccess={() => navigate('/my-reviews')}
            />
          </div>

          {/* Why Leave a Review Section */}
          <div className="neuro-why-section">
            <div className="neuro-why-card">
              <div className="neuro-why-icon">👥</div>
              <div className="neuro-why-content">
                <h4 className="neuro-why-title">Help Others</h4>
                <p className="neuro-why-text">
                  Your honest feedback helps other diners make informed decisions about where to eat.
                </p>
              </div>
            </div>

            <div className="neuro-why-card">
              <div className="neuro-why-icon">📈</div>
              <div className="neuro-why-content">
                <h4 className="neuro-why-title">Improve Service</h4>
                <p className="neuro-why-text">
                  Restaurants use your feedback to enhance their food quality and customer service.
                </p>
              </div>
            </div>

            <div className="neuro-why-card">
              <div className="neuro-why-icon">🎁</div>
              <div className="neuro-why-content">
                <h4 className="neuro-why-title">Earn Rewards</h4>
                <p className="neuro-why-text">
                  Complete reviews to earn points and unlock exclusive rewards and discounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RecordFeedback;