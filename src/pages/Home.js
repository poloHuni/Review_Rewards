// src/pages/Home.js - Updated with Enhanced Neumorphic Stats & How It Works Sections
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllRestaurants } from '../services/restaurantService';
import { useAuth } from '../contexts/AuthContext';
import { createSlug } from '../utils/stringUtils';
import { 
  UtensilsIcon, 
  StarIcon, 
  UsersIcon,
  QrCodeIcon,
  MicIcon,
  SparklesIcon,
  BookOpenIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrendingUpIcon,
  AwardIcon,
  HeartIcon
} from 'lucide-react';

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

  // SIMPLE CIRCULAR STATS SECTION COMPONENT
  const StatsSection = ({ stats }) => {
    return (
      <>
        {stats.totalRestaurants > 0 && (
          <section className="neuro-simple-stats-section">
            <div className="neuro-container">
              <div className="neuro-simple-stats-grid">
                <div className="neuro-circular-stat">
                  <div className="neuro-circular-icon">
                    <UtensilsIcon size={20} />
                  </div>
                  <div className="neuro-circular-number">{stats.totalRestaurants}</div>
                  <div className="neuro-circular-label">Restaurants</div>
                </div>
                
                <div className="neuro-circular-stat">
                  <div className="neuro-circular-icon">
                    <StarIcon size={20} fill="currentColor" />
                  </div>
                  <div className="neuro-circular-number">{stats.totalReviews}</div>
                  <div className="neuro-circular-label">Reviews</div>
                </div>
                
                <div className="neuro-circular-stat">
                  <div className="neuro-circular-icon">
                    <UsersIcon size={20} />
                  </div>
                  <div className="neuro-circular-number">500+</div>
                  <div className="neuro-circular-label">Food Lovers</div>
                </div>
              </div>
            </div>
          </section>
        )}
      </>
    );
  };

  // ENHANCED HOW IT WORKS SECTION COMPONENT
  const HowItWorksSection = () => {
    const [expandedStep, setExpandedStep] = useState(null);

    const steps = [
      {
        number: 1,
        icon: QrCodeIcon,
        title: "Scan QR & Start",
        emoji: "📱",
        summary: "Instant access to our review platform",
        details: "Scan the QR code at your table to instantly access our platform. It automatically identifies your restaurant and table - no app download needed."
      },
      {
        number: 2,
        icon: MicIcon,
        title: "Share Your Experience",
        emoji: "🎤",
        summary: "Voice or text - your choice",
        details: "Tell us about your dining experience using voice recording or traditional text input. Our AI captures all the details of your visit."
      },
      {
        number: 3,
        icon: SparklesIcon,
        title: "AI Analysis Magic",
        emoji: "✨",
        summary: "Smart processing of your feedback",
        details: "Our advanced AI analyzes your feedback, categorizing insights about food quality, service, atmosphere, and more for actionable results."
      },
      {
        number: 4,
        icon: BookOpenIcon,
        title: "Help Others Discover",
        emoji: "📚",
        summary: "Your review helps the community",
        details: "Your authentic review becomes part of our community knowledge, helping other food lovers discover great restaurants and experiences."
      }
    ];

    return (
      <section className="neuro-enhanced-how-section">
        <div className="neuro-container">
          {/* Section Header */}
          <div className="neuro-how-header">
            <div className="neuro-how-badge">
              <SparklesIcon size={18} />
              <span>Simple Process</span>
            </div>
            <h2 className="neuro-how-title">How It Works</h2>
            <p className="neuro-how-subtitle">
              Four simple steps to share your authentic dining experience
            </p>
          </div>

          {/* Enhanced Steps */}
          <div className="neuro-enhanced-steps-container">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isExpanded = expandedStep === step.number;
              
              return (
                <div key={step.number} className="neuro-enhanced-step-wrapper">
                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <div className="neuro-step-connector">
                      <div className="neuro-connector-line"></div>
                      <ArrowRightIcon size={20} className="neuro-connector-arrow" />
                    </div>
                  )}

                  <div className="neuro-enhanced-step-card">
                    <div className="neuro-step-decoration"></div>
                    
                    {/* Step Header */}
                    <div className="neuro-enhanced-step-header">
                      <div className="neuro-enhanced-step-number">
                        <span>{step.number}</span>
                      </div>
                      
                      <div className="neuro-enhanced-step-icon">
                        <IconComponent size={24} />
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="neuro-enhanced-step-content">
                      <h3 className="neuro-enhanced-step-title">{step.title}</h3>
                      <p className="neuro-enhanced-step-summary">{step.summary}</p>
                      
                      {/* Expandable Details */}
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.number)}
                        className="neuro-details-toggle"
                      >
                        <span>Learn More</span>
                        {isExpanded ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
                      </button>

                      {/* Expanded Content */}
                      <div className={`neuro-step-details ${isExpanded ? 'expanded' : ''}`}>
                        <div className="neuro-step-details-content">
                          <p>{step.details}</p>
                        </div>
                      </div>
                    </div>

                    {/* Floating Emoji */}
                    <div className="neuro-step-emoji">{step.emoji}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
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

      {/* Simple Circular Stats Section */}
      <StatsSection stats={stats} />

      {/* Featured Restaurants - Exact Blog Card Style Match */}
      {restaurants.length > 0 && (
        <section id="restaurants-section" className="neuro-restaurants-section">
          <div className="neuro-container">
            <div className="neuro-section-header">
              <div className="neuro-section-title-button">
                <h2 className="neuro-section-title">Featured Restaurants</h2>
              </div>
              <p className="neuro-section-subtitle">
                Discover amazing places loved by our community
              </p>
            </div>
            
            <div className="row">
              {restaurants.slice(0, 6).map((restaurant, index) => {
                // Luxury restaurant images array
                const luxuryImages = [
                  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1551218808-94e220e084d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                ];

                return (
                  <div key={restaurant.restaurant_id} className="col-12 col-md-6 col-lg-4 mb-4">
                    <div className="card bg-primary border-light shadow-soft">
                      <img 
                        src={luxuryImages[index % luxuryImages.length]} 
                        className="card-img-top rounded-top" 
                        alt={restaurant.name}
                      />
                      <div className="card-body">
                        <span className="h6 icon-tertiary small">
                          <span className="fas fa-utensils mr-2"></span>
                          {restaurant.category || 'Restaurant'}
                        </span>
                        <h3 className="h5 card-title mt-3">{restaurant.name}</h3>
                        <p className="card-text">
                          {restaurant.address ? (
                            `Located in ${restaurant.address.split(',')[0] || restaurant.address}. Experience exceptional dining with carefully crafted dishes.`
                          ) : (
                            `Experience exceptional ${restaurant.category?.toLowerCase() || 'dining'} cuisine with carefully crafted dishes and welcoming atmosphere.`
                          )}
                        </p>
                        <a 
                          href={`/record-feedback/${encodeURIComponent(restaurant.name?.toLowerCase().replace(/\s+/g, '-'))}`}
                          className="btn btn-primary btn-sm"
                        >
                          Write Review
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {restaurants.length > 6 && (
              <div className="row mt-4">
                <div className="col-12 text-center">
                  <Link 
                    to="/restaurants"
                    className="btn btn-primary"
                  >
                    View All Restaurants
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Enhanced How It Works Section - Now Below Restaurants */}
      <HowItWorksSection />

      <style jsx>{`
        /* Simple Circular Stats Section Styles */
        .neuro-simple-stats-section {
          padding: 2rem 0;
          background: var(--neuro-bg);
        }

        .neuro-simple-stats-grid {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 3rem;
          flex-wrap: wrap;
          max-width: 600px;
          margin: 0 auto;
        }

        .neuro-circular-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .neuro-circular-icon {
          background: var(--neuro-bg);
          width: 4rem;
          height: 4rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--neuro-text-accent);
          margin-bottom: 1rem;
          transition: var(--neuro-transition);
          box-shadow: 
            8px 8px 16px var(--neuro-shadow-dark),
            -8px -8px 16px var(--neuro-shadow-light);
        }

        .neuro-circular-icon:hover {
          transform: translateY(-2px);
          box-shadow: 
            12px 12px 20px var(--neuro-shadow-dark),
            -12px -12px 20px var(--neuro-shadow-light);
        }

        .neuro-circular-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--neuro-text-primary);
          margin-bottom: 0.25rem;
          line-height: 1;
        }

        .neuro-circular-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--neuro-text-secondary);
          letter-spacing: 0.025em;
        }

        /* Enhanced How It Works Section Styles */
        .neuro-enhanced-how-section {
          padding: 4rem 0;
          background: var(--neuro-bg);
          position: relative;
        }

        .neuro-how-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .neuro-how-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--neuro-bg);
          padding: 0.75rem 1.25rem;
          border-radius: var(--neuro-radius-lg);
          color: var(--neuro-text-accent);
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          box-shadow: 
            6px 6px 12px var(--neuro-shadow-dark),
            -6px -6px 12px var(--neuro-shadow-light);
        }

        .neuro-how-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--neuro-text-primary);
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .neuro-how-subtitle {
          font-size: 1.125rem;
          color: var(--neuro-text-secondary);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .neuro-enhanced-steps-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
        }

        .neuro-enhanced-step-wrapper {
          position: relative;
        }

        .neuro-step-connector {
          position: absolute;
          top: 50%;
          right: -1rem;
          transform: translateY(-50%);
          z-index: 1;
          display: none;
        }

        .neuro-connector-line {
          width: 2rem;
          height: 2px;
          background: linear-gradient(90deg, var(--neuro-text-light), transparent);
          position: relative;
        }

        .neuro-connector-arrow {
          position: absolute;
          right: -10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--neuro-text-light);
        }

        .neuro-enhanced-step-card {
          background: var(--neuro-bg);
          border-radius: var(--neuro-radius-xl);
          padding: 2rem;
          position: relative;
          transition: var(--neuro-transition);
          overflow: hidden;
          text-align: center;
          box-shadow: 
            10px 10px 25px var(--neuro-shadow-dark),
            -10px -10px 25px var(--neuro-shadow-light);
        }

        .neuro-enhanced-step-card:hover {
          transform: translateY(-8px);
          box-shadow: 
            15px 15px 35px var(--neuro-shadow-dark),
            -15px -15px 35px var(--neuro-shadow-light);
        }

        .neuro-step-decoration {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 3px;
          background: var(--neuro-primary);
          border-radius: 0 0 1.5px 1.5px;
          opacity: 0.6;
        }

        .neuro-enhanced-step-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .neuro-enhanced-step-number {
          background: var(--neuro-bg);
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--neuro-text-accent);
          box-shadow: 
            inset 4px 4px 8px var(--neuro-shadow-inner-dark),
            inset -4px -4px 8px var(--neuro-shadow-inner-light);
        }

        .neuro-enhanced-step-icon {
          background: var(--neuro-bg);
          width: 3.5rem;
          height: 3.5rem;
          border-radius: var(--neuro-radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--neuro-text-primary);
          box-shadow: 
            6px 6px 12px var(--neuro-shadow-dark),
            -6px -6px 12px var(--neuro-shadow-light);
        }

        .neuro-enhanced-step-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: var(--neuro-text-primary);
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }

        .neuro-enhanced-step-summary {
          font-size: 1rem;
          color: var(--neuro-text-secondary);
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .neuro-details-toggle {
          background: var(--neuro-bg);
          border: none;
          padding: 0.75rem 1rem;
          border-radius: var(--neuro-radius-md);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--neuro-text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 auto 1rem auto;
          transition: var(--neuro-transition);
          box-shadow: 
            4px 4px 8px var(--neuro-shadow-dark),
            -4px -4px 8px var(--neuro-shadow-light);
        }

        .neuro-details-toggle:hover {
          transform: translateY(-2px);
          box-shadow: 
            6px 6px 12px var(--neuro-shadow-dark),
            -6px -6px 12px var(--neuro-shadow-light);
        }

        .neuro-details-toggle:active {
          transform: translateY(0);
          box-shadow: 
            inset 2px 2px 4px var(--neuro-shadow-inner-dark),
            inset -2px -2px 4px var(--neuro-shadow-inner-light);
        }

        .neuro-step-details {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .neuro-step-details.expanded {
          max-height: 200px;
        }

        .neuro-step-details-content {
          background: var(--neuro-bg);
          padding: 1rem;
          border-radius: var(--neuro-radius-sm);
          margin-top: 0.5rem;
          box-shadow: 
            inset 3px 3px 6px var(--neuro-shadow-inner-dark),
            inset -3px -3px 6px var(--neuro-shadow-inner-light);
        }

        .neuro-step-details-content p {
          color: var(--neuro-text-secondary);
          font-size: 0.875rem;
          line-height: 1.6;
          margin: 0;
        }

        .neuro-step-emoji {
          position: absolute;
          top: 1rem;
          right: 1rem;
          font-size: 2rem;
          opacity: 0.1;
          pointer-events: none;
        }

        /* Responsive Design */
        @media (min-width: 768px) {
          .neuro-enhanced-steps-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .neuro-enhanced-steps-container {
            grid-template-columns: repeat(4, 1fr);
          }

          .neuro-step-connector {
            display: block;
          }
        }

        @media (max-width: 767px) {
          .neuro-simple-stats-grid {
            gap: 2rem;
          }

          .neuro-circular-icon {
            width: 3.5rem;
            height: 3.5rem;
          }

          .neuro-circular-number {
            font-size: 1.25rem;
          }

          .neuro-enhanced-how-section {
            padding: 3rem 0;
          }

          .neuro-how-title {
            font-size: 2rem;
          }

          .neuro-enhanced-step-card {
            padding: 1.5rem;
          }

          .neuro-enhanced-step-header {
            flex-direction: column;
            gap: 0.75rem;
          }

          .neuro-enhanced-step-title {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;