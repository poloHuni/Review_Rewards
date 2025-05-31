// src/components/Layout/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Zap, Users, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    product: [
      { name: 'Features', href: '#' },
      { name: 'AI Analytics', href: '#' },
      { name: 'Voice Recording', href: '#' },
      { name: 'Dashboard', href: '#' }
    ],
    company: [
      { name: 'About Us', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Contact', href: '#' }
    ],
    support: [
      { name: 'Help Center', href: '#' },
      { name: 'Documentation', href: '#' },
      { name: 'API Reference', href: '#' },
      { name: 'Status', href: '#' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
      { name: 'GDPR', href: '#' }
    ]
  };

  const features = [
    {
      icon: Zap,
      title: "AI-Powered",
      description: "Advanced artificial intelligence for smart feedback analysis"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Enterprise-grade security protecting your data"
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Building better dining experiences together"
    }
  ];
  
  return (
    <footer className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-slate-900"></div>
      
      <div className="relative">
        {/* Main footer content */}
        <div className="glass-card border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Brand section */}
              <div className="lg:col-span-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Restaurant Review</h3>
                    <p className="text-slate-400 text-sm">AI-Powered Feedback Platform</p>
                  </div>
                </div>
                
                <p className="body-md mb-6 max-w-md">
                  Transforming the dining industry through intelligent feedback analysis and actionable insights for restaurants and customers alike.
                </p>
                
                {/* Feature highlights */}
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                        <feature.icon size={16} className="text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm">{feature.title}</h4>
                        <p className="text-slate-400 text-xs">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Links sections */}
              <div className="lg:col-span-8">
                <div className="grid md:grid-cols-4 gap-8">
                  <div>
                    <h4 className="text-white font-semibold mb-4">Product</h4>
                    <ul className="space-y-3">
                      {footerLinks.product.map((link) => (
                        <li key={link.name}>
                          <a
                            href={link.href}
                            className="body-sm hover:text-white transition-colors"
                          >
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-semibold mb-4">Company</h4>
                    <ul className="space-y-3">
                      {footerLinks.company.map((link) => (
                        <li key={link.name}>
                          <a
                            href={link.href}
                            className="body-sm hover:text-white transition-colors"
                          >
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-semibold mb-4">Support</h4>
                    <ul className="space-y-3">
                      {footerLinks.support.map((link) => (
                        <li key={link.name}>
                          <a
                            href={link.href}
                            className="body-sm hover:text-white transition-colors"
                          >
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-semibold mb-4">Legal</h4>
                    <ul className="space-y-3">
                      {footerLinks.legal.map((link) => (
                        <li key={link.name}>
                          <a
                            href={link.href}
                            className="body-sm hover:text-white transition-colors"
                          >
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contact section */}
        <div className="glass-card-subtle border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Mail size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Email</p>
                  <p className="body-sm">support@restaurantreview.ai</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Phone size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Phone</p>
                  <p className="body-sm">+27 (0) 11 123 4567</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                  <MapPin size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Location</p>
                  <p className="body-sm">Johannesburg, South Africa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <p className="body-sm">
                  &copy; {currentYear} Restaurant Review Platform. All rights reserved.
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 body-sm">
                  <span>Made with</span>
                  <Heart size={14} className="text-red-400 fill-current" />
                  <span>for the food industry</span>
                </div>
                
                {/* Social links */}
                <div className="flex items-center gap-3">
                  <a
                    href="#"
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Twitter"
                  >
                    <svg className="w-4 h-4 text-slate-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                    </svg>
                  </a>
                  
                  <a
                    href="#"
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="LinkedIn"
                  >
                    <svg className="w-4 h-4 text-slate-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  
                  <a
                    href="#"
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="GitHub"
                  >
                    <svg className="w-4 h-4 text-slate-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;