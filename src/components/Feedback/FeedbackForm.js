// Updated FeedbackForm with Neumorphic Design
import React, { useState, useEffect, useRef } from 'react';
import { transcribeAudio, processAudio } from '../../services/audioService';
import { analyzeReview } from '../../services/openaiService';
import { useAuth } from '../../contexts/AuthContext';
import ReviewAnalysis from './ReviewAnalysis';

const FeedbackForm = ({ restaurantId, restaurantName, placeId }) => {
  const [inputMethod, setInputMethod] = useState('audio');
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [step, setStep] = useState('input'); // 'input', 'recorded', 'analyzing', 'analysis'
  const [recordingTime, setRecordingTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [error, setError] = useState(null);
  
  const recordingIntervalRef = useRef(null);
  const recordingTimeoutRef = useRef(null);
  const analysisIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const { currentUser } = useAuth();
  
  const MAX_RECORDING_TIME = 30;

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
        
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
          if (blob.size === 0) {
            setError("Recorded audio is empty. Please try again.");
            return;
          }
          
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
          setRecordingComplete(true);
          setStep('recorded');
          
          stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.error('Error creating audio blob:', error);
          setError("Failed to process recorded audio. Please try again.");
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_TIME * 1000);
      
    } catch (error) {
      console.error('Microphone access error:', error);
      setError("Could not access microphone. Please check your browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    }
  };

  const handleAudioSubmit = async () => {
    if (!audioBlob) return;
    
    setStep('analyzing');
    setAnalysisProgress(0);
    
    analysisIntervalRef.current = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 95) {
          clearInterval(analysisIntervalRef.current);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      const result = await processAudio(audioBlob, restaurantName);
      
      clearInterval(analysisIntervalRef.current);
      setAnalysisProgress(100);
      
      setTimeout(() => {
        setAnalysisResult(result);
        setStep('analysis');
      }, 1000);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to analyze your feedback. Please try again.');
      setStep('recorded');
    }
  };

  const handleTextSubmit = async () => {
    if (textInput.length < 10) return;
    
    setStep('analyzing');
    setAnalysisProgress(0);
    
    analysisIntervalRef.current = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 95) {
          clearInterval(analysisIntervalRef.current);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      const result = await analyzeReview(textInput, restaurantName);
      
      clearInterval(analysisIntervalRef.current);
      setAnalysisProgress(100);
      
      setTimeout(() => {
        setAnalysisResult(result);
        setStep('analysis');
      }, 1000);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to analyze your feedback. Please try again.');
      setStep('input');
    }
  };

  const handleStartOver = () => {
    setStep('input');
    setTextInput('');
    setIsRecording(false);
    setRecordingTime(0);
    setProgress(0);
    setAnalysisProgress(0);
    setAnalysisResult(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingComplete(false);
    setError(null);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Main input screen
  if (step === 'input') {
    return (
      <div className="neuro-feedback-section">
        <div className="neuro-container">
          <div className="neuro-feedback-wrapper">
            {/* Header Card */}
            <div className="neuro-feedback-header-card">
              <div className="neuro-feedback-icon-container">
                <div className="neuro-icon neuro-icon-write"></div>
              </div>
              <h1 className="neuro-feedback-title">Share Your Experience</h1>
              <p className="neuro-feedback-subtitle">
                Tell us about your visit to {restaurantName}
              </p>
            </div>

            {/* Error Card */}
            {error && (
              <div className="neuro-feedback-error-card">
                <div className="neuro-error-icon">⚠</div>
                <p className="neuro-error-text">{error}</p>
              </div>
            )}

            {/* Method Selector Card */}
            <div className="neuro-method-selector-card">
              <div className="neuro-method-toggle">
                <button
                  onClick={() => setInputMethod('audio')}
                  className={`neuro-method-button ${inputMethod === 'audio' ? 'active' : 'inactive'}`}
                >
                  <div className="neuro-method-icon">🎤</div>
                  <span className="neuro-method-text">Voice Recording</span>
                </button>
                <button
                  onClick={() => setInputMethod('text')}
                  className={`neuro-method-button ${inputMethod === 'text' ? 'active' : 'inactive'}`}
                >
                  <div className="neuro-method-icon">✍️</div>
                  <span className="neuro-method-text">Write Review</span>
                </button>
              </div>
            </div>

            {/* Audio Recording Interface */}
            {inputMethod === 'audio' && (
              <div className="neuro-audio-interface-card">
                <div className="neuro-audio-content">
                  <div className="neuro-recording-visual">
                    <div className={`neuro-recording-button ${isRecording ? 'recording' : ''}`}>
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className="neuro-record-btn"
                      >
                        <div className="neuro-record-icon">
                          {isRecording ? '⏹️' : '🎤'}
                        </div>
                      </button>
                    </div>
                    
                    {isRecording && (
                      <div className="neuro-recording-timer">
                        <span className="neuro-timer-text">{formatTime(recordingTime)}</span>
                        <span className="neuro-timer-max">/ {formatTime(MAX_RECORDING_TIME)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="neuro-audio-instructions">
                    <h3 className="neuro-instruction-title">
                      {isRecording ? "Recording in progress..." : "Ready to record"}
                    </h3>
                    <p className="neuro-instruction-text">
                      {isRecording 
                        ? "Tell us about your dining experience. Speak clearly and naturally."
                        : "Tap the microphone to start recording your review. Maximum 30 seconds."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Text Input Interface */}
            {inputMethod === 'text' && (
              <div className="neuro-text-interface-card">
                <div className="neuro-text-content">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Share your dining experience... What did you love? What could be improved? How was the service and atmosphere?"
                    className="neuro-feedback-textarea"
                  />
                  <div className="neuro-text-meta">
                    <span className="neuro-char-count">
                      {textInput.length} characters
                    </span>
                  </div>
                  <button
                    onClick={handleTextSubmit}
                    disabled={textInput.length < 10}
                    className={`neuro-submit-button ${textInput.length >= 10 ? 'enabled' : 'disabled'}`}
                  >
                    <div className="neuro-submit-icon">✨</div>
                    <span className="neuro-submit-text">Analyze & Submit</span>
                  </button>
                  {textInput.length < 10 && (
                    <p className="neuro-text-warning">
                      Please write at least 10 characters to continue
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Recording complete screen
  if (step === 'recorded') {
    return (
      <div className="neuro-feedback-section">
        <div className="neuro-container">
          <div className="neuro-feedback-wrapper">
            <div className="neuro-success-card">
              <div className="neuro-success-icon-container">
                <div className="neuro-success-icon">✅</div>
              </div>
              <h2 className="neuro-success-title">Recording Complete!</h2>
              <p className="neuro-success-subtitle">
                Review your audio and submit when ready
              </p>
            </div>

            {audioUrl && (
              <div className="neuro-audio-player-card">
                <div className="neuro-player-header">
                  <h3 className="neuro-player-title">Your Review</h3>
                  <span className="neuro-recording-duration">{formatTime(recordingTime)}</span>
                </div>
                <audio controls className="neuro-audio-control">
                  <source src={audioUrl} type="audio/wav" />
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}

            <div className="neuro-action-buttons">
              <button
                onClick={handleStartOver}
                className="neuro-button neuro-button-secondary neuro-record-again-btn"
              >
                <div className="neuro-button-icon">🔄</div>
                <span className="neuro-button-text">Record Again</span>
              </button>
              <button
                onClick={handleAudioSubmit}
                className="neuro-button neuro-button-primary neuro-submit-btn"
              >
                <div className="neuro-button-icon">✨</div>
                <span className="neuro-button-text">Analyze & Submit</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Analyzing screen
  if (step === 'analyzing') {
    return (
      <div className="neuro-feedback-section">
        <div className="neuro-container">
          <div className="neuro-feedback-wrapper">
            <div className="neuro-analyzing-card">
              <div className="neuro-analyzing-spinner">
                <div className="neuro-spinner-ring"></div>
              </div>
              
              <h2 className="neuro-analyzing-title">Analyzing Your Feedback</h2>
              
              <p className="neuro-analyzing-description">
                {analysisProgress < 30 && "Processing your input..."}
                {analysisProgress >= 30 && analysisProgress < 60 && "Converting speech to text..."}
                {analysisProgress >= 60 && analysisProgress < 90 && "Analyzing sentiment and insights..."}
                {analysisProgress >= 90 && "Finalizing your review..."}
              </p>

              <div className="neuro-progress-container">
                <div className="neuro-progress-bar">
                  <div 
                    className="neuro-progress-fill"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <div className="neuro-progress-text">
                  {Math.floor(analysisProgress)}% Complete
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Analysis results screen
  if (step === 'analysis' && analysisResult) {
    return (
      <div className="neuro-feedback-section">
        <div className="neuro-container">
          <ReviewAnalysis 
            reviewData={analysisResult}
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

  // Fallback loading
  return (
    <div className="neuro-feedback-section">
      <div className="neuro-container">
        <div className="neuro-feedback-wrapper">
          <div className="neuro-loading-card">
            <div className="neuro-loading-spinner">
              <div className="neuro-spinner-ring"></div>
            </div>
            <p className="neuro-loading-text">Loading feedback form...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;