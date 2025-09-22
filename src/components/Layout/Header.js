// src/components/Layout/Header.js - Beautiful Neumorphic Header with Dark Mode
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown, User, LogOut, Menu, X, MessageSquare, BarChart3, Gift, Ticket } from 'lucide-react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
      setUserMenuOpen(false);
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
  
  return (
    <header className="neuro-header">
      <div className="neuro-header-container">
        <div className="neuro-header-content">
          
          {/* Logo and Brand */}
          <div className="neuro-header-brand">
            <Link 
              to="/" 
              className="neuro-brand-link"
            >
              <div className="neuro-brand-icon-container">
                <span className="neuro-brand-icon">🍽️</span>
              </div>
              <div className="neuro-brand-text">
                <h1 className="neuro-brand-title">Restaurant Review</h1>
                <p className="neuro-brand-subtitle">AI-Powered Feedback</p>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="neuro-desktop-nav">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`neuro-nav-item ${
                  isActivePath(item.path) 
                    ? item.highlight 
                      ? 'neuro-nav-item-highlight-active'
                      : 'neuro-nav-item-active'
                    : 'neuro-nav-item-inactive'
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
          
          {/* Right Side Actions */}
          <div className="neuro-header-actions">
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleDarkMode} 
              className="neuro-theme-toggle-header"
              title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              <span className="neuro-toggle-icon">{isDarkMode ? '☀️' : '🌙'}</span>
            </button>
            
            {/* User Menu or Login */}
            {currentUser ? (
              <div className="neuro-user-menu">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="neuro-user-button"
                >
                  <div className="neuro-user-avatar">
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt="Profile" 
                        className="neuro-avatar-image"
                      />
                    ) : (
                      <div className="neuro-avatar-placeholder">
                        {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="neuro-user-info">
                    <div className="neuro-user-name">
                      {currentUser.displayName || currentUser.name || currentUser.email?.split('@')[0] || 'User'}
                    </div>
                    {isOwner && (
                      <div className="neuro-user-role">
                        🏪 Owner
                      </div>
                    )}
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`neuro-user-chevron ${userMenuOpen ? 'neuro-chevron-open' : ''}`} 
                  />
                </button>
                
                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div 
                      className="neuro-dropdown-backdrop" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="neuro-user-dropdown">
                      {/* User Profile Section */}
                      <div className="neuro-dropdown-header">
                        <div className="neuro-dropdown-user-info">
                          <div className="neuro-dropdown-avatar">
                            {currentUser.photoURL ? (
                              <img 
                                src={currentUser.photoURL} 
                                alt="Profile" 
                                className="neuro-dropdown-avatar-image"
                              />
                            ) : (
                              <div className="neuro-dropdown-avatar-placeholder">
                                {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="neuro-dropdown-user-text">
                            <div className="neuro-dropdown-name">
                              {currentUser.displayName || currentUser.name || currentUser.email?.split('@')[0] || 'User'}
                            </div>
                            <div className="neuro-dropdown-email">
                              {currentUser.email}
                            </div>
                            {isOwner && (
                              <div className="neuro-dropdown-role">
                                🏪 Restaurant Owner
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Navigation items for mobile in dropdown */}
                      <div className="neuro-dropdown-nav">
                        {filteredNavItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`neuro-dropdown-item ${
                              isActivePath(item.path) 
                                ? item.highlight 
                                  ? 'neuro-dropdown-item-highlight'
                                  : 'neuro-dropdown-item-active'
                                : 'neuro-dropdown-item-inactive'
                            }`}
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <span className="neuro-dropdown-icon">{item.icon}</span>
                            <span className="neuro-dropdown-text">{item.label}</span>
                            {item.highlight && isActivePath(item.path) && (
                              <span className="neuro-dropdown-badge">Owner</span>
                            )}
                          </Link>
                        ))}
                      </div>
                        
                      {/* Profile Button */}
                      <button
                        className="neuro-dropdown-item neuro-dropdown-item-inactive"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="neuro-dropdown-icon">👤</span>
                        <span className="neuro-dropdown-text">Profile Settings</span>
                      </button>
                        
                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        className="neuro-dropdown-item neuro-dropdown-item-logout"
                      >
                        <span className="neuro-dropdown-icon">🚪</span>
                        <span className="neuro-dropdown-text">Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="neuro-login-button"
              >
                <span className="neuro-login-icon">🚀</span>
                <span className="neuro-login-text">Sign In</span>
              </Link>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="neuro-mobile-menu-button"
            >
              <span className="neuro-mobile-menu-icon">
                {mobileMenuOpen ? '✕' : '☰'}
              </span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="neuro-mobile-menu">
          <div className="neuro-mobile-menu-content">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`neuro-mobile-menu-item ${
                  isActivePath(item.path) 
                    ? item.highlight 
                      ? 'neuro-mobile-item-highlight'
                      : 'neuro-mobile-item-active'
                    : 'neuro-mobile-item-inactive'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="neuro-mobile-icon">{item.icon}</span>
                <span className="neuro-mobile-text">{item.label}</span>
                {item.highlight && isActivePath(item.path) && (
                  <span className="neuro-mobile-badge">Owner</span>
                )}
              </Link>
            ))}
            
            {currentUser && (
              <>
                <div className="neuro-mobile-divider"></div>
                <button
                  onClick={handleLogout}
                  className="neuro-mobile-menu-item neuro-mobile-item-logout"
                >
                  <span className="neuro-mobile-icon">🚪</span>
                  <span className="neuro-mobile-text">Sign Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;