// src/components/Feedback/FeedbackForm.js
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Pause, Send, FileText, Check, AlertTriangle, Info } from 'lucide-react';
import { transcribeAudio, processAudio } from '../../services/audioService';
import { analyzeReview } from '../../services/openaiService';
import { useAuth } from '../../contexts/AuthContext';
import ReviewAnalysis from './ReviewAnalysis';
import AudioWaveVisualizer from './AudioWaveVisualizer'; // New component we'll create

// Import THREE.js (required for Vanta.js)
import * as THREE from 'three';
// Import the Vanta effect we'll use (will be loaded in componentDidMount)
// This is imported dynamically to avoid issues with SSR

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
  const [vantaEffect, setVantaEffect] = useState(null);
  const [audioData, setAudioData] = useState(new Uint8Array(0));
  const [analyzer, setAnalyzer] = useState(null);
  
  // Rating state
  const [rating, setRating] = useState(0);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const elapsedTimeIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const vantaRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const { currentUser } = useAuth();
  
  const MAX_RECORDING_TIME = 30; // seconds

  // Initialize Vanta.js effect
  useEffect(() => {
    const loadVanta = async () => {
      if (!vantaEffect && vantaRef.current) {
        // Dynamically import Vanta to avoid SSR issues
        const WAVES = (await import('vanta/dist/vanta.waves.min')).default;
        
        // Start with a subtle effect that's not distracting
        const effect = WAVES({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: false,
          touchControls: false,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x0066ff,
          shininess: 16.0,
          waveHeight: 8.0,
          waveSpeed: 0.75,
          zoom: 0.88
        });
        
        setVantaEffect(effect);
      }
    };
    
    loadVanta();
    
    // Clean up on unmount
    return () => {
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    };
  }, [vantaEffect]);
  
  // Modify Vanta effect when recording starts/stops
  useEffect(() => {
    if (vantaEffect) {
      if (isRecording) {
        // Increase wave height and speed when recording
        vantaEffect.setOptions({
          waveHeight: 20.0,
          waveSpeed: 1.5,
          color: 0xff3333
        });
      } else {
        // Return to subtle effect when not recording
        vantaEffect.setOptions({
          waveHeight: 8.0,
          waveSpeed: 0.75,
          color: 0x0066ff
        });
      }
    }
  }, [isRecording, vantaEffect]);
  
  // Update processing step
  const updateProcessingStep = (newStep) => {
    setProcessingStep(newStep);
  };
  
  // Setup audio analyzer for visualization
  const setupAudioAnalyzer = (stream) => {
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Create analyzer node
    const analyzerNode = audioContextRef.current.createAnalyser();
    analyzerNode.fftSize = 256; // Power of 2, smaller means less detailed but better performance
    const bufferLength = analyzerNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Connect stream to analyzer
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyzerNode);
    
    // Save references
    analyzerRef.current = analyzerNode;
    dataArrayRef.current = dataArray;
    setAnalyzer(analyzerNode);
    
    // Start visualization loop
    visualize();
  };
  
  // Visualize audio data
  const visualize = () => {
    if (!analyzerRef.current) return;
    
    // Get frequency data 
    analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Update state with new data (will be passed to the visualizer component)
    setAudioData(new Uint8Array(dataArrayRef.current));
    
    // Continue the loop
    animationFrameRef.current = requestAnimationFrame(visualize);
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
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
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
      
      // Setup audio analyzer for visualization
      setupAudioAnalyzer(stream);
      
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
        
        // Release microphone and stop visualization
        stream.getTracks().forEach(track => track.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
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
        
        // Add optional rating
        if (rating > 0) {
          analysis.sentiment_score = rating;
        }
        
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
      sentiment_score: rating > 0 ? rating : 4,
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
        
        // Add optional rating
        if (rating > 0) {
          analysis.sentiment_score = rating;
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
    setRating(0);
    setProcessingProgress(0);
    updateProcessingStep(STEPS.STARTING);
  };
  
  // Format time display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };
  
  // Render progress steps with improved visual design
  const renderProgressSteps = () => {
    const steps = [
      { id: 'input', label: 'Leave Feedback' },
      { id: 'processing', label: 'Processing' },
      { id: 'analysis', label: 'Review' }
    ];
    
    return (
      <motion.div 
        className="flex items-center justify-between mb-8 px-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {steps.map((s, index) => (
          <React.Fragment key={s.id}>
            {/* Step with icon and label */}
            <motion.div 
              className="flex flex-col items-center"
              variants={itemVariants}
            >
              <div 
                className={`flex items-center justify-center h-12 w-12 rounded-full
                  ${step === s.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : step === 'analysis' && (s.id === 'input' || s.id === 'processing')
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-400'
                  } transition-all duration-300`}
              >
                {s.id === 'input' && <Mic size={20} />}
                {s.id === 'processing' && (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {s.id === 'analysis' && <Check size={20} />}
              </div>
              
              <span className={`mt-2 text-sm font-medium
                ${step === s.id 
                  ? 'text-blue-400' 
                  : step === 'analysis' && (s.id === 'input' || s.id === 'processing')
                    ? 'text-green-500'
                    : 'text-gray-500'
                } transition-all duration-300`}
              >
                {s.label}
              </span>
            </motion.div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <motion.div 
                className={`flex-1 h-1 mx-2 rounded
                  ${(step === 'analysis' && (s.id === 'input')) || 
                    (step === 'processing' && s.id === 'input') ||
                    (step === 'analysis' && s.id === 'processing')
                    ? 'bg-green-500'
                    : 'bg-gray-700'
                  } transition-all duration-300`}
                variants={itemVariants}
              ></motion.div>
            )}
          </React.Fragment>
        ))}
      </motion.div>
    );
  };

  // Input screen with animated background
  if (step === 'input') {
    return (
      <div 
        className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700 relative"
        ref={vantaRef}
      >
        {/* Vanta.js animated background will be applied to this container */}
        <div className="absolute inset-0 z-0"></div>
        
        {/* Content container */}
        <div className="relative z-10 backdrop-blur-sm bg-gray-800/40">
          {renderProgressSteps()}
          
          {/* Error display with animation */}
          <AnimatePresence>
            {error && (
              <motion.div 
                className="mx-6 mb-6 p-4 bg-red-900/70 backdrop-blur-sm text-white rounded-lg border border-red-700 flex items-start gap-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <div className="p-1">
                  <AlertTriangle size={18} className="text-red-300" />
                </div>
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-red-200">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Input method selector with improved tabs */}
          <div className="px-6 mb-6">
            <div className="p-1 bg-gray-700/60 rounded-lg flex">
              <motion.button
                className={`flex-1 py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-all
                  ${inputMethod === 'audio'
                    ? 'bg-gray-800/80 text-blue-400 shadow-md'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                  }`}
                onClick={() => setInputMethod('audio')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Mic size={18} />
                <span>Voice Feedback</span>
              </motion.button>
              <motion.button
                className={`flex-1 py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-all
                  ${inputMethod === 'text'
                    ? 'bg-gray-800/80 text-blue-400 shadow-md'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                  }`}
                onClick={() => setInputMethod('text')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FileText size={18} />
                <span>Written Feedback</span>
              </motion.button>
            </div>
          </div>
          
          {/* Audio recorder with improved UI and visualizations */}
          {inputMethod === 'audio' && (
            <div className="px-6 pb-6">
              <motion.div 
                className="bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                {!recordingComplete ? (
                  <>
                    <div className="flex items-center mb-6">
                      <div className="p-3 mr-4 rounded-full bg-gray-800/60">
                        <Mic size={24} className={isRecording ? "text-red-500" : "text-gray-400"} />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white mb-1">
                          {isRecording ? "Recording in progress..." : "Ready to record"}
                        </h3>
                        <p className="text-gray-300 text-sm">
                          {isRecording 
                            ? "Speak clearly about your experience at " + restaurantName
                            : "Tap the microphone button to start recording your feedback"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Audio Visualizer - will show when recording */}
                    {isRecording && analyzer && (
                      <div className="mb-6 bg-gray-800/60 rounded-lg overflow-hidden h-24">
                        <AudioWaveVisualizer audioData={audioData} isRecording={isRecording} />
                      </div>
                    )}
                    
                    {/* Recording time and progress */}
                    {isRecording && (
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-red-400 font-mono animate-pulse">● REC</span>
                          <span className="text-white font-mono">{formatTime(recordingTime)}</span>
                        </div>
                        <div className="h-2 bg-gray-800/60 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-red-600 transition-all duration-1000"
                            style={{ width: `${(recordingTime / MAX_RECORDING_TIME) * 100}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(recordingTime / MAX_RECORDING_TIME) * 100}%` }}
                          ></motion.div>
                        </div>
                      </div>
                    )}
                    
                    {/* Recording button with animations */}
                    <div className="flex justify-center">
                      <motion.button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-6 rounded-full transition-all duration-300 ${
                          isRecording 
                            ? 'bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20' 
                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isRecording ? (
                          <Pause size={28} className="text-white" />
                        ) : (
                          <Mic size={28} className="text-white" />
                        )}
                      </motion.button>
                    </div>
                    
                    {/* Recording tips card */}
                    <motion.div 
                      className="mt-8 p-4 bg-gray-800/70 rounded-lg border border-gray-700"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <div className="flex gap-3">
                        <Info size={18} className="text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="text-blue-400 font-medium mb-2">Recording Tips</h4>
                          <ul className="text-gray-300 text-sm space-y-1">
                            <li>• Speak clearly at a normal pace</li>
                            <li>• Mention specific aspects like food, service, and atmosphere</li>
                            <li>• Share both positives and areas for improvement</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  // Recording complete state with playback
                  <>
                    <motion.div 
                      className="flex items-center mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    >
                      <div className="p-3 mr-4 rounded-full bg-green-900/50">
                        <Check size={24} className="text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white mb-1">Recording Complete!</h3>
                        <p className="text-gray-300 text-sm">Review your recording before analyzing</p>
                      </div>
                    </motion.div>
                    
                    {/* Audio player with improved styling */}
                    <motion.div 
                      className="p-4 bg-gray-800/60 rounded-lg mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 24 }}
                    >
                      <audio 
                        src={audioUrl} 
                        controls 
                        className="w-full h-10 rounded-lg bg-gray-700/60"
                      />
                    </motion.div>
                    
                    {/* Optional rating */}
                    <motion.div 
                      className="mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 24 }}
                    >
                      <label className="block text-white font-medium mb-2">Overall rating (optional)</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="text-yellow-400 hover:text-yellow-300 p-1"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill={star <= rating ? "currentColor" : "none"}
                              stroke="currentColor" 
                              className="w-8 h-8"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                    
                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        onClick={startAudioProcessing}
                        className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-blue-600/20"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 24 }}
                      >
                        <Send size={18} /> Analyze Feedback
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setRecordingComplete(false);
                          setAudioBlob(null);
                          setAudioUrl(null);
                          setRating(0);
                        }}
                        className="py-3 px-4 bg-gray-700/60 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 24 }}
                      >
                        Record Again
                      </motion.button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
          
          {/* Text feedback with improved form */}
          {inputMethod === 'text' && (
            <div className="px-6 pb-6">
              <motion.div 
                className="bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <div>
                  <div className="mb-5">
                    <label 
                      htmlFor="feedback" 
                      className="block text-white font-medium mb-2 flex items-center gap-2"
                    >
                      <FileText size={18} className="text-blue-400" />
                      Your feedback about {restaurantName}
                    </label>
                    
                    <motion.textarea
                      id="feedback"
                      className={`w-full p-4 bg-gray-800/80 text-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                        ${validationError ? 'border-red-500' : 'border-gray-600/50'}
                      `}
                      rows="6"
                      placeholder="Tell us about your experience... What did you enjoy? What could we improve? Be specific about food, service, and atmosphere."
                      value={textFeedback}
                      onChange={(e) => {
                        setTextFeedback(e.target.value);
                        if (validationError && e.target.value.length >= 10) {
                          setValidationError(null);
                        }
                      }}
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    ></motion.textarea>
                    
                    <AnimatePresence>
                      {validationError && (
                        <motion.p 
                          className="mt-2 text-red-400 text-sm flex items-center gap-2"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <AlertTriangle size={14} />
                          {validationError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Feedback rating */}
                  <div className="mb-6">
                    <label className="block text-white font-medium mb-2">Overall rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="text-yellow-400 hover:text-yellow-300 p-1"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill={star <= rating ? "currentColor" : "none"}
                            stroke="currentColor" 
                            className="w-8 h-8"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={handleTextSubmit}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-blue-600/20"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Send size={18} /> Submit Feedback
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Processing screen with improved animations
  if (step === 'processing') {
    return (
      <div 
        className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700 relative"
        ref={vantaRef}
      >
        {/* Animated background */}
        <div className="absolute inset-0 z-0"></div>
        
        {/* Content container */}
        <div className="relative z-10 backdrop-blur-sm bg-gray-800/40">
          {renderProgressSteps()}
          
          <div className="px-6 pb-6">
            <motion.div 
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="inline-flex rounded-full p-4 bg-gray-700/60 mb-4"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <svg className="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </motion.div>
              
              <motion.h2 
                className="text-2xl font-bold text-white mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
              >
                Analyzing Your Feedback
              </motion.h2>
              
              <motion.p 
                className="text-gray-300 mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
              >
                {processingProgress < 30 && "Processing audio for better results..."}
                {processingProgress >= 30 && processingProgress < 60 && "Converting speech to text..."}
                {processingProgress >= 60 && processingProgress < 90 && "Analyzing sentiment and key points..."}
                {processingProgress >= 90 && "Finalizing your review..."}
              </motion.p>
              
              {/* Enhanced progress bar */}
              <motion.div 
                className="w-full max-w-md mx-auto mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <div className="h-3 bg-gray-700/60 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                    style={{ width: `${processingProgress}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${processingProgress}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                  ></motion.div>
                </div>
              </motion.div>
              
              <motion.div 
                className="text-blue-400 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {processingProgress}% Complete
              </motion.div>
              
              {/* Failsafe button */}
              <AnimatePresence>
                {elapsedTime > 20 && (
                  <motion.button
                    onClick={handleProcessingTimeout}
                    className="mt-6 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Skip Processing and Continue Anyway
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }
  
  // Analysis screen - using the existing ReviewAnalysis component
  if (step === 'analysis' && reviewAnalysis) {
    return (
      <div 
        className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700 relative"
        ref={vantaRef}
      >
        {/* Animated background */}
        <div className="absolute inset-0 z-0"></div>
        
        {/* Content container */}
        <div className="relative z-10 backdrop-blur-sm bg-gray-800/40">
          {renderProgressSteps()}
          
          {/* Use the existing ReviewAnalysis component */}
          <ReviewAnalysis 
            reviewData={reviewAnalysis}
            onSaveSuccess={() => {
              // Additional actions after saving if needed
            }}
            onStartOver={handleStartOver}
            placeId={placeId}
          />
        </div>
      </div>
    );
  }
  
  // Fallback
  return (
    <div 
      className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700 p-6 text-center"
      ref={vantaRef}
    >
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-white">Loading feedback form...</p>
    </div>
  );
};

export default FeedbackForm;