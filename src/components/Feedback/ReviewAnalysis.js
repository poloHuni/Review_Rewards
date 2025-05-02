// src/components/Feedback/ReviewAnalysis.js
import React, { useState } from 'react';
import { saveReview, formatReviewForSharing, generateGoogleReviewLink } from '../../services/reviewService';
import { useAuth } from '../../contexts/AuthContext';

const ReviewAnalysis = ({ reviewData, onSaveSuccess, onStartOver, placeId }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  
  const handleSaveReview = async () => {
    setSaving(true);
    setError(null);
    
    try {
      if (!currentUser) {
        throw new Error('You must be logged in to save a review');
      }
      
      const customerInfo = {
        name: currentUser.name || currentUser.displayName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      };
      
      await saveReview(reviewData, currentUser.user_id || currentUser.uid, customerInfo);
      setSaved(true);
      if (onSaveSuccess) {
        onSaveSuccess(reviewData);
      }
    } catch (err) {
      setError(`Failed to save review: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Render stars for sentiment score
  const renderStars = (score) => {
    const stars = [];
    
    // Add filled stars
    for (let i = 0; i < Math.floor(score); i++) {
      stars.push(
        <span 
          key={`star-filled-${i}`} 
          className="star-filled text-2xl"
          style={{ 
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.3s'
          }}
        >
          ⭐
        </span>
      );
    }
    
    // Add empty stars
    for (let i = Math.ceil(score); i < 5; i++) {
      stars.push(
        <span key={`star-empty-${i}`} className="star-empty text-2xl text-gray-500">
          ☆
        </span>
      );
    }
    
    return (
      <div className="flex items-center space-x-1">
        {stars}
        <span className="ml-2 text-lg text-gray-400">({score}/5)</span>
      </div>
    );
  };
  
  // Format the review for sharing
  const formattedReview = formatReviewForSharing(reviewData);
  
  // Generate Google Review link
  const googleReviewLink = placeId ? generateGoogleReviewLink(reviewData, placeId) : null;
  
  return (
    <div className="review-analysis p-6 bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-2">Your Feedback Analysis</h3>
        {error && (
          <div className="p-3 my-3 bg-red-900 text-white rounded">
            {error}
          </div>
        )}
      </div>
      
      {/* Summary */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <h4 className="text-lg font-medium text-white mb-2">Summary</h4>
        <p className="text-gray-200">{reviewData.summary || 'N/A'}</p>
      </div>
      
      {/* Core assessments in a grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-700 rounded-lg">
          <h4 className="text-lg font-medium text-white mb-2 flex items-center">
            <span className="mr-2">🍽️</span> Food Quality
          </h4>
          <p className="text-gray-200">{reviewData.food_quality || 'N/A'}</p>
        </div>
        
        <div className="p-4 bg-gray-700 rounded-lg">
          <h4 className="text-lg font-medium text-white mb-2 flex items-center">
            <span className="mr-2">👨‍🍳</span> Service
          </h4>
          <p className="text-gray-200">{reviewData.service || 'N/A'}</p>
        </div>
        
        <div className="p-4 bg-gray-700 rounded-lg">
          <h4 className="text-lg font-medium text-white mb-2 flex items-center">
            <span className="mr-2">🏮</span> Atmosphere
          </h4>
          <p className="text-gray-200">{reviewData.atmosphere || 'N/A'}</p>
        </div>
        
        <div className="p-4 bg-gray-700 rounded-lg">
          <h4 className="text-lg font-medium text-white mb-2 flex items-center">
            <span className="mr-2">🎵</span> Music & Entertainment
          </h4>
          <p className="text-gray-200">{reviewData.music_and_entertainment || 'N/A'}</p>
        </div>
      </div>
      
      {/* Sentiment score */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg text-center">
        <h4 className="text-lg font-medium text-white mb-2">Overall Sentiment</h4>
        {typeof reviewData.sentiment_score === 'number' ? (
          <div className="animated-stars">
            {renderStars(reviewData.sentiment_score)}
          </div>
        ) : (
          <p className="text-xl">{reviewData.sentiment_score || 'N/A'}</p>
        )}
      </div>
      
      {/* Key points */}
      {reviewData.specific_points && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-lg font-medium text-white mb-2 flex items-center">
            <span className="mr-2">🔑</span> Key Points
          </h4>
          <ul className="list-disc list-inside text-gray-200">
            {Array.isArray(reviewData.specific_points) ? (
              reviewData.specific_points.map((point, index) => (
                <li key={index} className="mb-1">{point}</li>
              ))
            ) : typeof reviewData.specific_points === 'string' ? (
              reviewData.specific_points.split(',').map((point, index) => {
                const cleanPoint = point.trim().replace(/^['"]|['"]$/g, '');
                return cleanPoint && cleanPoint !== 'N/A' ? (
                  <li key={index} className="mb-1">{cleanPoint}</li>
                ) : null;
              })
            ) : (
              <li>No specific points provided</li>
            )}
          </ul>
        </div>
      )}
      
      {/* Suggestions */}
      {reviewData.improvement_suggestions && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-lg font-medium text-white mb-2 flex items-center">
            <span className="mr-2">💡</span> Suggestions for Improvement
          </h4>
          <ul className="list-disc list-inside text-gray-200">
            {Array.isArray(reviewData.improvement_suggestions) ? (
              reviewData.improvement_suggestions.map((suggestion, index) => (
                <li key={index} className="mb-1">{suggestion}</li>
              ))
            ) : typeof reviewData.improvement_suggestions === 'string' ? (
              reviewData.improvement_suggestions.split(',').map((suggestion, index) => {
                const cleanSuggestion = suggestion.trim().replace(/^['"]|['"]$/g, '');
                return cleanSuggestion && cleanSuggestion !== 'N/A' ? (
                  <li key={index} className="mb-1">{cleanSuggestion}</li>
                ) : null;
              })
            ) : (
              <li>No suggestions provided</li>
            )}
          </ul>
        </div>
      )}
      
      {/* Formatted review for copying */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <h4 className="text-lg font-medium text-white mb-2 flex items-center">
          <span className="mr-2">📝</span> Your Review
        </h4>
        <p className="text-gray-300 mb-3">
          Here's your formatted review. You can copy this to post on Google Reviews or other platforms.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 p-4 rounded text-gray-300 whitespace-pre-wrap overflow-x-auto">
            {formattedReview}
          </pre>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(formattedReview);
              alert('Review copied to clipboard!');
            }}
            className="absolute top-2 right-2 p-2 bg-gray-700 rounded hover:bg-gray-600 transition"
            title="Copy to clipboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleSaveReview}
          disabled={saving || saved}
          className={`py-3 px-4 rounded-md flex items-center justify-center ${
            saved 
              ? 'bg-green-700 text-white cursor-default'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {saving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : saved ? (
            <>
              <svg className="mr-2 h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Saved!
            </>
          ) : (
            <>💾 Save Feedback</>
          )}
        </button>
        
        <button
          onClick={onStartOver}
          disabled={saving}
          className="py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
        >
          ↩️ Start Over
        </button>
      </div>
      
      {/* Google Review link */}
      {saved && googleReviewLink && (
        <div className="mt-6 p-5 bg-blue-900 rounded-lg shadow-md">
          <h4 className="text-lg font-medium text-white mb-3 flex items-center justify-center">
            <span className="mr-2">🌟</span> Share on Google Reviews?
          </h4>
          <p className="text-white mb-4 text-center">
            Would you mind also sharing your experience on Google Reviews to help other diners?
          </p>
          <div className="flex justify-center">
            <a
              href={googleReviewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-white text-blue-900 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition"
            >
              <img 
                src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" 
                alt="Google" 
                className="h-5 mr-2" 
              />
              Open Google Reviews
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewAnalysis;