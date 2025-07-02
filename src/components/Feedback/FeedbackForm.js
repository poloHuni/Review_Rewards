// src/components/Feedback/FeedbackForm.js - Complete Updated with Enhanced Recording Interface
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  FileText, 
  Check, 
  AlertTriangle, 
  Info, 
  Zap, 
  Gift, 
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { transcribeAudio, processAudio } from '../../services/audioService';
import { analyzeReview } from '../../services/openaiService';
import { useAuth } from '../../contexts/AuthContext';
import ReviewAnalysis from './ReviewAnalysis';

// Import points services
import { canEarnPointsToday, awardPoints, POINTS_CONFIG, getUserPoints } from '../../services/pointsService';

// Import the new enhanced recording interface
import EnhancedRecordingInterface from './EnhancedRecordingInterface';

// Define the steps as constants
const STEPS = {
  STARTING: 'starting',
  PROCESSING_AUDIO: 'processing_audio',
  TRANSCRIBING: 'transcribing', 
  ANALYZING: 'analyzing',
  COMPLETING: 'completing',
  COMPLETE: 'complete',
  ERROR: 'error'
};

const FeedbackForm = ({ restaurantId, restaurantName, placeId }) => {
  // State management
  const [step, setStep] = useState('input');
  const [reviewAnalysis, setReviewAnalysis] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(STEPS.STARTING);
  const [error, setError] = useState(null);

  // Points system state
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [canEarnToday, setCanEarnToday] = useState(true);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [generatedReview, setGeneratedReview] = useState('');
  
  // Audio/text state for processing
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [textFeedback, setTextFeedback] = useState('');
  
  // Refs
  const progressIntervalRef = useRef(null);
  
  const { currentUser } = useAuth();

  // Check if user can earn points today
  useEffect(() => {
    const checkPointsEligibility = async () => {
      if (currentUser) {
        try {
          const canEarn = await canEarnPointsToday(currentUser.uid);
          const pointsData = await getUserPoints(currentUser.uid);
          setCanEarnToday(canEarn);
          setCurrentPoints(pointsData.totalPoints);
        } catch (error) {
          console.error('Error checking points eligibility:', error);
        }
      }
    };
    
    checkPointsEligibility();
  }, [currentUser]);

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

  // Clean up function
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Processing step updater
  const updateProcessingStep = (step) => {
    setProcessingStep(step);
    
    const stepMessages = {
      [STEPS.STARTING]: 'Initializing...',
      [STEPS.PROCESSING_AUDIO]: 'Processing audio...',
      [STEPS.TRANSCRIBING]: 'Converting speech to text...',
      [STEPS.ANALYZING]: 'Analyzing your feedback...',
      [STEPS.COMPLETING]: 'Finalizing review...',
      [STEPS.COMPLETE]: 'Complete!',
      [STEPS.ERROR]: 'Error occurred'
    };
    
    console.log(stepMessages[step] || step);
  };

  // Handle audio completion from enhanced interface
  const handleAudioComplete = async (audioBlob, audioUrl) => {
    setAudioBlob(audioBlob);
    setAudioUrl(audioUrl);
    
    if (!audioBlob || audioBlob.size === 0) {
      setError('No audio recording found. Please try recording again.');
      return;
    }
    
    setStep('processing');
    setProcessing(true);
    setProcessingProgress(0);
    updateProcessingStep(STEPS.PROCESSING_AUDIO);
    
    // Progress animation
    progressIntervalRef.current = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressIntervalRef.current);
          return 90;
        }
        return prev + 2;
      });
    }, 200);
    
    try {
      setProcessingProgress(10);
      updateProcessingStep(STEPS.TRANSCRIBING);
      
      // Transcribe audio
      const transcription = await transcribeAudio(audioBlob);
      
      if (!transcription || transcription.trim().length < 10) {
        throw new Error('Could not transcribe audio clearly. Please try recording again with clearer speech.');
      }
      
      setProcessingProgress(50);
      updateProcessingStep(STEPS.ANALYZING);
      
      // Analyze the transcription
      const analysis = await analyzeReview(transcription, restaurantName);
      
      setProcessingProgress(80);
      updateProcessingStep(STEPS.COMPLETING);
      
      if (analysis) {
        // Add restaurant and audio info
        analysis.restaurant_id = restaurantId;
        analysis.restaurant_name = restaurantName;
        analysis.audio_url = audioUrl;
        analysis.transcription = transcription;
        
        setReviewAnalysis(analysis);
        setProcessingProgress(100);
        updateProcessingStep(STEPS.COMPLETE);
        
        setTimeout(() => {
          setStep('analysis');
        }, 1000);
      } else {
        createFallbackReview(transcription);
      }
      
    } catch (err) {
      console.error('Audio processing error:', err);
      setError(err.message);
      updateProcessingStep(STEPS.ERROR);
      
      // Create fallback review from raw transcription if available
      if (audioBlob) {
        try {
          const transcription = await transcribeAudio(audioBlob);
          if (transcription && transcription.trim().length > 10) {
            createFallbackReview(transcription);
          } else {
            setStep('input');
          }
        } catch (fallbackErr) {
          setStep('input');
        }
      } else {
        setStep('input');
      }
    } finally {
      setProcessing(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };

  // Handle text completion from enhanced interface
  const handleTextComplete = async (textContent) => {
    setTextFeedback(textContent);
    
    if (!textContent || textContent.trim().length < 10) {
      setError('Please provide more detailed feedback (at least 10 characters).');
      return;
    }
    
    setStep('processing');
    setProcessing(true);
    setProcessingProgress(0);
    updateProcessingStep(STEPS.ANALYZING);
    
    // Progress animation
    progressIntervalRef.current = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressIntervalRef.current);
          return 90;
        }
        return prev + 5;
      });
    }, 300);
    
    try {
      setProcessingProgress(30);
      
      // Analyze text feedback directly
      const analysis = await analyzeReview(textContent, restaurantName);
      
      setProcessingProgress(80);
      updateProcessingStep(STEPS.COMPLETING);
      
      if (analysis) {
        // Add restaurant info
        analysis.restaurant_id = restaurantId;
        analysis.restaurant_name = restaurantName;
        
        setReviewAnalysis(analysis);
        setProcessingProgress(100);
        updateProcessingStep(STEPS.COMPLETE);
        
        setTimeout(() => {
          setStep('analysis');
        }, 1000);
      } else {
        createFallbackReview(textContent);
      }
      
    } catch (err) {
      console.error('Text analysis error:', err);
      createFallbackReview(textContent);
    } finally {
      setProcessing(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };

  // Create fallback review when AI analysis fails
  const createFallbackReview = (content) => {
    const fallbackReview = {
      summary: content,
      food_quality: "Good experience overall",
      service: "Service was satisfactory", 
      atmosphere: "Pleasant atmosphere",
      music_and_entertainment: "Enjoyable environment",
      specific_points: ["Enjoyed the meal", "Service was timely", "Good atmosphere"],
      sentiment_score: 4,
      improvement_suggestions: ["Keep up the good work"],
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      audio_url: audioUrl,
      transcription: content
    };
    
    setReviewAnalysis(fallbackReview);
    setProcessingProgress(100);
    updateProcessingStep(STEPS.COMPLETE);
    
    setTimeout(() => {
      setStep('analysis');
    }, 1000);
  };

  // Handle feedback submission with points
  const handleSubmitFeedback = async (reviewData) => {
    try {
      console.log('Submitting review:', reviewData);
      
      // Store the generated review text for copy function
      setGeneratedReview(reviewData.summary || '');
      
      // Award points if user can earn today
      let earnedPoints = 0;
      if (canEarnToday && currentUser) {
        try {
          const success = await awardPoints(currentUser.uid, POINTS_CONFIG.SAVE_FEEDBACK, 'save_feedback');
          if (success) {
            earnedPoints = POINTS_CONFIG.SAVE_FEEDBACK;
            setPointsEarned(earnedPoints);
            
            // Update current points display
            const pointsData = await getUserPoints(currentUser.uid);
            setCurrentPoints(pointsData.totalPoints);
            
            // Show points modal
            setShowPointsModal(true);
          }
        } catch (pointsError) {
          console.error('Points error (non-critical):', pointsError);
        }
      }
      
      return {
        success: true,
        pointsEarned: earnedPoints
      };
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  // Handle Google Review copy with bonus points
  const handleCopyToGoogle = async () => {
    try {
      // Copy review to clipboard
      await navigator.clipboard.writeText(generatedReview);
      
      // Award additional points if eligible
      if (canEarnToday && currentUser && pointsEarned > 0) {
        try {
          const success = await awardPoints(currentUser.uid, POINTS_CONFIG.COPY_TO_GOOGLE, 'copy_to_google');
          if (success) {
            const extraPoints = POINTS_CONFIG.COPY_TO_GOOGLE;
            setPointsEarned(prev => prev + extraPoints);
            
            // Update current points display
            const pointsData = await getUserPoints(currentUser.uid);
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
      
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy review to clipboard');
    }
  };

  // Start over function
  const handleStartOver = () => {
    setStep('input');
    setTextFeedback('');
    setReviewAnalysis(null);
    setError(null);
    setProcessingProgress(0);
    setProcessing(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setShowPointsModal(false);
    setPointsEarned(0);
  };

  // Progress steps renderer
  const renderProgressSteps = () => {
    const steps = [
      { id: 'input', label: 'Input', icon: Mic },
      { id: 'processing', label: 'Processing', icon: Info },
      { id: 'analysis', label: 'Review', icon: Check }
    ];

    return (
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between relative">
          {steps.map((s, index) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    step === s.id || (step === 'analysis' && s.id !== 'input')
                      ? 'bg-blue-500 text-white shadow-lg scale-110'
                      : step === 'processing' && s.id === 'input'
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  <s.icon size={16} />
                </div>
                <span className={`text-xs font-medium transition-colors ${
                  step === s.id ? 'text-white' : 'text-slate-400'
                }`}>
                  {s.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div 
                  className={`flex-1 h-0.5 transition-colors duration-500 ${
                    step === 'analysis' || (step === 'processing' && s.id === 'input')
                      ? 'bg-green-500'
                      : step === 'processing' && s.id === 'input'
                        ? 'bg-blue-500'
                        : 'bg-slate-700'
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Points earned modal
  const renderPointsModal = () => (
    <AnimatePresence>
      {showPointsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            className="glass-card-enhanced rounded-2xl p-8 max-w-md w-full border border-purple-500/30"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                  <Zap className="text-white" size={32} />
                </motion.div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                Points Earned!
              </h3>
              
              <p className="text-lg text-gray-300 mb-6">
                You earned <span className="font-bold text-purple-400">+{pointsEarned} points</span> for sharing your review!
              </p>
              
              <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Your Total Points:</span>
                  <div className="flex items-center gap-2">
                    <Zap className="text-purple-400" size={16} />
                    <span className="text-white font-bold">{currentPoints}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {generatedReview && (
                  <button
                    onClick={handleCopyToGoogle}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
                  >
                    <Copy size={18} />
                    Copy to Google Reviews (+{POINTS_CONFIG.COPY_TO_GOOGLE} point)
                  </button>
                )}
                
                <button
                  onClick={() => setShowPointsModal(false)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 border border-white/20"
                >
                  Continue
                </button>
                
                <div className="text-center">
                  <button
                    onClick={() => window.location.href = '/rewards'}
                    className="text-purple-400 hover:text-purple-300 text-sm inline-flex items-center gap-1 transition-colors"
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
    </AnimatePresence>
  );

  // Processing screen
  if (step === 'processing') {
    return (
      <>
        <motion.div 
          className="glass-card-enhanced rounded-3xl overflow-hidden max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {renderProgressSteps()}
          
          <div className="p-12 text-center">
            <motion.div 
              className="w-32 h-32 mx-auto mb-8 rounded-full border-4 border-purple-200/20 border-t-purple-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              variants={itemVariants}
            />
            
            <motion.div className="space-y-6" variants={itemVariants}>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Processing Your Feedback
              </h3>
              <p className="text-xl text-gray-300">
                {processingStep === STEPS.STARTING && '🚀 Getting ready to process...'}
                {processingStep === STEPS.PROCESSING_AUDIO && '🎵 Processing your audio recording...'}
                {processingStep === STEPS.TRANSCRIBING && '📝 Converting speech to text...'}
                {processingStep === STEPS.ANALYZING && '🤖 Analyzing your feedback with AI...'}
                {processingStep === STEPS.COMPLETING && '✨ Finalizing your review...'}
                {processingStep === STEPS.COMPLETE && '🎉 Complete!'}
              </p>
              
              <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              
              <p className="text-lg text-gray-400">{processingProgress}% complete</p>
            </motion.div>
          </div>
        </motion.div>
        {renderPointsModal()}
      </>
    );
  }

  // Analysis screen
  if (step === 'analysis' && reviewAnalysis) {
    return (
      <>
        <ReviewAnalysis 
          reviewData={reviewAnalysis}
          onSave={handleSubmitFeedback}
          onStartOver={handleStartOver}
        />
        {renderPointsModal()}
      </>
    );
  }

  // Error screen
  if (error) {
    return (
      <motion.div 
        className="glass-card-enhanced rounded-3xl overflow-hidden max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="p-12 text-center">
          <motion.div variants={itemVariants}>
            <AlertTriangle className="w-20 h-20 text-red-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h3>
            <p className="text-gray-300 mb-8">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleStartOver}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 transform hover:scale-105"
              >
                <RefreshCw size={18} />
                Try Again
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Input screen with enhanced recording interface
  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Points Status Banner */}
        {currentUser && (
          <motion.div 
            className="max-w-4xl mx-auto mb-8"
            variants={itemVariants}
          >
            <div className="glass-card-enhanced rounded-2xl p-6 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Zap className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">Your Points: {currentPoints}</p>
                    <p className="text-gray-300 text-sm">
                      {canEarnToday 
                        ? `Earn +${POINTS_CONFIG.SAVE_FEEDBACK} points for this review!`
                        : 'Daily review limit reached. Come back tomorrow!'
                      }
                    </p>
                  </div>
                </div>
                <a 
                  href="/rewards"
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 border border-white/20"
                >
                  <Gift size={16} />
                  Rewards
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Recording Interface */}
        <motion.div variants={itemVariants}>
          <EnhancedRecordingInterface 
            onAudioComplete={handleAudioComplete}
            onTextComplete={handleTextComplete}
            restaurantName={restaurantName || 'this restaurant'}
          />
        </motion.div>
      </motion.div>
      {renderPointsModal()}
    </>
  );
};

export default FeedbackForm;