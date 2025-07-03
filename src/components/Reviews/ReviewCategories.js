// src/components/Reviews/ReviewCategories.js
import React from 'react';
import { formatAllCategoriesForDisplay, ensureCompleteReview } from '../../utils/reviewDisplayUtils';

const ReviewCategories = ({ 
  review, 
  layout = 'grid', // 'grid', 'list', 'compact'
  showEmptyCategories = true,
  style = {}
}) => {
  // Ensure the review has all categories
  const completeReview = ensureCompleteReview(review);
  const categories = formatAllCategoriesForDisplay(completeReview);

  // Filter categories if showEmptyCategories is false
  const displayCategories = showEmptyCategories 
    ? Object.entries(categories)
    : Object.entries(categories).filter(([key, category]) => !category.isEmpty);

  if (displayCategories.length === 0) {
    return null;
  }

  // Grid layout (default)
  if (layout === 'grid') {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '15px',
        ...style
      }}>
        {displayCategories.map(([key, category]) => (
          <div key={key} style={{
            backgroundColor: category.isEmpty 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '15px',
            border: category.isEmpty 
              ? '1px dashed rgba(255, 255, 255, 0.2)' 
              : '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: '12px',
              opacity: category.isEmpty ? 0.5 : 0.8,
              marginBottom: '8px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {category.label}
            </div>
            <div style={{
              fontSize: '14px',
              lineHeight: '1.4',
              fontStyle: category.isEmpty ? 'italic' : 'normal',
              opacity: category.isEmpty ? 0.6 : 1,
              color: category.isEmpty ? '#9ca3af' : 'white'
            }}>
              {category.text}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // List layout
  if (layout === 'list') {
    return (
      <div style={{ ...style }}>
        {displayCategories.map(([key, category]) => (
          <div key={key} style={{
            display: 'flex',
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: category.isEmpty 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            border: category.isEmpty 
              ? '1px dashed rgba(255, 255, 255, 0.2)' 
              : '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              minWidth: '120px',
              fontSize: '12px',
              fontWeight: 'bold',
              opacity: category.isEmpty ? 0.5 : 0.8,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {category.label}
            </div>
            <div style={{
              flex: 1,
              fontSize: '14px',
              fontStyle: category.isEmpty ? 'italic' : 'normal',
              opacity: category.isEmpty ? 0.6 : 1,
              color: category.isEmpty ? '#9ca3af' : 'white'
            }}>
              {category.text}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Compact layout
  if (layout === 'compact') {
    return (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        ...style
      }}>
        {displayCategories.map(([key, category]) => (
          <div key={key} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: category.isEmpty 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            border: category.isEmpty 
              ? '1px dashed rgba(255, 255, 255, 0.2)' 
              : '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '12px'
          }}>
            <span style={{
              fontWeight: 'bold',
              opacity: category.isEmpty ? 0.5 : 0.8
            }}>
              {category.label}:
            </span>
            <span style={{
              fontStyle: category.isEmpty ? 'italic' : 'normal',
              opacity: category.isEmpty ? 0.6 : 1,
              color: category.isEmpty ? '#9ca3af' : 'white'
            }}>
              {category.isEmpty ? 'Not mentioned' : 'Mentioned'}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default ReviewCategories;