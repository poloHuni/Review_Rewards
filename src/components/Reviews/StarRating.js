// src/components/Reviews/StarRating.js
import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating, showValue = false, size = 'md', animated = false, className = '' }) => {
  // Handle invalid rating values
  if (typeof rating !== 'number' || isNaN(rating) || rating < 0 || rating > 5) {
    return <span className="text-slate-400 text-sm">N/A</span>;
  }
  
  // Round to nearest 0.5
  const roundedRating = Math.round(rating * 2) / 2;
  
  // Determine star size based on prop
  const sizeConfig = {
    xs: { starSize: 12, textSize: 'text-xs', gap: 'gap-0.5' },
    sm: { starSize: 14, textSize: 'text-sm', gap: 'gap-1' },
    md: { starSize: 16, textSize: 'text-base', gap: 'gap-1' },
    lg: { starSize: 20, textSize: 'text-lg', gap: 'gap-1.5' },
    xl: { starSize: 24, textSize: 'text-xl', gap: 'gap-2' },
  };
  
  const config = sizeConfig[size] || sizeConfig.md;
  
  const stars = [];
  
  // Generate 5 stars
  for (let i = 1; i <= 5; i++) {
    let starElement;
    
    if (i <= roundedRating) {
      // Full star
      starElement = (
        <Star 
          key={i} 
          size={config.starSize}
          className={`text-amber-400 fill-current transition-all duration-200 ${
            animated ? 'hover:scale-110' : ''
          }`}
          style={{ 
            animationDelay: animated ? `${i * 0.1}s` : '0s',
            filter: 'drop-shadow(0 0 2px rgba(251, 191, 36, 0.3))'
          }}
        />
      );
    } else if (i - 0.5 === roundedRating) {
      // Half star - using CSS clip-path for perfect half
      starElement = (
        <div 
          key={i} 
          className={`relative transition-all duration-200 ${
            animated ? 'hover:scale-110' : ''
          }`}
          style={{ 
            animationDelay: animated ? `${i * 0.1}s` : '0s'
          }}
        >
          {/* Background empty star */}
          <Star 
            size={config.starSize}
            className="text-slate-600"
          />
          {/* Foreground half star */}
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: 'inset(0 50% 0 0)' }}
          >
            <Star 
              size={config.starSize}
              className="text-amber-400 fill-current"
              style={{ filter: 'drop-shadow(0 0 2px rgba(251, 191, 36, 0.3))' }}
            />
          </div>
        </div>
      );
    } else {
      // Empty star
      starElement = (
        <Star 
          key={i} 
          size={config.starSize}
          className={`text-slate-600 transition-all duration-200 ${
            animated ? 'hover:scale-110 hover:text-slate-500' : ''
          }`}
          style={{ 
            animationDelay: animated ? `${i * 0.1}s` : '0s'
          }}
        />
      );
    }
    
    stars.push(starElement);
  }
  
  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      <div className={`flex ${config.gap}`}>
        {stars}
      </div>
      
      {showValue && (
        <span className={`ml-2 text-slate-400 font-medium ${config.textSize}`}>
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};

export default StarRating;