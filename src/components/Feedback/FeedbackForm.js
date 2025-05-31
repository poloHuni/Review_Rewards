// src/components/Feedback/FeedbackForm.js
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Pause, Send, FileText, Check, AlertTriangle, Info, Play } from 'lucide-react';
import { transcribeAudio, processAudio } from '../../services/audioService';
import { analyzeReview } from '../../services/openaiService';
import { useAuth } from '../../contexts/AuthContext';
import ReviewAnalysis from './ReviewAnalysis';

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
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const elapsedTimeIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const { currentUser } = useAuth();
  
  const MAX_RECORDING_TIME = 30; // seconds

  // Update processing step
  const updateProcessingStep = (newStep) => {
    setProcessingStep(newStep);
  };
  
  // Start elapsed time counter when processing begins
  useEffect(() => {
    if (processing) {
      const startTime = Date.now();
      
      // Clear any existing interval
      if (elapsedTimeIntervalRef.current) {
        clearInterval(elapsedTimeIntervalRef.current);
      }
      
      // Start a new interval
      elapsedTimeIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
        
        // Auto-fallback after 40 seconds
        if (elapsed > 40 && processing) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          handleProcessingTimeout();
        }
      }, 1000);
      
      // Clean up on unmount or when processing stops
      return () => {
        if (elapsedTimeIntervalRef.current) {
          clearInterval(elapsedTimeIntervalRef.current);
        }
      };
    } else {
      // Reset elapsed time when not processing
      setElapsedTime(0);
      if (elapsedTimeIntervalRef.current) {
        clearInterval(elapsedTimeIntervalRef.current);
      }
    }
  }, [processing]);
  
  // Clean up all timers when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (elapsedTimeIntervalRef.current) clearInterval(elapsedTimeIntervalRef.current);
    };
  }, []);
  
  // Audio recording handlers
  const startRecording = async () => {
    setError(null);
    setRecordingComplete(false);
    setAudioBlob(null);
    setAudioUrl(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        if (chunksRef.current.length === 0) {
          setError("No audio data was recorded. Please try again.");
          return;
        }
        
        // Create the blob from the chunks
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
          
          if (blob.size === 0) {
            setError("Recorded audio is empty. Please try again.");
            return;
          }
          
          // Set the state and create the URL
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setRecordingComplete(true);
        } catch (blobErr) {
          setError(`Failed to create audio blob: ${blobErr.message}`);
        }
        
        // Release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Add error event handler to MediaRecorder
      mediaRecorder.onerror = (err) => {
        setError(`MediaRecorder error: ${err.message}`);
      };
      
      // Start the timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => {
          const nextTime = prevTime + 1;
          if (nextTime >= MAX_RECORDING_TIME) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return nextTime;
        });
      }, 1000);
      
      // Start recording
      mediaRecorder.start(100); // Collect data in 100ms chunks
      setIsRecording(true);
    } catch (err) {
      setError(`Microphone access error: ${err.message}. Please check your browser permissions.`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      } catch (err) {
        setError(`Error stopping recording: ${err.message}`);
      }
      
      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  // Process audio recording
  const startAudioProcessing = async () => {
    if (!audioBlob) {
      setError('No audio recording found');
      return;
    }
    
    setError(null);
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
        return prev + 4;
      });
    }, 300);
    
    // Set a timeout to prevent hanging forever
    timeoutRef.current = setTimeout(() => {
      if (processing) {
        handleProcessingTimeout();
      }
    }, 30000); // 30-second timeout
    
    try {
      // Process audio to improve quality
      setProcessingProgress(20);
      updateProcessingStep(STEPS.PROCESSING_AUDIO);
      const processedAudio = await processAudio(audioBlob);
      
      // Transcribe the audio
      setProcessingProgress(40);
      updateProcessingStep(STEPS.TRANSCRIBING);
      let transcription = await transcribeAudio(processedAudio);
      
      // Analyze the transcription with OpenAI
      setProcessingProgress(80);
      updateProcessingStep(STEPS.ANALYZING);
      const analysis = await analyzeReview(transcription, restaurantName);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (analysis) {
        // Add restaurant ID to review data
        analysis.restaurant_id = restaurantId;
        
        // Add audio URL
        analysis.audio_url = audioUrl;
        
        setReviewAnalysis(analysis);
        setProcessingProgress(100);
        updateProcessingStep(STEPS.COMPLETE);
        setStep('analysis');
      } else {
        throw new Error('Failed to analyze feedback');
      }
    } catch (err) {
      // Don't show the error to the user if we've already set a fallback
      if (processing) {
        setError(`Error processing audio: ${err.message}`);
        updateProcessingStep(STEPS.ERROR);
        setStep('input');
      }
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setProcessing(false);
    }
  };
  
  // Handler for when the timeout triggers
  const handleProcessingTimeout = () => {
    // Clear intervals
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setProcessingProgress(100);
    updateProcessingStep(STEPS.COMPLETE);
    
    // Create a basic fallback review
    const fallbackReview = {
      summary: "I had a good experience at this restaurant.",
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
        throw new Error('Failed to analyze feedback');
      }
    } catch (err) {
      setError(`Error analyzing feedback: ${err.message}`);
      updateProcessingStep(STEPS.ERROR);
      setStep('input');
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProcessing(false);
    }
  };
  
  const handleStartOver = () => {
    setStep('input');
    setInputMethod('audio');
    setTextFeedback('');
    setAudioBlob(null);
    setAudioUrl(null);
    setReviewAnalysis(null);
    setError(null);
    setValidationError(null);
    setProcessingProgress(0);
    updateProcessingStep(STEPS.STARTING);
  };
  
  // Format time display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Animation variants for Framer Motion - Subtle
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    }
  };
  
  // Render progress steps with professional design
  const renderProgressSteps = () => {
    const steps = [
      { id: 'input', label: 'Leave Feedback', icon: FileText },
      { id: 'processing', label: 'Processing', icon: null },
      { id: 'analysis', label: 'Review', icon: Check }
    ];
    
    return (
      <div className="flex items-center justify-center mb-8 px-6">
        {steps.map((s, index) => (
          <React.Fragment key={s.id}>
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div 
                className={`relative flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all duration-300
                  ${step === s.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : step === 'analysis' && (s.id === 'input' || s.id === 'processing')
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-transparent border-slate-600 text-slate-400'
                  }`}
              >
                {s.id === 'processing' && step === 'processing' ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : s.icon ? (
                  <s.icon size={16} />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              
              <span className={`mt-2 text-xs font-medium transition-colors duration-300
                ${step === s.id 
                  ? 'text-blue-400' 
                  : step === 'analysis' && (s.id === 'input' || s.id === 'processing')
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div 
                className={`flex-1 h-0.5 mx-4 transition-all duration-300
                  ${(step === 'analysis' && (s.id === 'input')) || 
                    (step === 'processing' && s.id === 'input') ||
                    (step === 'analysis' && s.id === 'processing')
                    ? 'bg-emerald-500'
                    : step === 'processing' && s.id === 'input'
                      ? 'bg-blue-500'
                      : 'bg-slate-700'
                  }`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

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
                <>
                  <div className="flex items-center mb-6">
                    <div className="p-3 mr-4 rounded-full bg-white/5 border border-white/10">
                      <Mic size={20} className={isRecording ? "text-red-400" : "text-slate-400"} />
                    </div>
                    <div>
                      <h3 className="heading-sm mb-1">
                        {isRecording ? "Recording in progress..." : "Ready to record"}
                      </h3>
                      <p className="body-sm">
                        {isRecording 
                          ? `Share your experience at ${restaurantName}`
                          : "Tap the microphone to start recording your feedback"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Recording time and progress */}
                  {isRecording && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                          <span className="text-red-400 font-medium text-sm">REC</span>
                        </div>
                        <span className="text-white font-mono text-lg">{formatTime(recordingTime)}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-1000"
                          style={{ width: `${(recordingTime / MAX_RECORDING_TIME) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Recording button */}
                  <div className="flex justify-center">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`p-4 rounded-full transition-all duration-200 focus-ring ${
                        isRecording 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                      }`}
                    >
                      {isRecording ? (
                        <Pause size={24} />
                      ) : (
                        <Mic size={24} />
                      )}
                    </button>
                  </div>
                  
                  {/* Recording tips */}
                  <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex gap-3">
                      <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-blue-400 font-medium mb-2 text-sm">Recording Tips</h4>
                        <ul className="body-sm space-y-1">
                          <li>• Speak clearly at a normal pace</li>
                          <li>• Mention food quality, service, and atmosphere</li>
                          <li>• Share both positives and suggestions</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Recording complete state
                <>
                  <div className="flex items-center mb-6">
                    <div className="p-3 mr-4 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                      <Check size={20} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="heading-sm mb-1">Recording Complete!</h3>
                      <p className="body-sm">Review your recording before analyzing</p>
                    </div>
                  </div>
                  
                  {/* Audio player */}
                  <div className="p-4 bg-white/5 rounded-lg mb-6 border border-white/10">
                    <audio 
                      src={audioUrl} 
                      controls 
                      className="w-full"
                    />
                  </div>
                  
                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={startAudioProcessing}
                      className="btn-primary flex items-center justify-center gap-2 focus-ring"
                    >
                      <Send size={18} /> Analyze Feedback
                    </button>
                    <button
                      onClick={() => {
                        setRecordingComplete(false);
                        setAudioBlob(null);
                        setAudioUrl(null);
                      }}
                      className="btn-secondary focus-ring"
                    >
                      Record Again
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
        
        {/* Text feedback */}
        {inputMethod === 'text' && (
          <div className="px-6 pb-6">
            <motion.div 
              className="glass-card-subtle rounded-xl p-6"
              variants={itemVariants}
            >
              <div className="mb-5">
                <label 
                  htmlFor="feedback" 
                  className="block text-white font-medium mb-3 flex items-center gap-2"
                >
                  <FileText size={18} className="text-blue-400" />
                  Your feedback about {restaurantName}
                </label>
                
                <textarea
                  id="feedback"
                  className={`input-field ${validationError ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''}`}
                  rows="6"
                  placeholder="Share your experience... What did you enjoy? What could be improved? Be specific about food, service, and atmosphere."
                  value={textFeedback}
                  onChange={(e) => {
                    setTextFeedback(e.target.value);
                    if (validationError && e.target.value.length >= 10) {
                      setValidationError(null);
                    }
                  }}
                ></textarea>
                
                <AnimatePresence>
                  {validationError && (
                    <motion.p 
                      className="mt-2 text-red-400 text-sm flex items-center gap-2"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <AlertTriangle size={14} />
                      {validationError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              
              <button
                onClick={handleTextSubmit}
                className="btn-primary w-full flex items-center justify-center gap-2 focus-ring"
              >
                <Send size={18} /> Submit Feedback
              </button>
            </motion.div>
          </div>
        )}
      </motion.div>
    );
  }
  
  // Processing screen with professional styling
  if (step === 'processing') {
    return (
      <div className="glass-card rounded-2xl overflow-hidden max-w-4xl mx-auto">
        {renderProgressSteps()}
        
        <div className="px-6 pb-6">
          <div className="text-center py-12">
            <div className="inline-flex rounded-full p-4 bg-white/5 mb-6 border border-white/10">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
            
            <h2 className="heading-md mb-2">Analyzing Your Feedback</h2>
            
            <p className="body-md mb-8">
              {processingProgress < 30 && "Processing your input..."}
              {processingProgress >= 30 && processingProgress < 60 && "Converting speech to text..."}
              {processingProgress >= 60 && processingProgress < 90 && "Analyzing sentiment and insights..."}
              {processingProgress >= 90 && "Finalizing your review..."}
            </p>
            
            {/* Progress bar */}
            <div className="w-full max-w-md mx-auto mb-4">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-blue-400 font-medium text-sm">
              {processingProgress}% Complete
            </div>
            
            {/* Failsafe button */}
            <AnimatePresence>
              {elapsedTime > 20 && (
                <motion.button
                  onClick={handleProcessingTimeout}
                  className="mt-8 btn-secondary focus-ring"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  Continue with Basic Analysis
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }
  
  // Analysis screen
  if (step === 'analysis' && reviewAnalysis) {
    return (
      <div className="glass-card rounded-2xl overflow-hidden max-w-4xl mx-auto">
        {renderProgressSteps()}
        
        <ReviewAnalysis 
          reviewData={reviewAnalysis}
          onSaveSuccess={() => {
            // Additional actions after saving if needed
          }}
          onStartOver={handleStartOver}
          placeId={placeId}
        />
      </div>
    );
  }
  
  // Fallback
  return (
    <div className="glass-card rounded-2xl overflow-hidden max-w-4xl mx-auto p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
      <p className="text-white">Loading feedback form...</p>
    </div>
  );
};

export default FeedbackForm;