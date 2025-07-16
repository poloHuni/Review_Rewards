// src/components/Layout/Footer.js - Simplified version
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-slate-900"></div>
      
      <div className="relative">
        <div className="glass-card border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Single row layout */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Brand section */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <span className="text-xl">🍽️</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Restaurant Review</h3>
                  <p className="text-slate-400 text-sm">AI-Powered Feedback</p>
                </div>
              </div>
              
              {/* Copyright */}
              <div className="text-center">
                <p className="text-slate-400 text-sm">
                  © {currentYear} Restaurant Review. All rights reserved.
                </p>
              </div>
              
              {/* Quick links */}
              <div className="flex items-center gap-4">
                <a 
                  href="#" 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Privacy
                </a>
                <a 
                  href="#" 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Terms
                </a>
                <a 
                  href="#" 
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Support
                </a>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Bottom accent bar */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20"></div>
          <div className="relative h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;