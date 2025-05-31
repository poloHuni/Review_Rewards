// src/components/Feedback/ReviewAnalysis.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveReview, formatReviewForSharing, generateGoogleReviewLink } from '../../services/reviewService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Star, 
  Copy, 
  Check, 
  CheckCircle,
  RotateCcw, 
  ExternalLink, 
  AlertCircle, 
  BookOpen, 
  Lightbulb,
  MessageSquare,
  TrendingUp,
  Volume2,
  Share2,
  Sparkles,
  ArrowLeft,
  Eye
} from 'lucide-react';

const ReviewAnalysis = ({ reviewData, onSaveSuccess, onStartOver, placeId }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [currentView, setCurrentView] = useState('analysis'); // 'analysis' or 'sharing'
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
      
      // Quick success indication, then transition to sharing
      setTimeout(() => {
        setCurrentView('sharing');
      }, 500);
      
      if (onSaveSuccess) {
        onSaveSuccess(reviewData);
      }
    } catch (err) {
      setError(`Failed to save review: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleViewAnalysis = () => {
    setCurrentView('analysis');
  };

  const handleViewSharing = () => {
    setCurrentView('sharing');
  };
  
  // Generate Google Review link
  const googleReviewLink = placeId ? generateGoogleReviewLink(reviewData, placeId) : null;
  
  // Format the review for sharing
  const formattedReview = formatReviewForSharing(reviewData);
  
  const handleCopyReview = async () => {
    try {
      await navigator.clipboard.writeText(formattedReview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
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

  // Faster, more seamless animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.15, // Even faster
        staggerChildren: 0.03 // Faster stagger
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.1 // Very quick exit
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 5 }, // Smaller movement
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.15, // Faster
        ease: "easeOut"
      }
    }
  };

  const sharingVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.99, // Less dramatic scaling
      y: 5
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2, // Faster but still smooth
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.05
      }
    },
    exit: {
      opacity: 0,
      scale: 0.99,
      y: -5,
      transition: {
        duration: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 5, scale: 0.995 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.15,
        ease: "easeOut"
      }
    }
  };

  // Sharing Section Component (Clean, focused interface)
  const SharingSection = () => (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={sharingVariants}
      className="min-h-[60vh] flex flex-col justify-center space-y-8 p-6"
    >
      {/* Success Header */}
      <motion.div 
        className="text-center"
        variants={cardVariants}
      >
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Sparkles className="text-white" size={32} />
        </div>
        <h2 className="heading-lg mb-3 text-emerald-400">Feedback Saved Successfully!</h2>
        <p className="body-lg mb-2">Thank you for sharing your experience</p>
        <p className="body-md">Now help other diners by sharing your review</p>
      </motion.div>

      {/* Formatted Review Card */}
      <motion.div 
        className="glass-card rounded-2xl p-8 max-w-4xl mx-auto w-full"
        variants={cardVariants}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="heading-md flex items-center gap-3">
            <Share2 size={24} className="text-blue-400" />
            Your Formatted Review
          </h3>
          <button 
            onClick={handleCopyReview}
            className={`btn-secondary flex items-center gap-2 focus-ring transition-all duration-200 ${
              copied ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ''
            }`}
          >
            {copied ? (
              <>
                <Check size={18} className="text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy Text
              </>
            )}
          </button>
        </div>
        
        <p className="body-md mb-6 text-center">
          Here's your formatted review ready to share on Google Reviews or other platforms.
        </p>
        
        <div className="relative">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 max-h-80 overflow-y-auto">
            <pre className="text-slate-200 whitespace-pre-wrap text-base leading-relaxed font-sans">
              {formattedReview}
            </pre>
          </div>
        </div>
      </motion.div>

      {/* Google Review Button */}
      {googleReviewLink && (
        <motion.div 
          className="text-center"
          variants={cardVariants}
        >
          <div className="glass-card rounded-2xl p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 max-w-2xl mx-auto">
            <h3 className="heading-md mb-3 flex items-center justify-center gap-3">
              <Star size={24} className="text-blue-400" />
              Share on Google Reviews
            </h3>
            <p className="body-lg mb-8">
              Help other diners discover great experiences by sharing your review on Google!
            </p>
            <a
              href={googleReviewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-3 focus-ring hover:scale-105 mx-auto max-w-sm"
            >
              <img 
                src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" 
                alt="Google" 
                className="h-6 w-6" 
              />
              Open Google Reviews
              <ExternalLink size={20} />
            </a>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div 
        className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto w-full"
        variants={cardVariants}
      >
        <button
          onClick={handleViewAnalysis}
          className="btn-ghost flex items-center justify-center gap-2 focus-ring px-6 py-3"
        >
          <Eye size={18} />
          View Full Analysis
        </button>
        
        <button
          onClick={onStartOver}
          className="btn-secondary flex items-center justify-center gap-2 focus-ring px-6 py-3 hover:scale-105 transition-transform"
        >
          <RotateCcw size={18} />
          Leave Another Review
        </button>
      </motion.div>
    </motion.div>
  );

  // Analysis Section Component
  const AnalysisSection = () => (
    <motion.div 
      className="space-y-6 p-6"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
      {/* Back Button (if already saved) */}
      {saved && (
        <motion.div className="mb-4" variants={itemVariants}>
          <button
            onClick={handleViewSharing}
            className="btn-ghost flex items-center gap-2 focus-ring"
          >
            <ArrowLeft size={18} />
            Back to Formatted Review
          </button>
        </motion.div>
      )}

      {/* Header */}
      <motion.div className="text-center" variants={itemVariants}>
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CheckCircle className="text-white" size={24} />
        </div>
        <h3 className="heading-lg mb-2">Your Feedback Analysis</h3>
        <p className="body-md">AI-powered insights from your dining experience</p>
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="p-4 status-error rounded-lg flex items-start gap-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Save Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overall Sentiment */}
      <motion.div 
        className={`p-6 rounded-xl border ${getSentimentBg(reviewData.sentiment_score)}`}
        variants={itemVariants}
      >
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
      </motion.div>
      
      {/* Summary */}
      <motion.div className="glass-card-subtle rounded-xl p-6" variants={itemVariants}>
        <h4 className="heading-sm mb-3 flex items-center gap-2">
          <MessageSquare size={20} className="text-blue-400" />
          Summary
        </h4>
        <p className="text-slate-300 leading-relaxed">{reviewData.summary || 'N/A'}</p>
      </motion.div>
      
      {/* Detailed Assessments */}
      <motion.div className="grid md:grid-cols-2 gap-4" variants={itemVariants}>
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
      </motion.div>
      
      {/* Key Points */}
      {reviewData.specific_points && (
        <motion.div className="glass-card-subtle rounded-xl p-6" variants={itemVariants}>
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
        </motion.div>
      )}
      
      {/* Improvement Suggestions */}
      {reviewData.improvement_suggestions && (
        <motion.div className="glass-card-subtle rounded-xl p-6" variants={itemVariants}>
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
        </motion.div>
      )}

      {/* Audio Recording */}
      {reviewData.audio_url && (
        <motion.div className="glass-card-subtle rounded-xl p-6" variants={itemVariants}>
          <h4 className="heading-sm mb-4 flex items-center gap-2">
            <Volume2 size={20} className="text-green-400" />
            Original Audio Recording
          </h4>
          <audio src={reviewData.audio_url} controls className="w-full" />
        </motion.div>
      )}
      
      {/* Save Feedback Button or Navigation */}
      <motion.div className="pt-4" variants={itemVariants}>
        {!saved ? (
          <button
            onClick={handleSaveReview}
            disabled={saving}
            className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-200 focus-ring flex items-center justify-center gap-2 ${
              saving 
                ? 'bg-blue-900 cursor-not-allowed opacity-50'
                : saved && currentView === 'analysis'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'btn-primary hover:scale-105'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Saving Your Feedback...
              </>
            ) : saved && currentView === 'analysis' ? (
              <>
                <CheckCircle size={20} />
                Feedback Saved! Preparing to share...
              </>
            ) : (
              <>
                <Check size={20} />
                Save My Feedback
              </>
            )}
          </button>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={handleViewSharing}
              className="btn-primary flex-1 py-4 px-6 rounded-xl font-medium focus-ring flex items-center justify-center gap-2 hover:scale-105"
            >
              <Share2 size={20} />
              Share Your Review
            </button>
            <button
              onClick={onStartOver}
              className="btn-secondary py-4 px-6 rounded-xl font-medium focus-ring flex items-center justify-center gap-2 hover:scale-105"
            >
              <RotateCcw size={20} />
              New Review
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
  
  return (
    <AnimatePresence mode="wait">
      {currentView === 'analysis' ? (
        <AnalysisSection key="analysis" />
      ) : (
        <SharingSection key="sharing" />
      )}
    </AnimatePresence>
  );
};

export default ReviewAnalysis;