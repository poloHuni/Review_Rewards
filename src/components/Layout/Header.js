// src/components/Layout/Header.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown, User, LogOut, Settings, MessageSquare, BarChart3, Menu, X } from 'lucide-react';

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
    { path: '/', label: 'Home', show: true },
    { path: '/feedback', label: 'Leave Feedback', icon: MessageSquare, show: !!currentUser },
    { path: '/my-reviews', label: 'My Reviews', show: !!currentUser },
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
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link flex items-center gap-2 ${
                  isActivePath(item.path) ? 'active' : ''
                } ${item.highlight ? 'gradient-text' : ''}`}
              >
                {item.icon && <item.icon size={16} />}
                {item.label}
              </Link>
            ))}
          </nav>
          
          {/* User section */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="relative">
                {/* User menu trigger */}
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-all duration-200 focus-ring"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {currentUser.photoURL ? (
                      <img
                        className="h-9 w-9 rounded-full border border-white/20 object-cover object-center"
                        src={currentUser.photoURL}
                        alt="User avatar"
                        style={{ objectPosition: 'center center' }}
                        onError={(e) => {
                          // If image fails to load, hide it and show fallback
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback avatar - always render but hide if photo loads */}
                    <div 
                      className={`absolute inset-0 h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border border-white/20 ${
                        currentUser.photoURL ? 'hidden' : 'flex'
                      }`}
                    >
                      <span className="text-white font-medium text-sm">
                        {(() => {
                          const name = currentUser.displayName || currentUser.name || currentUser.email || 'U';
                          return name.charAt(0).toUpperCase();
                        })()}
                      </span>
                    </div>
                    
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 border-2 border-slate-900 rounded-full"></div>
                  </div>
                  
                  {/* User info - hidden on mobile */}
                  <div className="hidden md:block text-left max-w-[120px]">
                    <div className="text-sm font-medium text-white truncate">
                      {currentUser.displayName || currentUser.name || currentUser.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {isOwner ? 'Restaurant Owner' : 'Customer'}
                    </div>
                  </div>
                  
                  <ChevronDown 
                    size={16} 
                    className={`text-slate-400 transition-transform duration-200 ml-1 ${
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
                        <div className="flex items-center space-x-4">
                          <div className="relative flex-shrink-0">
                            {currentUser.photoURL ? (
                              <img
                                className="h-12 w-12 rounded-full border border-white/20 object-cover object-center"
                                src={currentUser.photoURL}
                                alt="User avatar"
                                style={{ objectPosition: 'center center' }}
                                onError={(e) => {
                                  // If image fails to load, hide it and show fallback
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            
                            {/* Fallback avatar */}
                            <div 
                              className={`absolute inset-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border border-white/20 ${
                                currentUser.photoURL ? 'hidden' : 'flex'
                              }`}
                            >
                              <span className="text-white font-medium text-lg">
                                {(() => {
                                  const name = currentUser.displayName || currentUser.name || currentUser.email || 'U';
                                  return name.charAt(0).toUpperCase();
                                })()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
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
                          onClick={() => {
                            setUserMenuOpen(false);
                            // TODO: Add profile settings navigation when page is created
                            alert('Profile settings coming soon!');
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