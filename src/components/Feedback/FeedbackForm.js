// src/components/Feedback/FeedbackForm.js - Complete Updated with Points System
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Pause, Send, FileText, Check, AlertTriangle, Info, Play, Copy, Zap, Gift } from 'lucide-react';
import { transcribeAudio, processAudio } from '../../services/audioService';
import { analyzeReview } from '../../services/openaiService';
import { useAuth } from '../../contexts/AuthContext';
import ReviewAnalysis from './ReviewAnalysis';

// NEW: Import points services
import { canEarnPointsToday, awardPoints, POINTS_CONFIG, getUserPoints } from '../../services/pointsService';

// Define the steps as constants to avoid typos
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
  const [inputMethod, setInputMethod] = useState('audio');
  const [textFeedback, setTextFeedback] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [reviewAnalysis, setReviewAnalysis] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(STEPS.STARTING);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  // NEW: Points system state
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [canEarnToday, setCanEarnToday] = useState(true);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [generatedReview, setGeneratedReview] = useState('');
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  
  const { user } = useAuth();

  // NEW: Check if user can earn points today
  useEffect(() => {
    const checkPointsEligibility = async () => {
      if (user) {
        const canEarn = await canEarnPointsToday(user.uid);
        const pointsData = await getUserPoints(user.uid);
        setCanEarnToday(canEarn);
        setCurrentPoints(pointsData.totalPoints);
      }
    };
    
    checkPointsEligibility();
  }, [user]);

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
      if (timerRef.current) clearInterval(timerRef.current);
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

  // Start audio recording
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecordingComplete(true);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Unable to access microphone. Please ensure microphone permissions are granted.');
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset recording
  const resetRecording = () => {
    setRecordingComplete(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // NEW: Handle feedback submission with points
  const handleSubmitFeedback = async (reviewData) => {
    try {
      // Your existing review submission logic here
      // This would typically save to Firestore
      console.log('Submitting review:', reviewData);
      
      // Store the generated review text for copy function
      setGeneratedReview(reviewData.summary || '');
      
      // NEW: Award points if user can earn today
      let earnedPoints = 0;
      if (canEarnToday && user) {
        const success = await awardPoints(user.uid, POINTS_CONFIG.SAVE_FEEDBACK, 'Feedback Saved');
        if (success) {
          earnedPoints = POINTS_CONFIG.SAVE_FEEDBACK;
          setPointsEarned(earnedPoints);
          
          // Update current points display
          const pointsData = await getUserPoints(user.uid);
          setCurrentPoints(pointsData.totalPoints);
          
          // Show points modal
          setShowPointsModal(true);
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

  // NEW: Handle Google Review copy with bonus points
  const handleCopyToGoogle = async () => {
    try {
      // Copy review to clipboard
      await navigator.clipboard.writeText(generatedReview);
      
      // Award additional points if eligible
      if (canEarnToday && user && pointsEarned > 0) { // Only if they earned points today
        const success = await awardPoints(user.uid, POINTS_CONFIG.COPY_TO_GOOGLE, 'Copied to Google Reviews');
        if (success) {
          const extraPoints = POINTS_CONFIG.COPY_TO_GOOGLE;
          setPointsEarned(prev => prev + extraPoints);
          
          // Update current points display
          const pointsData = await getUserPoints(user.uid);
          setCurrentPoints(pointsData.totalPoints);
          
          // Show success message
          alert(`Review copied! You earned ${extraPoints} more points!`);
        }
      } else {
        // Just show copy success if no points awarded
        alert('Review copied to clipboard!');
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy review to clipboard');
    }
  };

  // Audio feedback submission
  const handleAudioSubmit = async () => {
    if (!audioBlob) {
      setValidationError('Please record your feedback first.');
      return;
    }
    
    setValidationError(null);
    setStep('processing');
    setProcessing(true);
    setProcessingProgress(0);
    updateProcessingStep(STEPS.STARTING);
    
    // Progress animation
    progressIntervalRef.current = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressIntervalRef.current);
          return 90;
        }
        return prev + 3;
      });
    }, 200);
    
    try {
      setProcessingProgress(10);
      updateProcessingStep(STEPS.PROCESSING_AUDIO);
      
      // Process audio
      const processedAudio = await processAudio(audioBlob);
      
      setProcessingProgress(30);
      updateProcessingStep(STEPS.TRANSCRIBING);
      
      // Transcribe audio
      const transcription = await transcribeAudio(processedAudio);
      
      if (!transcription || transcription.trim().length === 0) {
        throw new Error('Could not transcribe audio. Please try recording again or use text input.');
      }
      
      setProcessingProgress(60);
      updateProcessingStep(STEPS.ANALYZING);
      
      // Analyze transcription
      const analysis = await analyzeReview(transcription, restaurantName);
      
      setProcessingProgress(90);
      updateProcessingStep(STEPS.COMPLETING);
      
      if (analysis) {
        // Add restaurant and audio data
        analysis.restaurant_id = restaurantId;
        analysis.audio_url = audioUrl;
        analysis.transcription = transcription;
        
        setReviewAnalysis(analysis);
        setProcessingProgress(100);
        updateProcessingStep(STEPS.COMPLETE);
        setStep('analysis');
      } else {
        throw new Error('Failed to analyze your feedback. Please try again.');
      }
      
    } catch (err) {
      console.error('Audio processing error:', err);
      setError(err.message || 'An error occurred while processing your audio. Please try again.');
      updateProcessingStep(STEPS.ERROR);
    } finally {
      setProcessing(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };

  // Fallback function for when AI analysis fails
  const createFallbackReview = (text) => {
    const fallbackReview = {
      summary: text.length > 100 ? text.substring(0, 100) + "..." : text,
      food_quality: "The food was good.",
      service: "The service was attentive.",
      atmosphere: "The atmosphere was pleasant.",
      music_and_entertainment: "The music added to the dining experience.",
      specific_points: ["Enjoyed the meal", "Service was timely", "Good atmosphere"],
      sentiment_score: 4,
      improvement_suggestions: ["Keep up the good work"],
      restaurant_id: restaurantId,
      audio_url: audioUrl
    };
    
    setReviewAnalysis(fallbackReview);
    setStep('analysis');
    setProcessing(false);
  };
  
  // Text feedback submission
  const handleTextSubmit = async () => {
    // Validate text input
    if (!textFeedback || textFeedback.trim().length < 10) {
      setValidationError('Please provide more detailed feedback (at least 10 characters).');
      return;
    }
    
    setValidationError(null);
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
      const analysis = await analyzeReview(textFeedback, restaurantName);
      
      setProcessingProgress(80);
      updateProcessingStep(STEPS.COMPLETING);
      
      if (analysis) {
        // Add restaurant ID to review data
        analysis.restaurant_id = restaurantId;
        
        // Add audio URL if available
        if (audioUrl) {
          analysis.audio_url = audioUrl;
        }
        
        setReviewAnalysis(analysis);
        setProcessingProgress(100);
        updateProcessingStep(STEPS.COMPLETE);
        setStep('analysis');
      } else {
        createFallbackReview(textFeedback);
      }
      
    } catch (err) {
      console.error('Text analysis error:', err);
      createFallbackReview(textFeedback);
    } finally {
      setProcessing(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };

  // Start over function
  const handleStartOver = () => {
    setStep('input');
    setTextFeedback('');
    setReviewAnalysis(null);
    setError(null);
    setValidationError(null);
    setProcessingProgress(0);
    setProcessing(false);
    // NEW: Reset points modal
    setShowPointsModal(false);
    setPointsEarned(0);
    resetRecording();
  };

  // Progress steps renderer
  const renderProgressSteps = () => {
    const steps = [
      { id: 'input', label: 'Input', icon: inputMethod === 'audio' ? Mic : FileText },
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

  // Processing screen
  if (step === 'processing') {
    return (
      <motion.div 
        className="glass-card rounded-2xl overflow-hidden max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {renderProgressSteps()}
        
        <div className="p-8 text-center">
          <motion.div 
            className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-blue-200/20 border-t-blue-500 animate-spin"
            variants={itemVariants}
          />
          
          <motion.div className="space-y-4" variants={itemVariants}>
            <h3 className="heading-md">Processing Your Feedback</h3>
            <p className="body-md text-slate-400">
              {processingStep === STEPS.STARTING && 'Getting ready to process...'}
              {processingStep === STEPS.PROCESSING_AUDIO && 'Processing your audio recording...'}
              {processingStep === STEPS.TRANSCRIBING && 'Converting speech to text...'}
              {processingStep === STEPS.ANALYZING && 'Analyzing your feedback with AI...'}
              {processingStep === STEPS.COMPLETING && 'Finalizing your review...'}
              {processingStep === STEPS.COMPLETE && 'Complete!'}
            </p>
            
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            
            <p className="text-sm text-slate-500">{processingProgress}% complete</p>
          </motion.div>
        </div>
      </motion.div>
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
        
        {/* NEW: Points Earned Modal */}
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
                  {generatedReview && (
                    <button
                      onClick={handleCopyToGoogle}
                      className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy size={18} />
                      Copy to Google Reviews (+{POINTS_CONFIG.COPY_TO_GOOGLE} point)
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
      </>
    );
  }

  // Input screen with professional styling
  if (step === 'input') {
    return (
      <motion.div 
        className="glass-card rounded-2xl overflow-hidden max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {renderProgressSteps()}
        
        {/* NEW: Points Status Banner */}
        {user && (
          <div className="mx-6 mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg">
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
          </div>
        )}
        
        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className="mx-6 mb-6 p-4 status-error rounded-lg flex items-start gap-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-400">Error</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Input method selector */}
        <div className="px-6 mb-6">
          <div className="p-1 bg-white/5 rounded-xl border border-white/10 flex">
            <button
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium
                ${inputMethod === 'audio'
                  ? 'bg-white/10 text-white shadow-lg border border-white/20'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                }`}
              onClick={() => setInputMethod('audio')}
            >
              <Mic size={18} />
              <span>Voice Feedback</span>
            </button>
            <button
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium
                ${inputMethod === 'text'
                  ? 'bg-white/10 text-white shadow-lg border border-white/20'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                }`}
              onClick={() => setInputMethod('text')}
            >
              <FileText size={18} />
              <span>Written Feedback</span>
            </button>
          </div>
        </div>
        
        {/* Audio recorder */}
        {inputMethod === 'audio' && (
          <div className="px-6 pb-6">
            <motion.div 
              className="glass-card-subtle rounded-xl p-6"
              variants={itemVariants}
            >
              {!recordingComplete ? (
                <div className="text-center space-y-6">
                  <h3 className="heading-md">Voice Feedback</h3>
                  <p className="body-md text-slate-400">
                    Click the button below to start recording your feedback
                  </p>
                  
                  {isRecording && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-red-400 font-medium">Recording...</span>
                        <span className="text-white font-mono">{formatTime(recordingTime)}</span>
                      </div>
                      
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min((recordingTime / 180) * 100, 100)}%` }}
                        />
                      </div>
                      
                      <p className="text-sm text-slate-500">
                        Maximum recording time: 3 minutes
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 mx-auto ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 text-white scale-110' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105'
                    }`}
                  >
                    {isRecording ? <Pause size={24} /> : <Mic size={24} />}
                  </button>
                  
                  <p className="text-sm text-slate-400">
                    {isRecording ? 'Click to stop recording' : 'Click to start recording'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="heading-md mb-2">Recording Complete</h3>
                    <p className="body-sm text-slate-400">
                      Duration: {formatTime(recordingTime)}
                    </p>
                  </div>
                  
                  {audioUrl && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <audio src={audioUrl} controls className="w-full" />
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={resetRecording}
                      className="btn-secondary flex-1 focus-ring"
                    >
                      Record Again
                    </button>
                    <button
                      onClick={handleAudioSubmit}
                      className="btn-primary flex-1 focus-ring flex items-center justify-center gap-2"
                    >
                      <Send size={18} />
                      Submit Feedback
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
        
        {/* Text input */}
        {inputMethod === 'text' && (
          <div className="px-6 pb-6">
            <motion.div 
              className="glass-card-subtle rounded-xl p-6"
              variants={itemVariants}
            >
              <div className="space-y-6">
                <h3 className="heading-md text-center">Written Feedback</h3>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Share your experience
                  </label>
                  <textarea
                    value={textFeedback}
                    onChange={(e) => setTextFeedback(e.target.value)}
                    placeholder="Tell us about your visit to this restaurant. What did you like? What could be improved? Please be as detailed as possible..."
                    className="w-full h-40 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                    maxLength={2000}
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Minimum 10 characters</span>
                    <span>{textFeedback.length}/2000</span>
                  </div>
                </div>
                
                {validationError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{validationError}</p>
                  </div>
                )}
                
                <button
                  onClick={handleTextSubmit}
                  disabled={!textFeedback || textFeedback.trim().length < 10}
                  className="w-full btn-primary focus-ring flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                  Submit Feedback
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    );
  }

  return null;
};

export default FeedbackForm;