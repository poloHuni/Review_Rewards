// src/components/Layout/Header.js - Beautiful Neumorphic Header with Dark Mode
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown, User, LogOut, Menu, X, MessageSquare, BarChart3, Gift, Ticket, Sun, Moon, Home } from 'lucide-react';

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
      path: '/admin-dashboard', 
      label: 'Admin', 
      icon: '⚙️',
      show: isOwner,
      highlight: true 
    }
  ];
  
  const filteredNavItems = navItems.filter(item => item.show);
  
  return (
    <>
      {/* Temporary inline styles for the toggle - move these to neuro-layout.css */}
      <style>{`
        /* Hide any old toggle buttons */
        .neuro-theme-toggle-header,
        .neuro-toggle-button {
          display: none !important;
        }
        
        /* Custom Neumorphic Toggle Styles */
        .neuro-theme-toggle-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .neuro-theme-icon {
          color: var(--neuro-text-secondary);
          width: 16px;
          height: 16px;
          display: none;
        }
        
        @media (min-width: 640px) {
          .neuro-theme-icon {
            display: block;
          }
        }
        
        .neuro-theme-icon.active {
          color: var(--neuro-text-accent);
        }
        
        .neuro-toggle-label {
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          position: relative;
        }
        
        .neuro-toggle {
          isolation: isolate;
          position: relative;
          height: 26px;
          width: 52px;
          border-radius: 15px;
          overflow: hidden;
          background: var(--neuro-bg);
          box-shadow: -6px -3px 6px 0px var(--neuro-shadow-light),
            6px 3px 9px 0px var(--neuro-shadow-dark),
            3px 3px 3px 0px var(--neuro-shadow-dark) inset,
            -3px -3px 3px 0px var(--neuro-shadow-light) inset;
        }
        
        @media (min-width: 640px) {
          .neuro-toggle {
            height: 30px;
            width: 60px;
          }
        }
        
        .neuro-toggle-state {
          display: none;
        }
        
        .neuro-indicator {
          height: 100%;
          width: 200%;
          background: var(--neuro-bg);
          border-radius: 15px;
          transform: translate3d(-75%, 0, 0);
          transition: transform 0.4s cubic-bezier(0.85, 0.05, 0.18, 1.35);
          box-shadow: -6px -3px 6px 0px var(--neuro-shadow-light),
            6px 3px 9px 0px var(--neuro-shadow-dark);
          position: relative;
        }
        
        .neuro-toggle-state:checked ~ .neuro-indicator {
          transform: translate3d(25%, 0, 0);
        }
        
        /* Toggle Icons */
        .neuro-indicator::before,
        .neuro-indicator::after {
          content: '';
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
        }
        
        .neuro-indicator::before {
          left: 8px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fbbf24'%3E%3Cpath d='M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.591a.75.75 0 101.06 1.06l1.591-1.591zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.591-1.591a.75.75 0 10-1.06 1.06l1.591 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.591a.75.75 0 001.06 1.06l1.591-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06L6.166 5.106a.75.75 0 00-1.061 1.06l1.591 1.591z'/%3E%3C/svg%3E");
        }
        
        .neuro-indicator::after {
          right: 8px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'%3E%3Cpath d='M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z'/%3E%3C/svg%3E");
        }
        
        @media (min-width: 640px) {
          .neuro-indicator::before,
          .neuro-indicator::after {
            width: 18px;
            height: 18px;
          }
          
          .neuro-indicator::before {
            left: 10px;
          }
          
          .neuro-indicator::after {
            right: 10px;
          }
        }
        
        /* Fix header layout for mobile */
        @media (max-width: 767px) {
          .neuro-header-content {
            flex-wrap: nowrap !important;
          }
          
          .neuro-brand-text {
            display: none;
          }
          
          .neuro-header-actions {
            gap: 0.5rem !important;
          }
          
          .neuro-theme-toggle-wrapper {
            margin-right: 0.25rem;
          }
        }
      `}</style>
      
      <header className="neuro-header">
        <div className="neuro-header-container">
          <div className="neuro-header-content">
            {/* Brand */}
            <div className="neuro-header-brand">
              <Link to="/" className="neuro-brand-link">
                <div className="neuro-brand-icon-container">
                  <span className="neuro-brand-icon">🍽️</span>
                </div>
                <div className="neuro-brand-text">
                  <h1 className="neuro-brand-title">KamusiApp</h1>
                  <p className="neuro-brand-subtitle">Authentic Reviews</p>
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
                      : item.highlight
                        ? 'neuro-nav-item-highlight'
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
            
            {/* Header Actions */}
            <div className="neuro-header-actions">
              {/* NEW Neumorphic Dark Mode Toggle Only */}
              <div className="neuro-theme-toggle-wrapper">
                <Sun className={`neuro-theme-icon ${!isDarkMode ? 'active' : ''}`} />
                <label className="neuro-toggle-label">
                  <div className="neuro-toggle">
                    <input
                      className="neuro-toggle-state"
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={toggleDarkMode}
                    />
                    <div className="neuro-indicator"></div>
                  </div>
                </label>
                <Moon className={`neuro-theme-icon ${isDarkMode ? 'active' : ''}`} />
              </div>
              
              {/* User Menu */}
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
                          alt="User" 
                          className="neuro-avatar-image"
                        />
                      ) : (
                        <div className="neuro-avatar-placeholder">
                          {(currentUser.displayName || currentUser.email)[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="neuro-user-info">
                      <div className="neuro-user-name">
                        {currentUser.displayName || currentUser.email.split('@')[0]}
                      </div>
                      {isOwner && (
                        <div className="neuro-user-role">Owner</div>
                      )}
                    </div>
                    <ChevronDown 
                      className={`neuro-user-chevron ${userMenuOpen ? 'neuro-chevron-open' : ''}`}
                      size={16}
                    />
                  </button>
                  
                  {/* User Dropdown */}
                  {userMenuOpen && (
                    <>
                      <div 
                        className="neuro-dropdown-backdrop" 
                        onClick={() => setUserMenuOpen(false)}
                      ></div>
                      <div className="neuro-user-dropdown">
                        {/* Quick Navigation */}
                        <div className="neuro-dropdown-section">
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
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
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
    </>
  );
};

export default Header;