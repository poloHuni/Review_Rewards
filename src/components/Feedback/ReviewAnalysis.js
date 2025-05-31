// src/components/Feedback/ReviewAnalysis.js
import React, { useState } from 'react';
import { saveReview, formatReviewForSharing, generateGoogleReviewLink } from '../../services/reviewService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Star, 
  Copy, 
  Check, 
  RotateCcw, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle, 
  BookOpen, 
  Lightbulb,
  MessageSquare,
  TrendingUp,
  Volume2,
  Share2
} from 'lucide-react';

const ReviewAnalysis = ({ reviewData, onSaveSuccess, onStartOver, placeId }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
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
    const roundedScore = Math.round(score * 2) / 2; // Round to nearest 0.5
    
    for (let i = 1; i <= 5; i++) {
      if (i <= roundedScore) {
        stars.push(
          <Star 
            key={i} 
            size={20}
            className="text-amber-400 fill-current"
          />
        );
      } else if (i - 0.5 === roundedScore) {
        stars.push(
          <div key={i} className="relative">
            <Star size={20} className="text-slate-600" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star size={20} className="text-amber-400 fill-current" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star 
            key={i} 
            size={20}
            className="text-slate-600"
          />
        );
      }
    }
    
    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="ml-2 text-slate-400 font-medium">({score.toFixed(1)}/5)</span>
      </div>
    );
  };
  
  // Format the review for sharing
  const formattedReview = formatReviewForSharing(reviewData);
  
  // Generate Google Review link
  const googleReviewLink = placeId ? generateGoogleReviewLink(reviewData, placeId) : null;
  
  const handleCopyReview = async () => {
    try {
      await navigator.clipboard.writeText(formattedReview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getSentimentColor = (score) => {
    if (score >= 4.5) return 'text-emerald-400';
    if (score >= 3.5) return 'text-amber-400';
    if (score >= 2.5) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSentimentBg = (score) => {
    if (score >= 4.5) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 3.5) return 'bg-amber-500/10 border-amber-500/20';
    if (score >= 2.5) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CheckCircle className="text-white" size={24} />
        </div>
        <h3 className="heading-lg mb-2">Your Feedback Analysis</h3>
        <p className="body-md">AI-powered insights from your dining experience</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 status-error rounded-lg flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Save Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}
      
      {/* Overall Sentiment */}
      <div className={`p-6 rounded-xl border ${getSentimentBg(reviewData.sentiment_score)}`}>
        <div className="text-center">
          <h4 className="heading-sm mb-3 flex items-center justify-center gap-2">
            <TrendingUp size={20} className={getSentimentColor(reviewData.sentiment_score)} />
            Overall Experience
          </h4>
          {typeof reviewData.sentiment_score === 'number' ? (
            <div className="space-y-3">
              {renderStars(reviewData.sentiment_score)}
              <p className={`text-2xl font-bold ${getSentimentColor(reviewData.sentiment_score)}`}>
                {reviewData.sentiment_score >= 4.5 ? 'Excellent' :
                 reviewData.sentiment_score >= 3.5 ? 'Good' :
                 reviewData.sentiment_score >= 2.5 ? 'Average' : 'Poor'}
              </p>
            </div>
          ) : (
            <p className="text-xl text-slate-300">{reviewData.sentiment_score || 'N/A'}</p>
          )}
        </div>
      </div>
      
      {/* Summary */}
      <div className="glass-card-subtle rounded-xl p-6">
        <h4 className="heading-sm mb-3 flex items-center gap-2">
          <MessageSquare size={20} className="text-blue-400" />
          Summary
        </h4>
        <p className="text-slate-300 leading-relaxed">{reviewData.summary || 'N/A'}</p>
      </div>
      
      {/* Detailed Assessments */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card-subtle rounded-xl p-6">
          <h4 className="heading-sm mb-3 flex items-center gap-2">
            🍽️ Food Quality
          </h4>
          <p className="text-slate-300">{reviewData.food_quality || 'N/A'}</p>
        </div>
        
        <div className="glass-card-subtle rounded-xl p-6">
          <h4 className="heading-sm mb-3 flex items-center gap-2">
            👨‍🍳 Service
          </h4>
          <p className="text-slate-300">{reviewData.service || 'N/A'}</p>
        </div>
        
        <div className="glass-card-subtle rounded-xl p-6">
          <h4 className="heading-sm mb-3 flex items-center gap-2">
            🏮 Atmosphere
          </h4>
          <p className="text-slate-300">{reviewData.atmosphere || 'N/A'}</p>
        </div>
        
        <div className="glass-card-subtle rounded-xl p-6">
          <h4 className="heading-sm mb-3 flex items-center gap-2">
            🎵 Music & Entertainment
          </h4>
          <p className="text-slate-300">{reviewData.music_and_entertainment || 'N/A'}</p>
        </div>
      </div>
      
      {/* Key Points */}
      {reviewData.specific_points && (
        <div className="glass-card-subtle rounded-xl p-6">
          <h4 className="heading-sm mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-purple-400" />
            Key Points
          </h4>
          <ul className="space-y-2">
            {Array.isArray(reviewData.specific_points) ? (
              reviewData.specific_points.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-slate-300">{point}</span>
                </li>
              ))
            ) : typeof reviewData.specific_points === 'string' ? (
              reviewData.specific_points.split(',').map((point, index) => {
                const cleanPoint = point.trim().replace(/^['"]|['"]$/g, '');
                return cleanPoint && cleanPoint !== 'N/A' ? (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-300">{cleanPoint}</span>
                  </li>
                ) : null;
              })
            ) : (
              <li className="text-slate-400 italic">No specific points provided</li>
            )}
          </ul>
        </div>
      )}
      
      {/* Improvement Suggestions */}
      {reviewData.improvement_suggestions && (
        <div className="glass-card-subtle rounded-xl p-6">
          <h4 className="heading-sm mb-4 flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-400" />
            Suggestions for Improvement
          </h4>
          <ul className="space-y-2">
            {Array.isArray(reviewData.improvement_suggestions) ? (
              reviewData.improvement_suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-slate-300">{suggestion}</span>
                </li>
              ))
            ) : typeof reviewData.improvement_suggestions === 'string' ? (
              reviewData.improvement_suggestions.split(',').map((suggestion, index) => {
                const cleanSuggestion = suggestion.trim().replace(/^['"]|['"]$/g, '');
                return cleanSuggestion && cleanSuggestion !== 'N/A' ? (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-300">{cleanSuggestion}</span>
                  </li>
                ) : null;
              })
            ) : (
              <li className="text-slate-400 italic">No suggestions provided</li>
            )}
          </ul>
        </div>
      )}
      
      {/* Formatted Review for Sharing */}
      <div className="glass-card-subtle rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="heading-sm flex items-center gap-2">
            <Share2 size={20} className="text-blue-400" />
            Formatted Review
          </h4>
          <button 
            onClick={handleCopyReview}
            className="btn-ghost flex items-center gap-2 focus-ring"
          >
            {copied ? (
              <>
                <Check size={16} className="text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy
              </>
            )}
          </button>
        </div>
        
        <p className="body-sm mb-4 text-slate-400">
          Here's your formatted review ready to share on Google Reviews or other platforms.
        </p>
        
        <div className="relative">
          <pre className="bg-white/5 p-4 rounded-lg text-slate-300 whitespace-pre-wrap overflow-x-auto text-sm leading-relaxed border border-white/10">
            {formattedReview}
          </pre>
        </div>
      </div>

      {/* Audio Recording */}
      {reviewData.audio_url && (
        <div className="glass-card-subtle rounded-xl p-6">
          <h4 className="heading-sm mb-4 flex items-center gap-2">
            <Volume2 size={20} className="text-green-400" />
            Original Audio Recording
          </h4>
          <audio src={reviewData.audio_url} controls className="w-full" />
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="grid md:grid-cols-2 gap-4 pt-4">
        <button
          onClick={handleSaveReview}
          disabled={saving || saved}
          className={`py-4 px-6 rounded-xl font-medium transition-all duration-200 focus-ring flex items-center justify-center gap-2 ${
            saved 
              ? 'status-success cursor-default'
              : 'btn-primary'
          }`}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle size={20} />
              Saved Successfully!
            </>
          ) : (
            <>
              <Check size={20} />
              Save Feedback
            </>
          )}
        </button>
        
        <button
          onClick={onStartOver}
          disabled={saving}
          className="btn-secondary py-4 px-6 rounded-xl font-medium focus-ring flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} />
          Start Over
        </button>
      </div>
      
      {/* Google Review Link */}
      {saved && googleReviewLink && (
        <div className="glass-card rounded-xl p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <div className="text-center">
            <h4 className="heading-sm mb-3 flex items-center justify-center gap-2">
              <Star size={20} className="text-blue-400" />
              Share on Google Reviews
            </h4>
            <p className="body-md mb-6">
              Help other diners by sharing your experience on Google Reviews too!
            </p>
            <a
              href={googleReviewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center justify-center gap-2 focus-ring"
            >
              <img 
                src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" 
                alt="Google" 
                className="h-5 w-5" 
              />
              Open Google Reviews
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewAnalysis;