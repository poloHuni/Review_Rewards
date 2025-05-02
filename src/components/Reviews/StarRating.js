// src/components/Reviews/StarRating.js
import React from 'react';

const StarRating = ({ rating, showValue = false, size = 'md' }) => {
  // Handle invalid rating values
  if (typeof rating !== 'number' || isNaN(rating) || rating < 0 || rating > 5) {
    return <span className="text-gray-400">N/A</span>;
  }
  
  // Round to nearest 0.5
  const roundedRating = Math.round(rating * 2) / 2;
  
  // Determine star size based on prop
  const starSizeClass = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }[size] || 'text-xl';
  
  const stars = [];
  
  // Generate 5 stars
  for (let i = 1; i <= 5; i++) {
    if (i <= roundedRating) {
      // Full star
      stars.push(
        <span 
          key={i} 
          className={`text-yellow-400 ${starSizeClass}`}
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          ★
        </span>
      );
    } else if (i - 0.5 === roundedRating) {
      // Half star - using CSS to create half-star effect
      stars.push(
        <span 
          key={i} 
          className={`relative ${starSizeClass}`}
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <span className="absolute text-gray-500">☆</span>
          <span className="text-yellow-400 absolute" style={{ width: '50%', overflow: 'hidden' }}>★</span>
        </span>
      );
    } else {
      // Empty star
      stars.push(
        <span 
          key={i} 
          className={`text-gray-500 ${starSizeClass}`}
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          ☆
        </span>
      );
    }
  }
  
  return (
    <div className="flex items-center">
      <div className="flex">
        {stars}
      </div>
      
      {showValue && (
        <span className="ml-2 text-gray-400 text-sm">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};

export default StarRating;