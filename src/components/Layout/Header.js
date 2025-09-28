// src/components/Layout/Header.js - Simple Neumorphic Header with Separated Navigation
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { currentUser, isOwner, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Dark mode toggle functionality
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
    localStorage.setItem('neuro-theme', newMode ? 'dark' : 'light');
  };

  // Initialize theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('neuro-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark;
    
    setIsDarkMode(initialDarkMode);
    document.documentElement.setAttribute('data-theme', initialDarkMode ? 'dark' : 'light');
  }, []);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };
  
  const navItems = [
    { 
      path: '/', 
      label: 'Home', 
      icon: '🏠',
      show: true 
    },
    { 
      path: '/feedback', 
      label: 'Leave Review', 
      icon: '✍️',
      show: !!currentUser 
    },
    { 
      path: '/my-reviews', 
      label: 'My Reviews', 
      icon: '📝',
      show: !!currentUser 
    },
    { 
      path: '/rewards', 
      label: 'Rewards', 
      icon: '🎁',
      show: !!currentUser 
    },
    { 
      path: '/vouchers', 
      label: 'Vouchers', 
      icon: '🎫',
      show: !!currentUser 
    },
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: '📊',
      show: isOwner,
      highlight: true 
    }
  ];

  const filteredNavItems = navItems.filter(item => item.show);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // For mobile menu
      if (!event.target.closest('.neuro-mobile-menu') && 
          !event.target.closest('.neuro-mobile-backdrop') &&
          !event.target.closest('.neuro-mobile-toggle')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="neuro-header">
      <div className="neuro-header-container">
        {/* Brand Logo - Left Side */}
        <Link to="/" className="neuro-brand">
          <div className="neuro-brand-icon">🍽️</div>
          <span className="neuro-brand-text">Restaurant Review</span>
        </Link>

        {/* Right Side - Navigation + Profile */}
        <div className="neuro-header-right">
          {/* Desktop Navigation */}
          <nav className="neuro-desktop-nav">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`neuro-nav-btn ${
                  isActivePath(item.path) 
                    ? item.highlight 
                      ? 'neuro-nav-highlight'
                      : 'neuro-nav-active'
                    : 'neuro-nav-inactive'
                }`}
              >
                <span className="neuro-nav-icon">{item.icon}</span>
                <span className="neuro-nav-text">{item.label}</span>
                {item.highlight && isActivePath(item.path) && (
                  <span className="neuro-nav-badge">Owner</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Controls Section */}
          <div className="neuro-header-controls">
            {/* BB8 Dark Mode Toggle */}
            <label className="bb8-toggle">
              <input 
                type="checkbox" 
                className="bb8-toggle__checkbox"
                checked={isDarkMode}
                onChange={toggleDarkMode}
              />
              <div className="bb8-toggle__container">
                <div className="bb8-toggle__scenery">
                  <div className="bb8-toggle__star"></div>
                  <div className="bb8-toggle__star"></div>
                  <div className="bb8-toggle__star"></div>
                  <div className="bb8-toggle__star"></div>
                  <div className="bb8-toggle__star"></div>
                  <div className="bb8-toggle__star"></div>
                  <div className="bb8-toggle__star"></div>
                  <div className="bb8-toggle__cloud"></div>
                  <div className="bb8-toggle__cloud"></div>
                  <div className="bb8-toggle__cloud"></div>
                  <div className="gomrassen"></div>
                  <div className="hermes"></div>
                  <div className="chenini"></div>
                  <div className="tatto-1"></div>
                  <div className="tatto-2"></div>
                </div>
                <div className="bb8">
                  <div className="bb8__head-container">
                    <div className="bb8__antenna"></div>
                    <div className="bb8__antenna"></div>
                    <div className="bb8__head"></div>
                  </div>
                  <div className="bb8__body"></div>
                </div>
                <div className="bb8__shadow"></div>
              </div>
            </label>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="neuro-mobile-toggle"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div 
            className="neuro-mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          <div className="neuro-mobile-menu">
            <div className="neuro-mobile-content">
              {/* Mobile Navigation */}
              <div className="neuro-mobile-nav">
                {/* Mobile Dark Mode Toggle */}
                <div className="neuro-mobile-theme-section">
                  <label className="bb8-toggle">
                    <input 
                      type="checkbox" 
                      className="bb8-toggle__checkbox"
                      checked={isDarkMode}
                      onChange={toggleDarkMode}
                    />
                    <div className="bb8-toggle__container">
                      <div className="bb8-toggle__scenery">
                        <div className="bb8-toggle__star"></div>
                        <div className="bb8-toggle__star"></div>
                        <div className="bb8-toggle__star"></div>
                        <div className="bb8-toggle__star"></div>
                        <div className="bb8-toggle__star"></div>
                        <div className="bb8-toggle__star"></div>
                        <div className="bb8-toggle__star"></div>
                        <div className="bb8-toggle__cloud"></div>
                        <div className="bb8-toggle__cloud"></div>
                        <div className="bb8-toggle__cloud"></div>
                        <div className="gomrassen"></div>
                        <div className="hermes"></div>
                        <div className="chenini"></div>
                        <div className="tatto-1"></div>
                        <div className="tatto-2"></div>
                      </div>
                      <div className="bb8">
                        <div className="bb8__head-container">
                          <div className="bb8__antenna"></div>
                          <div className="bb8__antenna"></div>
                          <div className="bb8__head"></div>
                        </div>
                        <div className="bb8__body"></div>
                      </div>
                      <div className="bb8__shadow"></div>
                    </div>
                  </label>
                  <span className="neuro-mobile-theme-label">
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
                
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`neuro-mobile-item ${
                      isActivePath(item.path) 
                        ? item.highlight 
                          ? 'neuro-mobile-highlight'
                          : 'neuro-mobile-active'
                        : 'neuro-mobile-inactive'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="neuro-mobile-icon">{item.icon}</span>
                    <span className="neuro-mobile-text">{item.label}</span>
                    {item.highlight && (
                      <span className="neuro-mobile-badge">Owner</span>
                    )}
                  </Link>
                ))}
              </div>
              
              {/* Mobile User Section */}
              {currentUser ? (
                <>
                  <div className="neuro-mobile-divider"></div>
                  
                  <div className="neuro-mobile-user">
                    <div className="neuro-mobile-user-info">
                      <div className="neuro-mobile-avatar">
                        {currentUser.photoURL ? (
                          <img src={currentUser.photoURL} alt="Profile" />
                        ) : (
                          <span className="neuro-mobile-initial">
                            {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="neuro-mobile-details">
                        <div className="neuro-mobile-name">
                          {currentUser.displayName || 'User'}
                        </div>
                        <div className="neuro-mobile-email">
                          {currentUser.email}
                        </div>
                        {isOwner && (
                          <div className="neuro-mobile-role">Restaurant Owner</div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="neuro-mobile-logout"
                    >
                      <span className="neuro-logout-icon">🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="neuro-mobile-divider"></div>
                  
                  <Link 
                    to="/login" 
                    className="neuro-mobile-login"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="neuro-mobile-icon">👤</span>
                    <span className="neuro-mobile-text">Sign In</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;