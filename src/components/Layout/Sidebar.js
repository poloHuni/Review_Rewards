// src/components/Layout/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { currentUser, isOwner } = useAuth();
  
  if (!currentUser) return null;
  
  // Define navigation items
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/feedback', label: 'Leave Feedback', icon: '🎙️' },
    { path: '/my-reviews', label: 'My Reviews', icon: '📋' },
  ];
  
  // Add owner-only items
  if (isOwner) {
    navItems.push({ path: '/dashboard', label: 'Owner Dashboard', icon: '⚙️' });
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* User info section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center">
          {currentUser.photoURL ? (
            <img 
              src={currentUser.photoURL} 
              alt="Profile" 
              className="w-12 h-12 rounded-full mr-3"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mr-3">
              <span className="text-white text-lg font-semibold">
                {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          
          <div>
            <h3 className="text-white font-medium">
              {currentUser.displayName || currentUser.name || currentUser.email.split('@')[0]}
            </h3>
            <p className="text-gray-400 text-sm truncate max-w-[180px]">
              {currentUser.email}
            </p>
          </div>
        </div>
        
        {isOwner && (
          <div className="mt-2 px-3 py-1 bg-blue-900 rounded-md text-xs text-center text-blue-200">
            Restaurant Owner
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="mt-4 flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  location.pathname === item.path
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Additional info */}
      <div className="mt-auto p-4 border-t border-gray-700">
        <div className="bg-gray-700 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-2">About</h4>
          <p className="text-gray-400 text-xs">
            Our restaurant review portal helps us gather feedback to improve your dining experience. Your opinions are valuable to us!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;