// src/components/Layout/Header.js - FIXED VERSION
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown, User, LogOut, Settings, MessageSquare, BarChart3, Menu, X, Gift, Ticket } from 'lucide-react';

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
  
  // FIXED: Complete navigation items with all tabs
  const navItems = [
    { path: '/', label: 'Home', show: true },
    { path: '/feedback', label: 'Leave Feedback', icon: MessageSquare, show: !!currentUser },
    { path: '/my-reviews', label: 'My Reviews', show: !!currentUser },
    { path: '/rewards', label: 'Rewards', icon: Gift, show: !!currentUser }, // FIXED: Added back
    { path: '/vouchers', label: 'Vouchers', icon: Ticket, show: !!currentUser }, // FIXED: Added back
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3, show: isOwner, highlight: true },
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
          
          {/* Desktop Navigation - FIXED */}
          <nav className="hidden lg:flex items-center space-x-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActivePath(item.path) 
                    ? 'bg-white/10 text-white border border-white/20' 
                    : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                } ${item.highlight ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20' : ''}`}
              >
                {item.icon && <item.icon size={16} />}
                {item.label}
              </Link>
            ))}
          </nav>
          
          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {/* User section */}
          <div className="hidden lg:flex items-center space-x-4">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium max-w-32 truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* User dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl p-2 border border-white/20 shadow-xl">
                    <div className="px-3 py-2 border-b border-white/10">
                      <p className="text-sm font-medium text-white">
                        {currentUser.displayName || 'User'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {currentUser.email}
                      </p>
                      {isOwner && (
                        <span className="inline-block mt-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                          Restaurant Owner
                        </span>
                      )}
                    </div>
                    
                    <div className="py-1">
                      <Link
                        to="/my-reviews"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={16} />
                        My Reviews
                      </Link>
                      <Link
                        to="/rewards"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Gift size={16} />
                        Rewards
                      </Link>
                      {isOwner && (
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <BarChart3 size={16} />
                          Dashboard
                        </Link>
                      )}
                    </div>
                    
                    <div className="border-t border-white/10 pt-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                      >
                        <LogOut size={16} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-primary focus-ring"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
        
        {/* Mobile menu - FIXED */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 py-4">
            <nav className="space-y-2">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActivePath(item.path)
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon && <item.icon size={18} />}
                  {item.label}
                </Link>
              ))}
              
              {currentUser && (
                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium text-white">
                      {currentUser.displayName || 'User'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {currentUser.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                  >
                    <LogOut size={18} />
                    Sign out
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;