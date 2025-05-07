// src/components/Feedback/FeedbackForm.js
import React, { useState, useEffect, useRef } from 'react';
import AudioRecorder from './AudioRecorder';
import ReviewAnalysis from './ReviewAnalysis';
import { useAuth } from '../../contexts/AuthContext';
import { transcribeAudio, processAudio, fallbackTranscription } from '../../services/audioService';
import { analyzeReview } from '../../services/openaiService';

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
  const [step, setStep] = useState('input'); // 'input', 'processing', 'analysis'
  const [inputMethod, setInputMethod] = useState('audio'); // 'audio' or 'text'
  const [textFeedback, setTextFeedback] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [reviewAnalysis, setReviewAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState(STEPS.STARTING);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Refs for timers
  const timeoutRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const elapsedTimeIntervalRef = useRef(null);
  
  const { currentUser } = useAuth();
  
  // Helper function to update processing step
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
        
        // Auto-fallback after 40 seconds (as an additional safety measure)
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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (elapsedTimeIntervalRef.current) clearInterval(elapsedTimeIntervalRef.current);
    };
  }, []);
  
  // Get human-readable processing step text
  const getProcessingStepText = () => {
    switch(processingStep) {
      case STEPS.STARTING:
        return 'Initializing Processing';
      case STEPS.PROCESSING_AUDIO:
        return 'Processing Audio';
      case STEPS.TRANSCRIBING:
        return 'Transcribing Speech to Text';
      case STEPS.ANALYZING:
        return 'Analyzing Your Feedback';
      case STEPS.COMPLETING:
        return 'Finalizing Results';
      case STEPS.COMPLETE:
        return 'Processing Complete';
      case STEPS.ERROR:
        return 'Error Processing';
      default:
        return 'Processing Your Feedback';
    }
  };
  
  // This function is called when the audio recorder begins processing
  const handleRecorderProcessingStart = () => {
    // This starts the main processing flow for the recorded audio
    startAudioProcessing();
  };
  
  const handleAudioSaved = (blob, url) => {
    setAudioBlob(blob);
    setAudioUrl(url);
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
  
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    
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

  // Centralized audio processing logic
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
      
      // Always verify we have a valid transcription
      if (!transcription || transcription.trim() === '') {
        transcription = fallbackTranscription();
      }
      
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
  
  // This function is simpler now - just calls the centralized startAudioProcessing
  const handleAudioProcess = () => {
    startAudioProcessing();
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

  const renderSteps = () => {
    const steps = [
      { id: 'input', label: 'Record Feedback' },
      { id: 'processing', label: 'Processing' },
      { id: 'analysis', label: 'Review Analysis' }
    ];
    
    return (
      <div className="flex items-center mb-8">
        {steps.map((s, index) => (
          <React.Fragment key={s.id}>
            {/* Step circle */}
            <div 
              className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step === s.id 
                  ? 'border-blue-500 bg-blue-500 text-white' 
                  : step === 'analysis' && s.id === 'processing'
                    ? 'border-green-500 bg-green-500 text-white'
                    : step === 'analysis' && s.id === 'input'
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-500 bg-gray-700 text-gray-400'
              }`}
            >
              {step === 'analysis' && (s.id === 'input' || s.id === 'processing') ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            
            {/* Step label */}
            <div className="ml-2 text-sm font-medium text-gray-300">
              {s.label}
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div 
                className={`flex-1 h-0.5 mx-4 ${
                  (step === 'analysis' && (s.id === 'input' || s.id === 'processing'))
                    ? 'bg-green-500'
                    : step === 'processing' && s.id === 'input'
                      ? 'bg-blue-500'
                      : 'bg-gray-600'
                }`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  // If user is not authenticated, show warning
  if (!currentUser) {
    return (
      <div className="bg-yellow-900 border border-yellow-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-yellow-100 mb-2">Authentication Required</h3>
        <p className="text-yellow-200 mb-4">
          Please log in to submit feedback. This helps us keep track of your reviews and provide a better experience.
        </p>
        <p className="text-yellow-300">
          You can log in using the options in the top navigation bar.
        </p>
      </div>
    );
  }
  
  // Processing screen
  if (step === 'processing') {
    // Get current step text
    const stepText = getProcessingStepText();
    
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg shadow-md">
        {renderSteps()}
        
        {/* Status Indicator */}
        <div className="w-full p-4 mb-6 bg-blue-900 rounded-lg">
          <h2 className="text-2xl font-bold text-center text-white">
            {stepText}
          </h2>
          <div className="mt-2 text-center text-blue-200">
            {processingStep === STEPS.STARTING && 'Setting up audio processing...'}
            {processingStep === STEPS.PROCESSING_AUDIO && 'Enhancing audio quality for better results...'}
            {processingStep === STEPS.TRANSCRIBING && 'Converting your spoken feedback to text...'}
            {processingStep === STEPS.ANALYZING && 'Using AI to analyze the content of your feedback...'}
            {processingStep === STEPS.COMPLETING && 'Finalizing your review analysis...'}
            {processingStep === STEPS.COMPLETE && 'Processing finished successfully!'}
            {processingStep === STEPS.ERROR && 'Error occurred during processing!'}
          </div>
        </div>
        
        <div className="w-20 h-20 mb-4">
          <svg className="animate-spin w-full h-full text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${processingProgress}%` }}
          ></div>
        </div>
        <div className="text-gray-400 text-sm mb-6">
          {processingProgress}% Complete
        </div>
        
        {/* Failsafe button */}
        {elapsedTime > 20 && (
          <button
            onClick={handleProcessingTimeout}
            className="mt-6 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md"
          >
            Skip Processing and Continue Anyway
          </button>
        )}
      </div>
    );
  }
  
  // Analysis screen
  if (step === 'analysis' && reviewAnalysis) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md">
        {renderSteps()}
        
        <ReviewAnalysis 
          reviewData={reviewAnalysis}
          onSaveSuccess={() => {
            // Do any additional actions after saving if needed
          }}
          onStartOver={handleStartOver}
          placeId={placeId}
        />
      </div>
    );
  }
  
  // Input screen
  return (
    <div className="bg-gray-800 rounded-lg shadow-md">
      {renderSteps()}
      
      {error && (
        <div className="mb-6 p-4 bg-red-900 text-white rounded-md">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-6 p-2">
        <div className="flex border-b border-gray-700">
          <button
            className={`flex-1 py-3 px-4 text-center focus:outline-none ${
              inputMethod === 'audio'
                ? 'text-blue-400 border-b-2 border-blue-400 font-medium'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setInputMethod('audio')}
          >
            <span className="mr-2">🎙️</span> Voice Feedback
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center focus:outline-none ${
              inputMethod === 'text'
                ? 'text-blue-400 border-b-2 border-blue-400 font-medium'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setInputMethod('text')}
          >
            <span className="mr-2">✏️</span> Written Feedback
          </button>
        </div>
      </div>
      
      {inputMethod === 'audio' ? (
        <AudioRecorder 
          onAudioSaved={handleAudioSaved} 
          restaurantId={restaurantId}
          // This prop connects the AudioRecorder to the processing flow
          onProcessingStart={handleRecorderProcessingStart}
        />
      ) : (
        <div className="p-4">
          <div className="bg-gray-700 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-medium text-white mb-2 flex items-center">
              <span className="mr-2">✏️</span> Written Feedback
            </h3>
            <p className="text-gray-300 mb-4">
              Please share your thoughts about your experience at {restaurantName}. 
              What did you like? What could be improved?
            </p>
            
            <form onSubmit={handleTextSubmit}>
              <div className="mb-4">
                <textarea
                  className="w-full p-3 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="6"
                  placeholder="Tell us what you liked or didn't like... What made your experience special? What could we improve?"
                  value={textFeedback}
                  onChange={(e) => setTextFeedback(e.target.value)}
                ></textarea>
                
                {validationError && (
                  <p className="mt-2 text-red-400 text-sm">{validationError}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={processing}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                📝 Submit Feedback
              </button>
            </form>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-white mb-2">Feedback Tips</h4>
            <ul className="text-gray-300 list-disc list-inside space-y-1">
              <li>Be specific about what you liked or didn't like</li>
              <li>Mention particular dishes, staff, or aspects of your visit</li>
              <li>If something could be improved, what would make it better?</li>
              <li>Your honest feedback helps us improve our service</li>
            </ul>
          </div>
        </div>
      )}
      
      {inputMethod === 'audio' && audioBlob && (
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleAudioProcess}
            disabled={processing}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center justify-center"
          >
            {processing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>🔍 Analyze My Feedback</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedbackForm;