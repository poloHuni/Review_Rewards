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
  
  // All navigation items
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
    },
    { 
      path: '/admin/rewards', 
      label: 'Admin Rewards', 
      show: isOwner
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
                {/* User dropdown button */}
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors focus-ring"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {(currentUser.displayName || currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-white">
                        {currentUser.displayName || currentUser.name || 'User'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {isOwner ? 'Restaurant Owner' : 'Customer'}
                      </div>
                    </div>
                  </div>
                  
                  <ChevronDown 
                    size={16} 
                    className={`text-slate-400 transition-transform duration-200 ${
                      userMenuOpen ? 'transform rotate-180' : ''
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
                    <div className="absolute right-0 mt-2 w-64 glass-card rounded-xl border border-white/10 shadow-xl z-20">
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {(currentUser.displayName || currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {currentUser.displayName || currentUser.name || 'User'}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {currentUser.email}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu items */}
                      <div className="py-2">
                        {/* Mobile navigation items */}
                        <div className="lg:hidden">
                          {filteredNavItems.map((item) => (
                            <Link
                              key={item.path}
                              to={item.path}
                              className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/5 transition-colors ${
                                isActivePath(item.path) ? 'text-blue-400 bg-white/5' : 'text-slate-300'
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
                    ? 'bg-white/10 text-white border border-white/20' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon && <item.icon size={18} />}
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;