// src/components/Layout/Header.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown, User, LogOut, Menu, X, MessageSquare, BarChart3, Gift, Ticket } from 'lucide-react';

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
  
  // All navigation items (REMOVED /admin/rewards)
  const navItems = [
    { 
      path: '/', 
      label: 'Home', 
      show: true 
    },
    { 
      path: '/feedback', 
      label: 'Leave Review', 
      icon: MessageSquare,
      show: !!currentUser 
    },
    { 
      path: '/my-reviews', 
      label: 'My Reviews', 
      show: !!currentUser 
    },
    { 
      path: '/rewards', 
      label: 'Rewards', 
      icon: Gift,
      show: !!currentUser 
    },
    { 
      path: '/vouchers', 
      label: 'Vouchers', 
      icon: Ticket,
      show: !!currentUser 
    },
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: BarChart3,
      show: isOwner,
      highlight: true
    }
  ];

  const filteredNavItems = navItems.filter(item => item.show);
  
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 glass-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
            >
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <span className="text-white text-xl">🍽️</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="heading-sm">Restaurant Review</h1>
                <p className="text-xs text-slate-400 -mt-1">AI-Powered Feedback</p>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActivePath(item.path) 
                    ? item.highlight 
                      ? 'gradient-text bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30'
                      : 'bg-white/10 text-white border border-white/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon && <item.icon size={16} />}
                {item.label}
                {item.highlight && isActivePath(item.path) && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-md font-bold">
                    Owner
                  </span>
                )}
              </Link>
            ))}
          </nav>
          
          {/* User section */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors focus-ring group"
                >
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-white">
                      {currentUser.displayName || currentUser.name || currentUser.email?.split('@')[0] || 'User'}
                    </div>
                    {isOwner && (
                      <div className="text-xs text-green-400 font-semibold">Owner</div>
                    )}
                  </div>
                  
                  <ChevronDown 
                    size={16} 
                    className={`text-slate-400 transition-transform duration-200 ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                
                {/* Dropdown menu */}
                {userMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-lg rounded-xl shadow-2xl border border-white/10 py-2 z-20">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          {currentUser.photoURL ? (
                            <img 
                              src={currentUser.photoURL} 
                              alt="Profile" 
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-white">
                              {currentUser.displayName || currentUser.name || currentUser.email?.split('@')[0] || 'User'}
                            </div>
                            <div className="text-xs text-slate-400 truncate max-w-[150px]">
                              {currentUser.email}
                            </div>
                            {isOwner && (
                              <div className="text-xs text-green-400 font-semibold mt-1">
                                🏪 Restaurant Owner
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Navigation items for mobile */}
                      <div className="lg:hidden">
                        <div className="px-2 py-2">
                          {filteredNavItems.map((item) => (
                            <Link
                              key={item.path}
                              to={item.path}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                isActivePath(item.path) 
                                  ? 'text-blue-400 bg-white/5' : 'text-slate-300'
                              }`}
                              onClick={() => setUserMenuOpen(false)}
                            >
                              {item.icon && <item.icon size={16} />}
                              {item.label}
                            </Link>
                          ))}
                          <div className="border-t border-white/10 my-2"></div>
                        </div>
                        
                        {/* Profile action */}
                        <button
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
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
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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
                className="btn-primary text-sm px-4 py-2 focus-ring"
              >
                Sign In
              </Link>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors focus-ring"
            >
              {mobileMenuOpen ? (
                <X size={20} className="text-slate-300" />
              ) : (
                <Menu size={20} className="text-slate-300" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 glass-card">
          <div className="px-4 py-4 space-y-2">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActivePath(item.path) 
                    ? item.highlight 
                      ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20'
                      : 'text-blue-400 bg-white/5'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon && <item.icon size={20} />}
                <span className="font-medium">{item.label}</span>
                {item.highlight && isActivePath(item.path) && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-md font-bold ml-auto">
                    Owner
                  </span>
                )}
              </Link>
            ))}
            
            {currentUser && (
              <>
                <div className="border-t border-white/10 my-3"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Sign Out</span>
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