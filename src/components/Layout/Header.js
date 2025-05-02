// src/components/Layout/Header.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, isOwner, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <header className="bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-white flex items-center">
                <span className="text-2xl mr-2">🍽️</span>
                <span>Restaurant Review</span>
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                Home
              </Link>
              
              {currentUser && (
                <>
                  <Link to="/feedback" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                    Leave Feedback
                  </Link>
                  
                  <Link to="/my-reviews" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                    My Reviews
                  </Link>
                </>
              )}
              
              {isOwner && (
                <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-blue-400 hover:bg-gray-700 hover:text-blue-200">
                  Owner Dashboard
                </Link>
              )}
            </div>
          </div>
          
          {/* User menu */}
          <div className="flex items-center">
            {currentUser ? (
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <button
                    type="button"
                    className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    id="user-menu-button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    {currentUser.photoURL ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={currentUser.photoURL}
                        alt="User avatar"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </button>
                  
                  <div className="hidden md:block ml-3">
                    <div className="text-base font-medium text-white">
                      {currentUser.displayName || currentUser.name || currentUser.email.split('@')[0]}
                    </div>
                    <div className="text-sm font-medium text-gray-400">
                      {currentUser.email}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="ml-4 hidden md:block px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Logout
                  </button>
                </div>
                
                {/* Mobile dropdown menu */}
                {mobileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-600">
                      Signed in as {currentUser.email}
                    </div>
                    
                    <Link
                      to="/feedback"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 md:hidden"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Leave Feedback
                    </Link>
                    
                    <Link
                      to="/my-reviews"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 md:hidden"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Reviews
                    </Link>
                    
                    {isOwner && (
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-blue-400 hover:bg-gray-600 md:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Owner Dashboard
                      </Link>
                    )}
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                Login
              </Link>
            )}
            
            {/* Mobile menu button */}
            <div className="flex md:hidden ml-3">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <svg
                  className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            to="/"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          
          {currentUser && (
            <>
              <Link
                to="/feedback"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Leave Feedback
              </Link>
              
              <Link
                to="/my-reviews"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Reviews
              </Link>
              
              {isOwner && (
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-blue-400 hover:bg-gray-700 hover:text-blue-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Owner Dashboard
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};