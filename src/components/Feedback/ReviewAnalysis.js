// src/components/Feedback/ReviewAnalysis.js
// Complete updated file with enhanced authentication and Firestore fixes

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
  Gift,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  saveReview, 
  generateGoogleReviewLink, 
  formatReviewForSharing,
  testReviewPermissions
} from '../../services/reviewService';

// Points system imports
import { 
  canEarnPointsToday, 
  awardPoints, 
  POINTS_CONFIG, 
  getUserPoints 
} from '../../services/pointsService';

// Firebase auth imports for enhanced debugging
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

  // Enhanced authentication state
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

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

  // Enhanced Firebase auth listener
  useEffect(() => {
    console.log('🔍 Setting up enhanced Firebase auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔥 Firebase Auth State Changed:', {
        user: !!user,
        uid: user?.uid,
        email: user?.email,
        displayName: user?.displayName,
        emailVerified: user?.emailVerified
      });
      
      setFirebaseUser(user);
      setAuthLoading(false);
      
      if (!user) {
        setAuthError('No authenticated user found');
      } else {
        setAuthError(null);
      }
    });

    return () => {
      console.log('🔍 Cleaning up Firebase auth listener');
      unsubscribe();
    };
  }, []);

  // Enhanced authentication debugging
  useEffect(() => {
    console.log('🔍 ========== ENHANCED AUTH DEBUG ==========');
    console.log('1. useAuth user:', user);
    console.log('2. useAuth user exists:', !!user);
    console.log('3. useAuth user UID:', user?.uid);
    console.log('4. useAuth user email:', user?.email);
    
    console.log('5. Firebase user:', firebaseUser);
    console.log('6. Firebase user exists:', !!firebaseUser);
    console.log('7. Firebase user UID:', firebaseUser?.uid);
    
    console.log('8. auth.currentUser:', auth.currentUser);
    console.log('9. auth.currentUser UID:', auth.currentUser?.uid);
    
    console.log('10. Auth loading:', authLoading);
    console.log('11. Auth error:', authError);
    
    if (user) {
      console.log('12. useAuth user keys:', Object.keys(user));
    }
    
    if (firebaseUser) {
      console.log('13. Firebase user keys:', Object.keys(firebaseUser));
    }
    
    console.log('========== END ENHANCED AUTH DEBUG ==========');
  }, [user, firebaseUser, authLoading, authError]);

  // Enhanced user authentication function
  const getAuthenticatedUser = () => {
    console.log('🔍 Getting authenticated user with enhanced logic...');
    
    // Priority order: Firebase Auth (most reliable) > useAuth > auth.currentUser
    const userSources = [
      { name: 'firebase', user: firebaseUser },
      { name: 'useAuth', user: user },
      { name: 'currentUser', user: auth.currentUser }
    ];
    
    for (const source of userSources) {
      console.log(`Checking ${source.name}:`, {
        exists: !!source.user,
        uid: source.user?.uid,
        email: source.user?.email
      });
      
      if (source.user && source.user.uid && typeof source.user.uid === 'string') {
        console.log(`✅ Using authenticated user from ${source.name}:`, source.user.uid);
        return source.user;
      }
    }
    
    console.error('❌ No valid authenticated user found from any source');
    console.error('All sources:', userSources.map(s => ({ name: s.name, hasUser: !!s.user, hasUid: !!s.user?.uid })));
    return null;
  };

  // Enhanced points and sharing initialization
  useEffect(() => {
    const initializePointsAndSharing = async () => {
      console.log('🔍 Initializing points and sharing...');
      
      if (authLoading) {
        console.log('⏳ Auth still loading, skipping initialization');
        return;
      }
      
      const authenticatedUser = getAuthenticatedUser();
      
      if (authenticatedUser && reviewData) {
        try {
          console.log('✅ User and review data found, initializing...');
          
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
        console.log('⚠️ Skipping points initialization:', {
          hasUser: !!authenticatedUser,
          hasReviewData: !!reviewData,
          authLoading
        });
      }
    };
    
    initializePointsAndSharing();
  }, [user, firebaseUser, reviewData, authLoading]);

  // Enhanced save review function
  const handleSaveReview = async () => {
    try {
      console.log('🔍 ========== ENHANCED SAVE DEBUG - Starting ==========');
      console.log('Save button clicked at:', new Date().toISOString());
      
      // Check if auth is still loading
      if (authLoading) {
        console.log('⏳ Authentication still loading...');
        alert('Authentication is still loading. Please wait a moment and try again.');
        return;
      }
      
      const authenticatedUser = getAuthenticatedUser();
      
      console.log('Authentication check results:');
      console.log('- Selected user:', authenticatedUser);
      console.log('- User UID:', authenticatedUser?.uid);
      console.log('- User email:', authenticatedUser?.email);
      
      if (!authenticatedUser) {
        console.error('❌ NO AUTHENTICATED USER FOUND!');
        console.error('Detailed auth state:');
        console.error('- useAuth user:', user);
        console.error('- Firebase user:', firebaseUser);
        console.error('- auth.currentUser:', auth.currentUser);
        console.error('- Auth loading:', authLoading);
        console.error('- Auth error:', authError);
        
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
      
      // Validate review data
      if (!reviewData) {
        console.error('❌ Review data missing');
        alert('Review data is missing. Please try recording your review again.');
        return;
      }
      
      // Check required fields
      if (!reviewData.summary || reviewData.summary.trim() === '') {
        console.error('❌ Review summary missing');
        alert('Review summary is required. Please ensure you have recorded a complete review.');
        return;
      }
      
      console.log('✅ Review data validated');
      console.log('Review data to save:', reviewData);
      
      setSaving(true);
      
      console.log('🔍 Calling saveReview service...');
      
      // Save the review using the authenticated user
      const result = await saveReview(reviewData, authenticatedUser);
      
      console.log('Save result:', result);
      
      if (result.success) {
        console.log('✅ Review saved successfully! ID:', result.id);
        setSaved(true);
        setShowSharingSection(true);
        
        // Award points if eligible
        if (canEarnToday) {
          try {
            console.log('🎁 Awarding points...');
            const pointsAwarded = await awardPoints(
              authenticatedUser.uid, 
              POINTS_CONFIG.SAVE_FEEDBACK, 
              'save_feedback'
            );
            
            if (pointsAwarded) {
              setPointsEarned(POINTS_CONFIG.SAVE_FEEDBACK);
              setCurrentPoints(prev => prev + POINTS_CONFIG.SAVE_FEEDBACK);
              setShowPointsModal(true);
              console.log('✅ Points awarded successfully');
            }
          } catch (pointsError) {
            console.error('❌ Points error (non-critical):', pointsError);
          }
        }
        
        if (onSave) {
          onSave(result);
        }
        
        // Show success message
        alert('Review saved successfully!');
        
      } else {
        throw new Error('Save operation returned unsuccessful result');
      }
      
    } catch (saveError) {
      console.error('❌ Save operation failed:', saveError);
      
      // Enhanced error messaging based on error type
      let userMessage = 'Failed to save review. ';
      
      if (saveError.message.includes('permission-denied')) {
        userMessage += 'Permission denied. This usually means:\n';
        userMessage += '1. You need to log in again\n';
        userMessage += '2. Firestore security rules need updating\n';
        userMessage += '3. Your session has expired\n\n';
        userMessage += 'Please log out and log back in.';
      } else if (saveError.message.includes('unauthenticated')) {
        userMessage += 'You are not authenticated. Please log in and try again.';
      } else if (saveError.message.includes('network') || saveError.message.includes('offline')) {
        userMessage += 'Network error. Please check your internet connection and try again.';
      } else if (saveError.message.includes('invalid-argument')) {
        userMessage += 'Invalid data format. Please try recording your review again.';
      } else {
        userMessage += 'Error: ' + saveError.message;
      }
      
      alert(userMessage);
    } finally {
      setSaving(false);
      console.log('🔍 ========== SAVE DEBUG - Complete ==========');
    }
  };

  // Test connection function
  const testFirestoreConnection = async () => {
    try {
      console.log('🧪 Testing Firestore connection...');
      
      const authenticatedUser = getAuthenticatedUser();
      
      if (!authenticatedUser) {
        alert('❌ No authenticated user found. Please log in first.');
        return;
      }
      
      console.log('Testing with user:', authenticatedUser.uid);
      
      const result = await testReviewPermissions(authenticatedUser);
      
      if (result.success) {
        alert('✅ Firestore connection test PASSED! You should be able to save reviews.');
        console.log('✅ Test passed:', result.message);
      } else {
        alert('❌ Firestore test FAILED: ' + result.message);
      }
      
    } catch (error) {
      console.error('❌ Test error:', error);
      alert('❌ Test failed: ' + error.message);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      
      // Award points for copying to Google
      const authenticatedUser = getAuthenticatedUser();
      if (authenticatedUser && canEarnToday) {
        try {
          await awardPoints(authenticatedUser.uid, POINTS_CONFIG.COPY_TO_GOOGLE, 'copy_to_google');
          console.log('✅ Copy points awarded');
        } catch (error) {
          console.error('Copy points error:', error);
        }
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy to clipboard');
    }
  };

  // Render sentiment score stars
  const renderSentimentStars = (score) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${
              star <= score
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {score}/5
        </span>
      </div>
    );
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <RefreshCw className="animate-spin mx-auto mb-4 text-blue-500" size={32} />
        <p className="body-md text-gray-600">Loading authentication...</p>
      </div>
    );
  }

  // Auth error state
  if (authError && !getAuthenticatedUser()) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 text-red-500" size={32} />
        <h3 className="heading-sm mb-4 text-red-600">Authentication Required</h3>
        <p className="body-md text-gray-600 mb-6">
          You must be logged in to save reviews. Please log in and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary focus-ring"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Analysis View */}
      <AnimatePresence mode="wait">
        {showAnalysisView && (
          <motion.div
            className="glass-card rounded-2xl p-8"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Star className="text-white" size={24} />
              </div>
              <div>
                <h2 className="heading-md">Review Analysis</h2>
                <p className="body-sm text-gray-600">
                  AI-powered insights from your feedback
                </p>
              </div>
            </div>

            {/* Summary */}
            <motion.div className="mb-6" variants={itemVariants}>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Summary</h3>
              <p className="body-md text-gray-700 leading-relaxed">
                {reviewData?.summary || 'No summary available'}
              </p>
            </motion.div>

            {/* Sentiment Score */}
            <motion.div className="mb-6" variants={itemVariants}>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Overall Rating</h3>
              {renderSentimentStars(reviewData?.sentiment_score || 0)}
            </motion.div>

            {/* Category Ratings */}
            <motion.div className="mb-6" variants={itemVariants}>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Category Breakdown</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { key: 'food_quality', label: 'Food Quality' },
                  { key: 'service', label: 'Service' },
                  { key: 'atmosphere', label: 'Atmosphere' },
                  { key: 'music_and_entertainment', label: 'Music & Entertainment' }
                ].map(({ key, label }) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">{label}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {reviewData?.[key] || 'No feedback provided'}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Specific Points */}
            {reviewData?.specific_points && reviewData.specific_points.length > 0 && (
              <motion.div className="mb-6" variants={itemVariants}>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Key Points</h3>
                <div className="space-y-2">
                  {reviewData.specific_points.map((point, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <p className="body-sm text-gray-700">{point}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Improvement Suggestions */}
            {reviewData?.improvement_suggestions && reviewData.improvement_suggestions.length > 0 && (
              <motion.div className="mb-8" variants={itemVariants}>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Suggestions for Improvement</h3>
                <div className="space-y-2">
                  {reviewData.improvement_suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <p className="body-sm text-gray-700">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200"
              variants={itemVariants}
            >
              <button
                onClick={handleSaveReview}
                disabled={saving || saved || !getAuthenticatedUser()}
                className={`
                  flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 focus-ring
                  ${saved 
                    ? 'bg-green-500 text-white cursor-default' 
                    : saving 
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : !getAuthenticatedUser()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
                  }
                `}
              >
                {saving ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <Check size={20} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Save Review
                    {canEarnToday && (
                      <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                        +{POINTS_CONFIG.SAVE_FEEDBACK} pts
                      </span>
                    )}
                  </>
                )}
              </button>

              <button
                onClick={onStartOver}
                className="flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 focus-ring"
              >
                <RotateCcw size={20} />
                Start Over
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sharing Section */}
      <AnimatePresence>
        {showSharingSection && (
          <motion.div
            className="glass-card rounded-2xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <Share2 className="text-white" size={24} />
              </div>
              <div>
                <h2 className="heading-md">Share Your Review</h2>
                <p className="body-sm text-gray-600">
                  Help others discover this restaurant
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Google Reviews */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <ExternalLink className="text-blue-500" size={24} />
                  <h3 className="text-lg font-semibold">Post on Google Reviews</h3>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 mb-4">
                    Your review text (click to copy):
                  </p>
                  <div 
                    className="bg-white border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => copyToClipboard(formattedReviewText)}
                  >
                    <p className="text-sm whitespace-pre-wrap">{formattedReviewText}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => copyToClipboard(formattedReviewText)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors focus-ring"
                  >
                    <Copy size={16} />
                    {copySuccess ? 'Copied!' : 'Copy Text'}
                    {canEarnToday && (
                      <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                        +{POINTS_CONFIG.COPY_TO_GOOGLE} pt
                      </span>
                    )}
                  </button>
                  
                  <a
                    href={googleReviewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus-ring"
                  >
                    <ExternalLink size={16} />
                    Open Google Reviews
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Points Modal */}
      <AnimatePresence>
        {showPointsModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPointsModal(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 max-w-md w-full"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="text-white" size={32} />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Points Earned!
                </h3>
                
                <p className="text-lg text-gray-600 mb-4">
                  You earned <span className="font-bold text-blue-600">+{pointsEarned} points</span> for saving your review!
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">
                    Total Points: <span className="font-bold text-gray-800">{currentPoints}</span>
                  </p>
                </div>
                
                <button
                  onClick={() => setShowPointsModal(false)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 focus-ring"
                >
                  Awesome!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ReviewAnalysis;