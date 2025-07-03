// src/components/Layout/Header.js - Food Review Themed Header
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown, User, LogOut, Settings, MessageSquare, BarChart3, Menu, X, Gift, Ticket, Star, Utensils } from 'lucide-react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { currentUser, isOwner, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
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
      icon: '🎤',
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
      icon: '👨‍🍳',
      show: isOwner, 
      highlight: true 
    },
  ];

  const filteredNavItems = navItems.filter(item => item.show);
  
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '70px'
        }}>
          {/* Logo and brand */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link 
              to="/" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
                color: 'white',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{
                padding: '12px',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '24px' }}>🍽️</span>
              </div>
              <div>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  margin: 0,
                  background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  FoodieVoice
                </h1>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: 0,
                  marginTop: '-2px'
                }}>
                  AI-Powered Reviews 🤖✨
                </p>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav style={{
            display: 'none',
            alignItems: 'center',
            gap: '8px'
          }}
          className="lg:flex"
          >
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  background: isActivePath(item.path) 
                    ? item.highlight 
                      ? 'linear-gradient(45deg, #8b5cf6, #ec4899)'
                      : 'rgba(255, 255, 255, 0.1)'
                    : 'transparent',
                  color: isActivePath(item.path) ? 'white' : 'rgba(255, 255, 255, 0.8)',
                  border: item.highlight && isActivePath(item.path) 
                    ? 'none' 
                    : isActivePath(item.path) 
                    ? '1px solid rgba(255, 255, 255, 0.2)' 
                    : '1px solid transparent',
                  boxShadow: item.highlight && isActivePath(item.path) 
                    ? '0 4px 16px rgba(139, 92, 246, 0.4)' 
                    : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActivePath(item.path)) {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.target.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActivePath(item.path)) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
                {item.highlight && (
                  <span style={{
                    fontSize: '12px',
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    color: '#34d399',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    fontWeight: 'bold'
                  }}>
                    Owner
                  </span>
                )}
              </Link>
            ))}
          </nav>
          
          {/* User section and mobile menu */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {currentUser ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        // Fallback to gradient avatar if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {/* Fallback avatar - always rendered but hidden if photo loads */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    display: currentUser.photoURL ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{
                    display: 'none',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                  className="sm:flex"
                  >
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      {isOwner ? '👨‍🍳 Owner' : '🍽️ Foodie'}
                    </span>
                  </div>
                  <ChevronDown 
                    size={16} 
                    style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      transition: 'transform 0.3s ease',
                      transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                </button>
                
                {/* Dropdown menu */}
                {userMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 10
                      }}
                      onClick={() => setUserMenuOpen(false)}
                    />
                    
                    {/* Menu */}
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      marginTop: '8px',
                      width: '280px',
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                      zIndex: 20,
                      overflow: 'hidden'
                    }}>
                      {/* User info header */}
                      <div style={{
                        padding: '16px',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: 'white'
                          }}>
                            {(currentUser.displayName || currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: 'white',
                              marginBottom: '2px'
                            }}>
                              {currentUser.displayName || currentUser.name || 'User'}
                            </div>
                            <div style={{
                              fontSize: '13px',
                              color: 'rgba(255, 255, 255, 0.6)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {currentUser.email}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#34d399',
                              fontWeight: '600',
                              marginTop: '4px'
                            }}>
                              {isOwner ? '👨‍🍳 Restaurant Owner' : '🍽️ Food Enthusiast'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu items */}
                      <div style={{ padding: '8px' }}>
                        {/* Profile action */}
                        <button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            borderRadius: '12px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.8)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => setUserMenuOpen(false)}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                          }}
                        >
                          <User size={16} />
                          Profile Settings
                        </button>
                        
                        {/* Logout */}
                        <button
                          onClick={() => {
                            handleLogout();
                            setUserMenuOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            borderRadius: '12px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#f87171',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                          }}
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.4)';
                }}
              >
                🚀 Sign In
              </Link>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'block',
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              className="lg:hidden"
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              {mobileMenuOpen ? (
                <X size={20} />
              ) : (
                <Menu size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'block'
        }}
        className="lg:hidden"
        >
          <div style={{
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  background: isActivePath(item.path) 
                    ? item.highlight 
                      ? 'linear-gradient(45deg, #8b5cf6, #ec4899)'
                      : 'rgba(255, 255, 255, 0.1)'
                    : 'transparent',
                  color: isActivePath(item.path) ? 'white' : 'rgba(255, 255, 255, 0.8)',
                  border: isActivePath(item.path) && !item.highlight 
                    ? '1px solid rgba(255, 255, 255, 0.2)' 
                    : '1px solid transparent'
                }}
                onClick={() => setMobileMenuOpen(false)}
                onMouseEnter={(e) => {
                  if (!isActivePath(item.path)) {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActivePath(item.path)) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                {item.label}
                {item.highlight && (
                  <span style={{
                    fontSize: '12px',
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    color: '#34d399',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontWeight: 'bold'
                  }}>
                    Owner
                  </span>
                )}
              </Link>
            ))}
            
            {currentUser && (
              <div style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                marginTop: '16px',
                paddingTop: '16px'
              }}>
                <div style={{
                  padding: '16px 20px',
                  marginBottom: '8px'
                }}>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'white',
                    margin: 0,
                    marginBottom: '4px'
                  }}>
                    {currentUser.displayName || 'User'}
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    margin: 0
                  }}>
                    {currentUser.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '16px 20px',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;