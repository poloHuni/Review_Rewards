// src/components/Layout/Footer.js - Minimal Neumorphic Footer
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="neuro-footer-minimal">
      <div className="neuro-footer-container">
        <div className="neuro-footer-content">
          {/* Simple one-line footer */}
          <div className="neuro-footer-main">
            <div className="neuro-footer-brand-mini">
              <div className="neuro-footer-icon-mini">
                <div className="neuro-icon neuro-icon-food"></div>
              </div>
              <span className="neuro-footer-text">
                © {currentYear} Restaurant Review - Made with ❤️ for food lovers
              </span>
            </div>
            
            <div className="neuro-footer-links-mini">
              <a href="#privacy" className="neuro-footer-link-mini">Privacy</a>
              <span className="neuro-separator">•</span>
              <a href="#terms" className="neuro-footer-link-mini">Terms</a>
              <span className="neuro-separator">•</span>
              <a href="#support" className="neuro-footer-link-mini">Support</a>
            </div>
          </div>
        </div>
        
        {/* Subtle accent bar */}
        <div className="neuro-footer-accent-mini">
          <div className="neuro-accent-bar-mini"></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;