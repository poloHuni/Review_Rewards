// src/components/Feedback/ReviewAnalysis.js
import React, { useState } from 'react';
import { saveReview } from '../../services/reviewService';
import { getUserPoints, awardPoints } from '../../services/pointsService';
import { useAuth } from '../../contexts/AuthContext';

const ReviewAnalysis = ({ reviewData, onSaveSuccess, onStartOver, placeId }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);
  
  const { currentUser } = useAuth();

  // Get authenticated user
  const getAuthenticatedUser = () => {
    return currentUser;
  };

  // Save review function
  const handleSaveReview = async () => {
    const user = getAuthenticatedUser();
    if (!user) {
      setError('Please log in to save your review');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Save the review
      const saveResult = await saveReview(reviewData, user);
      
      if (saveResult.success) {
        // Award points
        try {
          await awardPoints(user.uid, 10, 'review_submission');
        } catch (pointsError) {
          console.warn('Points award failed:', pointsError);
        }
        
        setSaved(true);
        if (onSaveSuccess) onSaveSuccess();
        
        // Auto-show sharing after save
        setTimeout(() => {
          setShowShareModal(true);
        }, 1000);
      } else {
        throw new Error(saveResult.error || 'Failed to save review');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Render star rating
  const renderStars = (score) => {
    const stars = [];
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    if (hasHalfStar) {
      stars.push('✨');
    }
    
    return (
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>
        {stars.join('')} ({score}/5)
      </div>
    );
  };

  // Generate formatted review for copying
  const generateFormattedReview = () => {
    let formattedReview = `${reviewData.summary}\n\n`;
    
    formattedReview += `🍽️ Food Quality: ${reviewData.food_quality}\n\n`;
    formattedReview += `👥 Service: ${reviewData.service}\n\n`;
    formattedReview += `🏪 Atmosphere: ${reviewData.atmosphere}\n\n`;
    
    if (reviewData.music_and_entertainment) {
      formattedReview += `🎵 Music & Entertainment: ${reviewData.music_and_entertainment}\n\n`;
    }
    
    if (reviewData.specific_points && reviewData.specific_points.length > 0) {
      formattedReview += `Key Points:\n`;
      reviewData.specific_points.forEach(point => {
        formattedReview += `• ${point}\n`;
      });
      formattedReview += `\n`;
    }
    
    return formattedReview;
  };

  // Copy review to clipboard
  const handleCopyReview = async () => {
    try {
      const formattedText = generateFormattedReview();
      await navigator.clipboard.writeText(formattedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy review. Please try again.');
    }
  };

  // Get Google Reviews link
  const getGoogleReviewsLink = () => {
    if (placeId) {
      return `https://search.google.com/local/writereview?placeid=${placeId}`;
    } else {
      return `https://www.google.com/maps/search/${encodeURIComponent('restaurant review')}`;
    }
  };

  // Share Modal Component
  const ShareModal = () => {
    if (!showShareModal) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          color: '#1f2937',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#22c55e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              fontSize: '30px'
            }}>
              📤
            </div>
            <h2 style={{ fontSize: '28px', marginBottom: '10px', color: '#1f2937' }}>
              Share Your Review
            </h2>
            <p style={{ color: '#6b7280' }}>
              Copy your formatted review and share it on Google Reviews
            </p>
          </div>

          {/* Formatted Review Preview */}
          <div style={{
            backgroundColor: '#f9fafb',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.6',
            maxHeight: '300px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {generateFormattedReview()}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '15px',
            flexDirection: 'column'
          }}>
            <button
              onClick={handleCopyReview}
              style={{
                backgroundColor: copySuccess ? '#22c55e' : '#3b82f6',
                color: 'white',
                padding: '15px 30px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {copySuccess ? '✅ Copied!' : '📋 Copy Review Text'}
            </button>
            
            <a
              href={getGoogleReviewsLink()}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#db4437',
                color: 'white',
                padding: '15px 30px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '10px',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              🔗 Write Google Review
            </a>
            
            <button
              onClick={() => setShowShareModal(false)}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '12px 24px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (showAnalysis) {
    return (
      <div>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#22c55e',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            fontSize: '40px'
          }}>
            ✅
          </div>
          <h2 style={{ 
            fontSize: '28px', 
            marginBottom: '10px',
            background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            Your Feedback Analysis
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.8 }}>
            AI-powered insights from your dining experience
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '15px',
            marginBottom: '20px',
            color: '#fca5a5',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Overall Sentiment */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '30px',
          marginBottom: '30px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>
            📊 Overall Experience
          </h3>
          {typeof reviewData.sentiment_score === 'number' && renderStars(reviewData.sentiment_score)}
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>
            {reviewData.sentiment_score >= 4.5 ? 'Excellent' :
             reviewData.sentiment_score >= 3.5 ? 'Good' :
             reviewData.sentiment_score >= 2.5 ? 'Average' : 'Needs Improvement'}
          </p>
        </div>

        {/* Summary */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '20px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>
            📝 Review Summary
          </h3>
          <p style={{ fontSize: '16px', lineHeight: '1.6', opacity: 0.9 }}>
            {reviewData.summary || 'No summary provided'}
          </p>
        </div>

        {/* Detailed Analysis */}
        <div style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          marginBottom: '30px'
        }}>
          {/* Food Quality */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
              🍽️ Food Quality
            </h4>
            <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
              {reviewData.food_quality || 'No food feedback provided'}
            </p>
          </div>

          {/* Service */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
              👥 Service
            </h4>
            <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
              {reviewData.service || 'No service feedback provided'}
            </p>
          </div>

          {/* Atmosphere */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
              🏪 Atmosphere
            </h4>
            <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
              {reviewData.atmosphere || 'No atmosphere feedback provided'}
            </p>
          </div>

          {/* Music & Entertainment */}
          {reviewData.music_and_entertainment && (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              padding: '20px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                🎵 Music & Entertainment
              </h4>
              <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
                {reviewData.music_and_entertainment}
              </p>
            </div>
          )}
        </div>

        {/* Specific Points */}
        {reviewData?.specific_points && reviewData.specific_points.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>
              🎯 Key Points
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {reviewData.specific_points.map((point, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: 'white',
                      borderRadius: '50%'
                    }} />
                  </div>
                  <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        {reviewData?.improvement_suggestions && reviewData.improvement_suggestions.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '30px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>
              💡 Suggestions for Improvement
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {reviewData.improvement_suggestions.map((suggestion, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#22c55e',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: 'white',
                      borderRadius: '50%'
                    }} />
                  </div>
                  <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
                    {suggestion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={handleSaveReview}
            disabled={saving || saved || !getAuthenticatedUser()}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '10px',
              cursor: (saved || saving || !getAuthenticatedUser()) ? 'not-allowed' : 'pointer',
              background: saved 
                ? '#22c55e' 
                : saving 
                  ? '#6b7280'
                  : !getAuthenticatedUser()
                    ? '#6b7280'
                    : 'linear-gradient(45deg, #8b5cf6, #ec4899)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.3s ease',
              opacity: (saving || !getAuthenticatedUser()) ? 0.6 : 1
            }}
          >
            {saved ? '✅ Saved' : saving ? '⏳ Saving...' : '💾 Save Review (+10 pts)'}
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '10px',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            📤 Share Review
          </button>

          <button
            onClick={onStartOver}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '10px',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            🔄 Leave Another Review
          </button>
        </div>

        <ShareModal />
      </div>
    );
  }

  return null;
};

export default ReviewAnalysis;