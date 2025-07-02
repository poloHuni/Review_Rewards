// src/components/Feedback/ReviewAnalysis.js
// Complete file with authentication debugging

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Share2, 
  RotateCcw, 
  Star, 
  Volume2, 
  Copy, 
  ExternalLink,
  Zap,
  Gift 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  saveReview, 
  generateGoogleReviewLink, 
  formatReviewForSharing 
} from '../../services/reviewService';

// Points system imports
import { 
  canEarnPointsToday, 
  awardPoints, 
  POINTS_CONFIG, 
  getUserPoints 
} from '../../services/pointsService';

// Firebase auth imports for debugging
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/config';

const ReviewAnalysis = ({ reviewData, onSave, onStartOver }) => {
  const { user } = useAuth();
  
  // Existing state
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAnalysisView, setShowAnalysisView] = useState(true);
  const [showSharingSection, setShowSharingSection] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Points system state
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [canEarnToday, setCanEarnToday] = useState(true);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [formattedReviewText, setFormattedReviewText] = useState('');

  // NEW: Debug authentication state
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // NEW: Direct Firebase auth listener for debugging
  useEffect(() => {
    console.log('🔍 Setting up Firebase auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔥 Firebase Auth State Changed:', user);
      console.log('Firebase user UID:', user?.uid);
      console.log('Firebase user email:', user?.email);
      setFirebaseUser(user);
      setAuthLoading(false);
    });

    return () => {
      console.log('🔍 Cleaning up Firebase auth listener');
      unsubscribe();
    };
  }, []);

  // NEW: Debug authentication useEffect
  useEffect(() => {
    console.log('🔍 ========== AUTH DEBUG in ReviewAnalysis ==========');
    console.log('1. useAuth user object:', user);
    console.log('2. useAuth user exists:', !!user);
    console.log('3. useAuth user UID:', user?.uid);
    console.log('4. useAuth user email:', user?.email);
    console.log('5. useAuth user type:', typeof user);
    
    console.log('6. Firebase user object:', firebaseUser);
    console.log('7. Firebase user exists:', !!firebaseUser);
    console.log('8. Firebase user UID:', firebaseUser?.uid);
    
    console.log('9. auth.currentUser:', auth.currentUser);
    console.log('10. auth.currentUser UID:', auth.currentUser?.uid);
    
    if (user) {
      console.log('11. useAuth user object keys:', Object.keys(user));
      console.log('12. Full useAuth user object:', JSON.stringify(user, null, 2));
    } else {
      console.log('❌ useAuth USER IS NULL/UNDEFINED!');
    }
    
    if (firebaseUser) {
      console.log('13. Firebase user object keys:', Object.keys(firebaseUser));
    } else {
      console.log('❌ FIREBASE USER IS NULL/UNDEFINED!');
    }
    
    console.log('========== END AUTH DEBUG ==========');
  }, [user, firebaseUser]);

  // NEW: Get authenticated user from multiple sources
  const getAuthenticatedUser = () => {
    console.log('🔍 Getting authenticated user...');
    
    // Try multiple sources for user
    const sources = [
      { name: 'useAuth', user: user },
      { name: 'firebase', user: firebaseUser },
      { name: 'auth.currentUser', user: auth.currentUser }
    ];
    
    for (const source of sources) {
      console.log(`Checking ${source.name}:`, source.user);
      if (source.user && source.user.uid) {
        console.log(`✅ Found authenticated user from ${source.name}:`, source.user.uid);
        return source.user;
      }
    }
    
    console.error('❌ No authenticated user found from any source');
    console.error('Sources checked:', sources);
    return null;
  };

  // Check points eligibility and prepare sharing data
  useEffect(() => {
    const initializePointsAndSharing = async () => {
      console.log('🔍 Initializing points and sharing...');
      
      const authenticatedUser = getAuthenticatedUser();
      
      if (authenticatedUser && reviewData) {
        try {
          console.log('✅ User found, checking points eligibility...');
          
          // Check points eligibility
          const canEarn = await canEarnPointsToday(authenticatedUser.uid);
          const pointsData = await getUserPoints(authenticatedUser.uid);
          setCanEarnToday(canEarn);
          setCurrentPoints(pointsData.totalPoints);
          
          console.log('Points data:', { canEarn, totalPoints: pointsData.totalPoints });
          
          // Generate Google Reviews link and formatted text
          const restaurantName = reviewData.restaurant_name || 'Restaurant';
          const placeId = reviewData.place_id || null;
          
          const link = generateGoogleReviewLink(restaurantName, placeId);
          setGoogleReviewLink(link);
          
          const formattedText = formatReviewForSharing(reviewData, restaurantName);
          setFormattedReviewText(formattedText);
          
          console.log('✅ Points and sharing initialized successfully');
          
        } catch (error) {
          console.error('❌ Error initializing points and sharing:', error);
        }
      } else {
        console.log('⚠️ Skipping points initialization - no user or review data');
        console.log('User exists:', !!authenticatedUser);
        console.log('Review data exists:', !!reviewData);
      }
    };
    
    // Only initialize if not loading
    if (!authLoading) {
      initializePointsAndSharing();
    }
  }, [user, firebaseUser, reviewData, authLoading]);

  // Save review with comprehensive debugging
  const handleSaveReview = async () => {
    try {
      console.log('🔍 ========== SAVE DEBUG - Starting save process ==========');
      console.log('Save button clicked at:', new Date().toISOString());
      
      const authenticatedUser = getAuthenticatedUser();
      
      console.log('Authentication check results:');
      console.log('- useAuth user:', user);
      console.log('- Firebase user:', firebaseUser);
      console.log('- auth.currentUser:', auth.currentUser);
      console.log('- Selected user:', authenticatedUser);
      
      if (!authenticatedUser) {
        console.error('❌ NO AUTHENTICATED USER FOUND!');
        console.error('Detailed auth state:');
        console.error('- useAuth user:', user);
        console.error('- useAuth user type:', typeof user);
        console.error('- Firebase user:', firebaseUser);
        console.error('- auth.currentUser:', auth.currentUser);
        console.error('- Auth loading:', authLoading);
        
        // Show detailed error to user
        const errorMsg = `Authentication error detected:
        - useAuth: ${user ? 'Found' : 'Missing'}
        - Firebase: ${firebaseUser ? 'Found' : 'Missing'}
        - currentUser: ${auth.currentUser ? 'Found' : 'Missing'}
        
        Please refresh the page and log in again.`;
        
        alert(errorMsg);
        
        // Force re-authentication
        const confirmReauth = confirm('Would you like to refresh the page and try again?');
        if (confirmReauth) {
          window.location.reload();
        }
        return;
      }
      
      if (!authenticatedUser.uid) {
        console.error('❌ USER UID IS MISSING!');
        console.error('User object:', authenticatedUser);
        alert('Authentication error: User ID missing. Please refresh the page and log in again.');
        return;
      }
      
      console.log('✅ User validation passed');
      console.log('- User ID:', authenticatedUser.uid);
      console.log('- User email:', authenticatedUser.email);
      
      console.log('Review data to save:', reviewData);
      
      setSaving(true);
      
      console.log('🔍 Calling saveReview service...');
      
      // Save the review using the authenticated user
      const result = await saveReview(reviewData, authenticatedUser);
      
      console.log('Save result:', result);
      
      if (result.success) {
        console.log('✅ Review saved successfully!');
        console.log('Document ID:', result.id);
        
        // Award points logic
        let earnedPoints = 0;
        if (canEarnToday) {
          try {
            console.log('🔍 Awarding points...');
            const success = await awardPoints(authenticatedUser.uid, POINTS_CONFIG.SAVE_FEEDBACK, 'Feedback Saved');
            
            if (success) {
              earnedPoints = POINTS_CONFIG.SAVE_FEEDBACK;
              setPointsEarned(earnedPoints);
              
              console.log('✅ Points awarded:', earnedPoints);
              
              const pointsData = await getUserPoints(authenticatedUser.uid);
              setCurrentPoints(pointsData.totalPoints);
              setShowPointsModal(true);
              
              console.log('Updated points total:', pointsData.totalPoints);
            }
          } catch (pointsError) {
            console.error('❌ Error awarding points:', pointsError);
          }
        } else {
          console.log('⚠️ Cannot earn points today (daily limit reached)');
        }
        
        setSaved(true);
        
        if (onSave) {
          onSave(result);
        }
        
        console.log('✅ Save process completed successfully');
      } else {
        console.error('❌ Save result indicates failure:', result);
      }
      
    } catch (error) {
      console.error('❌ ========== SAVE ERROR ==========');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      console.error('========== END SAVE ERROR ==========');
      
      alert('Failed to save review: ' + error.message);
    } finally {
      setSaving(false);
      console.log('🔍 Save process finished (finally block)');
    }
  };

  // Handle Google Review copy with bonus points
  const handleCopyToGoogle = async () => {
    try {
      const authenticatedUser = getAuthenticatedUser();
      
      // Copy review to clipboard
      await navigator.clipboard.writeText(formattedReviewText);
      setCopySuccess(true);
      
      // Award additional points if eligible
      if (canEarnToday && authenticatedUser && pointsEarned > 0) {
        try {
          const success = await awardPoints(authenticatedUser.uid, POINTS_CONFIG.COPY_TO_GOOGLE, 'Copied to Google Reviews');
          if (success) {
            const extraPoints = POINTS_CONFIG.COPY_TO_GOOGLE;
            setPointsEarned(prev => prev + extraPoints);
            
            // Update current points display
            const pointsData = await getUserPoints(authenticatedUser.uid);
            setCurrentPoints(pointsData.totalPoints);
            
            alert(`Review copied! You earned ${extraPoints} more points!`);
          }
        } catch (error) {
          console.error('Error awarding Google review points:', error);
          alert('Review copied to clipboard!');
        }
      } else {
        alert('Review copied to clipboard!');
      }
      
      // Clear success message after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
      
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy review to clipboard');
    }
  };

  // Open Google Reviews
  const handleOpenGoogleReviews = () => {
    if (googleReviewLink) {
      window.open(googleReviewLink, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle back to sharing view
  const handleBackToSharing = () => {
    setShowAnalysisView(false);
    setShowSharingSection(true);
  };

  // Analysis section component
  const AnalysisSection = () => (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* NEW: Authentication Status Display (for debugging) */}
      {authLoading ? (
        <motion.div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg" variants={itemVariants}>
          <p className="text-yellow-200">🔄 Checking authentication...</p>
        </motion.div>
      ) : !getAuthenticatedUser() ? (
        <motion.div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg" variants={itemVariants}>
          <p className="text-red-200 font-medium">❌ Authentication Error</p>
          <p className="text-red-300 text-sm mb-3">
            No authenticated user found. Please refresh the page and log in again.
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => console.log('Auth Debug:', { user, firebaseUser, currentUser: auth.currentUser })}
              className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
            >
              Debug Auth
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg" variants={itemVariants}>
          <p className="text-green-200">✅ Authenticated as: {getAuthenticatedUser().email || getAuthenticatedUser().uid}</p>
        </motion.div>
      )}

      {/* Points Status Banner */}
      {getAuthenticatedUser() && (
        <motion.div 
          className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="text-purple-400" size={20} />
              <div>
                <p className="text-white font-medium">Your Points: {currentPoints}</p>
                <p className="text-slate-300 text-sm">
                  {canEarnToday 
                    ? `Earn ${POINTS_CONFIG.SAVE_FEEDBACK}-${POINTS_CONFIG.SAVE_FEEDBACK + POINTS_CONFIG.COPY_TO_GOOGLE} points for this review`
                    : 'Daily limit reached - come back tomorrow to earn more points'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/rewards'}
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              View Rewards →
            </button>
          </div>
        </motion.div>
      )}

      {/* Review Summary */}
      <motion.div className="text-center" variants={itemVariants}>
        <div className="flex justify-center items-center gap-2 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={24}
              className={`${
                i < (reviewData.sentiment_score || 0)
                  ? 'text-amber-400 fill-amber-400 star-glow'
                  : 'text-slate-600'
              } transition-colors`}
            />
          ))}
          <span className="text-2xl font-bold text-white ml-2">
            {reviewData.sentiment_score}/5
          </span>
        </div>
        
        <h3 className="heading-lg mb-4">Your Review Analysis</h3>
        <p className="body-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {reviewData.summary}
        </p>
      </motion.div>

      {/* Detailed Analysis Grid */}
      <motion.div className="grid md:grid-cols-2 gap-6" variants={itemVariants}>
        <div className="glass-card-subtle rounded-xl p-6">
          <h4 className="heading-sm mb-3 flex items-center gap-2">
            🍽️ Food Quality
          </h4>
          <p className="body-md text-slate-300">
            {reviewData.food_quality || 'No specific feedback provided'}
          </p>
        </div>

        <div className="glass-card-subtle rounded-xl p-6">
          <h4 className="heading-sm mb-3 flex items-center gap-2">
            👨‍🍳 Service
          </h4>
          <p className="body-md text-slate-300">
            {reviewData.service || 'No specific feedback provided'}
          </p>
        </div>

        <div className="glass-card-subtle rounded-xl p-6">
          <h4 className="heading-sm mb-3 flex items-center gap-2">
            🏮 Atmosphere
          </h4>
          <p className="body-md text-slate-300">
            {reviewData.atmosphere || 'No specific feedback provided'}
          </p>
        </div>

        <div className="glass-card-subtle rounded-xl p-6">
          <h4 className="heading-sm mb-3 flex items-center gap-2">
            🎵 Music & Entertainment
          </h4>
          <p className="body-md text-slate-300">
            {reviewData.music_and_entertainment || 'No specific feedback provided'}
          </p>
        </div>
      </motion.div>

      {/* Key Points */}
      {reviewData.specific_points && reviewData.specific_points.length > 0 && (
        <motion.div className="glass-card-subtle rounded-xl p-6" variants={itemVariants}>
          <h4 className="heading-sm mb-4 flex items-center gap-2">
            🔑 Key Points
          </h4>
          <ul className="space-y-2">
            {(Array.isArray(reviewData.specific_points) 
              ? reviewData.specific_points 
              : reviewData.specific_points.split(',')
            ).map((point, index) => {
              const cleanPoint = point.trim().replace(/^['"]|['"]$/g, '');
              return cleanPoint && cleanPoint !== 'N/A' ? (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-slate-300">{cleanPoint}</span>
                </li>
              ) : null;
            })}
          </ul>
        </motion.div>
      )}

      {/* Improvement Suggestions */}
      {reviewData.improvement_suggestions && (
        <motion.div className="glass-card-subtle rounded-xl p-6" variants={itemVariants}>
          <h4 className="heading-sm mb-4 flex items-center gap-2">
            💡 Suggestions for Improvement
          </h4>
          <ul className="space-y-2">
            {(Array.isArray(reviewData.improvement_suggestions) 
              ? reviewData.improvement_suggestions 
              : reviewData.improvement_suggestions.split(',')
            ).map((suggestion, index) => {
              const cleanSuggestion = suggestion.trim().replace(/^['"]|['"]$/g, '');
              return cleanSuggestion && cleanSuggestion !== 'N/A' ? (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-slate-300">{cleanSuggestion}</span>
                </li>
              ) : null;
            })}
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
      
      {/* Save Button */}
      <motion.div className="pt-4" variants={itemVariants}>
        {!saved ? (
          <button
            onClick={handleSaveReview}
            disabled={saving || !getAuthenticatedUser()}
            className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-200 focus-ring flex items-center justify-center gap-2 ${
              saving || !getAuthenticatedUser()
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'btn-primary hover:scale-105'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Saving Your Feedback...
              </>
            ) : !getAuthenticatedUser() ? (
              <>
                ❌ Please Log In to Save
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
              onClick={handleBackToSharing}
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

  // Sharing section component
  const SharingSection = () => (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="text-center" variants={itemVariants}>
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="heading-lg mb-4">Review Saved Successfully!</h3>
        <p className="body-lg text-slate-300">
          Help others by sharing your experience
        </p>
      </motion.div>

      {/* Sharing Options */}
      <motion.div className="space-y-4" variants={itemVariants}>
        <div className="glass-card rounded-xl p-6">
          <h4 className="heading-sm mb-4">Share on Google Reviews</h4>
          <p className="text-slate-300 mb-4 text-sm">
            Copy your review and post it on Google to help other customers
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={handleCopyToGoogle}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                copySuccess 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Copy size={18} />
              {copySuccess ? 'Copied!' : 'Copy Review Text'}
            </button>
            
            <button
              onClick={handleOpenGoogleReviews}
              className="py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <ExternalLink size={18} />
              Open Google
            </button>
          </div>
        </div>

        {/* Preview of formatted review */}
        <div className="glass-card-subtle rounded-xl p-6">
          <h5 className="text-sm font-medium text-white mb-3">Review Preview:</h5>
          <div className="bg-white/5 rounded-lg p-4 text-slate-300 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
            {formattedReviewText}
          </div>
        </div>
      </motion.div>

      {/* Back to Analysis */}
      <motion.div className="flex gap-4" variants={itemVariants}>
        <button
          onClick={() => {
            setShowSharingSection(false);
            setShowAnalysisView(true);
          }}
          className="btn-secondary flex-1 py-3 px-6 rounded-xl font-medium focus-ring"
        >
          Back to Review
        </button>
        <button
          onClick={onStartOver}
          className="btn-primary flex-1 py-3 px-6 rounded-xl font-medium focus-ring"
        >
          Write Another Review
        </button>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="glass-card rounded-2xl overflow-hidden max-w-4xl mx-auto">
      <div className="p-8">
        <AnimatePresence mode="wait">
          {showAnalysisView ? (
            <AnalysisSection key="analysis" />
          ) : showSharingSection ? (
            <SharingSection key="sharing" />
          ) : null}
        </AnimatePresence>

        {/* Points Earned Modal */}
        {showPointsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              className="bg-slate-900 rounded-xl p-6 max-w-md w-full border border-white/10"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-white mb-2">Points Earned!</h3>
                <p className="text-slate-300 mb-4">
                  You earned <span className="text-purple-400 font-bold">{pointsEarned} points</span> for your review!
                </p>
                
                <div className="bg-white/5 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Your Total Points:</span>
                    <div className="flex items-center gap-2">
                      <Zap className="text-purple-400" size={16} />
                      <span className="text-white font-bold">{currentPoints}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {formattedReviewText && (
                    <button
                      onClick={handleCopyToGoogle}
                      className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy size={18} />
                      Copy to Google Reviews (+{POINTS_CONFIG.COPY_TO_GOOGLE} point)
                    </button>
                  )}
                  
                  {googleReviewLink && (
                    <button
                      onClick={handleOpenGoogleReviews}
                      className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={18} />
                      Open Google Reviews
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowPointsModal(false)}
                    className="w-full bg-white/10 text-white px-4 py-3 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Continue
                  </button>
                  
                  <div className="text-center">
                    <button
                      onClick={() => window.location.href = '/rewards'}
                      className="text-purple-400 hover:text-purple-300 text-sm inline-flex items-center gap-1"
                    >
                      <Gift size={14} />
                      View Available Rewards
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewAnalysis;