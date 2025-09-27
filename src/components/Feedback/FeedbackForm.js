// src/components/Feedback/FeedbackForm.js
// EXACT ORIGINAL FUNCTIONALITY WITH NEUMORPHIC UI ONLY
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const recordingIntervalRef = useRef(null);
  const recordingTimeoutRef = useRef(null);
  const analysisIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const { currentUser } = useAuth();
  
  const MAX_RECORDING_TIME = 30; // 30 seconds

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDarkMode(theme === 'dark');
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);

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

  // Audio recording handlers - EXACT ORIGINAL FUNCTIONALITY
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
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setRecordingComplete(true);
          setStep('recorded');
        } catch (blobErr) {
          setError(`Failed to create audio blob: ${blobErr.message}`);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.onerror = (err) => {
        setError(`MediaRecorder error: ${err.message}`);
      };
      
      // Start the timer
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prevTime => {
          const nextTime = prevTime + 1;
          if (nextTime >= MAX_RECORDING_TIME) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return nextTime;
        });
      }, 1000);
      
      mediaRecorder.start(100);
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
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  // REAL Audio Processing Function - EXACT ORIGINAL
  const handleAnalyzeAudio = async () => {
    if (!audioBlob) {
      setError('No audio recording found');
      return;
    }
    
    setError(null);
    setStep('analyzing');
    setAnalysisProgress(0);
    
    // Progress animation
    analysisIntervalRef.current = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 85) {
          clearInterval(analysisIntervalRef.current);
          return 85;
        }
        return prev + 2;
      });
    }, 500);
    
    try {
      console.log('Starting real audio processing...');
      
      // Process audio quality
      setAnalysisProgress(15);
      const processedAudio = await processAudio(audioBlob);
      
      // Transcribe using real service
      setAnalysisProgress(35);
      console.log('Transcribing audio...');
      const transcription = await transcribeAudio(processedAudio);
      
      console.log('Transcription result:', transcription);
      
      if (!transcription || transcription.trim().length === 0) {
        throw new Error('No transcription was generated. Please try speaking more clearly or use text input.');
      }
      
      if (transcription.includes('TRANSCRIPTION_FAILED') || transcription.includes('Unable to convert speech')) {
        throw new Error('Speech transcription failed. Please try recording again with clearer speech or use text input.');
      }
      
      // Analyze with real OpenAI service
      setAnalysisProgress(65);
      console.log('Analyzing with OpenAI...');
      const analysis = await analyzeReview(transcription, restaurantName);
      
      console.log('Analysis result:', analysis);
      
      if (!analysis) {
        throw new Error('Failed to analyze your feedback. Please try again.');
      }
      
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      
      // Add metadata
      analysis.restaurant_id = restaurantId;
      analysis.restaurant_name = restaurantName;
      analysis.audio_url = audioUrl;
      
      setAnalysisResult(analysis);
      setAnalysisProgress(100);
      setStep('analysis');
      
    } catch (err) {
      console.error('Audio processing error:', err);
      
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      
      setError(`Processing failed: ${err.message}`);
      setStep('recorded');
    }
  };

  // REAL Text Analysis Function - EXACT ORIGINAL
  const handleSubmitText = async () => {
    if (textInput.length < 10) {
      setError('Please provide more detailed feedback (at least 10 characters).');
      return;
    }
    
    setError(null);
    setStep('analyzing');
    setAnalysisProgress(0);
    
    analysisIntervalRef.current = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 85) {
          clearInterval(analysisIntervalRef.current);
          return 85;
        }
        return prev + 3;
      });
    }, 400);
    
    try {
      console.log('Analyzing text feedback:', textInput);
      
      setAnalysisProgress(30);
      const analysis = await analyzeReview(textInput, restaurantName);
      
      setAnalysisProgress(80);
      
      if (!analysis) {
        throw new Error('Failed to analyze feedback');
      }
      
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      
      analysis.restaurant_id = restaurantId;
      analysis.restaurant_name = restaurantName;
      
      setAnalysisResult(analysis);
      setAnalysisProgress(100);
      setStep('analysis');
      
    } catch (err) {
      console.error('Text analysis error:', err);
      
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      
      setError(`Error analyzing feedback: ${err.message}`);
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

  // Main input screen with NEUMORPHIC UI
  if (step === 'input') {
    return (
      <div className="neuro-card" style={{
        background: 'var(--neuro-bg, #e0e0e0)',
        borderRadius: 'var(--neuro-radius-lg, 2rem)',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        boxShadow: isDarkMode 
          ? '15px 15px 30px rgb(25, 25, 25), -15px -15px 30px rgb(60, 60, 60)'
          : '20px 20px 60px #bebebe, -20px -20px 60px #ffffff',
        maxWidth: '100%',
        margin: '2rem auto 0',
        transition: 'all 0.3s ease'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: '700',
            color: 'var(--neuro-text-primary, #2c3e50)',
            marginBottom: '0.5rem'
          }}>
            Share Your Experience
          </h1>
          <p style={{
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            color: 'var(--neuro-text-secondary, #5a6c7d)'
          }}>
            Tell us about your visit to {restaurantName}
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '1rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#ef4444',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Input method selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setInputMethod('audio')}
            style={{
              padding: '0.875rem 1.75rem',
              borderRadius: '50px',
              border: 'none',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: inputMethod === 'audio' 
                ? 'linear-gradient(145deg, #667eea, #764ba2)'
                : 'var(--neuro-bg, #e0e0e0)',
              color: inputMethod === 'audio' ? 'white' : 'var(--neuro-text-secondary, #5a6c7d)',
              boxShadow: inputMethod === 'audio'
                ? 'inset 5px 5px 10px rgba(0,0,0,0.2), inset -5px -5px 10px rgba(255,255,255,0.1)'
                : isDarkMode 
                  ? '8px 8px 16px rgb(25, 25, 25), -8px -8px 16px rgb(60, 60, 60)'
                  : '5px 5px 10px #bebebe, -5px -5px 10px #ffffff'
            }}
          >
            🎤 Voice Feedback
          </button>
          
          <button
            onClick={() => setInputMethod('text')}
            style={{
              padding: '0.875rem 1.75rem',
              borderRadius: '50px',
              border: 'none',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: inputMethod === 'text' 
                ? 'linear-gradient(145deg, #667eea, #764ba2)'
                : 'var(--neuro-bg, #e0e0e0)',
              color: inputMethod === 'text' ? 'white' : 'var(--neuro-text-secondary, #5a6c7d)',
              boxShadow: inputMethod === 'text'
                ? 'inset 5px 5px 10px rgba(0,0,0,0.2), inset -5px -5px 10px rgba(255,255,255,0.1)'
                : isDarkMode 
                  ? '8px 8px 16px rgb(25, 25, 25), -8px -8px 16px rgb(60, 60, 60)'
                  : '5px 5px 10px #bebebe, -5px -5px 10px #ffffff'
            }}
          >
            ✍️ Written Feedback
          </button>
        </div>

        {/* Audio Recording Interface */}
        {inputMethod === 'audio' && (
          <div style={{ textAlign: 'center' }}>
            <div
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                width: 'clamp(120px, 25vw, 150px)',
                height: 'clamp(120px, 25vw, 150px)',
                borderRadius: '50%',
                margin: '0 auto 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: isRecording 
                  ? 'linear-gradient(145deg, #f56565, #fc8181)'
                  : 'var(--neuro-bg, #e0e0e0)',
                boxShadow: isRecording
                  ? 'inset 8px 8px 16px rgba(0,0,0,0.2), inset -8px -8px 16px rgba(255,255,255,0.1)'
                  : isDarkMode
                    ? '15px 15px 30px rgb(25, 25, 25), -15px -15px 30px rgb(60, 60, 60)'
                    : '15px 15px 30px #bebebe, -15px -15px 30px #ffffff',
                animation: isRecording ? 'pulse 2s infinite' : 'none'
              }}
            >
              {isRecording ? '⏸️' : '🎤'}
            </div>

            {isRecording && (
              <>
                <div style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: '300',
                  color: 'var(--neuro-text-primary, #2c3e50)',
                  marginBottom: '1rem'
                }}>
                  {formatTime(recordingTime)}
                </div>
                
                <div style={{
                  width: '100%',
                  maxWidth: '300px',
                  height: '8px',
                  background: 'var(--neuro-bg, #e0e0e0)',
                  borderRadius: '50px',
                  boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.1), inset -3px -3px 6px rgba(255,255,255,0.5)',
                  overflow: 'hidden',
                  margin: '0 auto 2rem'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(recordingTime / MAX_RECORDING_TIME) * 100}%`,
                    background: 'linear-gradient(90deg, #ef4444, #dc2626)',
                    transition: 'width 1s linear'
                  }} />
                </div>
              </>
            )}

            <h3 style={{
              fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
              color: 'var(--neuro-text-primary, #2c3e50)',
              marginBottom: '0.5rem'
            }}>
              {isRecording ? 'Recording...' : 'Ready to Record'}
            </h3>
            <p style={{
              color: 'var(--neuro-text-secondary, #5a6c7d)',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              lineHeight: '1.5'
            }}>
              {isRecording 
                ? `Share your thoughts about ${restaurantName}. Speak clearly about food, service, and atmosphere.`
                : 'Tap the microphone to start recording. Maximum 30 seconds.'
              }
            </p>
          </div>
        )}

        {/* Text Input Interface */}
        {inputMethod === 'text' && (
          <div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`What did you think of ${restaurantName}? Share your thoughts about the food, service, and atmosphere...`}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '1.25rem',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                lineHeight: '1.6',
                border: 'none',
                borderRadius: '1rem',
                background: 'var(--neuro-bg, #e0e0e0)',
                boxShadow: 'inset 8px 8px 16px rgba(0,0,0,0.08), inset -8px -8px 16px rgba(255,255,255,0.5)',
                resize: 'vertical',
                fontFamily: 'inherit',
                color: 'var(--neuro-text-primary, #2c3e50)',
                outline: 'none'
              }}
            />
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '2rem'
            }}>
              <button
                onClick={handleSubmitText}
                disabled={textInput.length < 10}
                style={{
                  padding: '1rem 2rem',
                  borderRadius: '50px',
                  border: 'none',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  fontWeight: '600',
                  cursor: textInput.length >= 10 ? 'pointer' : 'not-allowed',
                  background: textInput.length >= 10 
                    ? 'linear-gradient(145deg, #667eea, #764ba2)'
                    : 'var(--neuro-bg, #e0e0e0)',
                  color: textInput.length >= 10 ? 'white' : '#cbd5e0',
                  boxShadow: isDarkMode
                    ? '8px 8px 16px rgb(25, 25, 25), -8px -8px 16px rgb(60, 60, 60)'
                    : '8px 8px 16px #bebebe, -8px -8px 16px #ffffff',
                  opacity: textInput.length >= 10 ? 1 : 0.5,
                  transition: 'all 0.3s ease'
                }}
              >
                🤖 Analyze Feedback
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Recording complete screen with NEUMORPHIC UI
  if (step === 'recorded') {
    return (
      <div className="neuro-card" style={{
        background: 'var(--neuro-bg, #e0e0e0)',
        borderRadius: 'var(--neuro-radius-lg, 2rem)',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        boxShadow: isDarkMode 
          ? '15px 15px 30px rgb(25, 25, 25), -15px -15px 30px rgb(60, 60, 60)'
          : '20px 20px 60px #bebebe, -20px -20px 60px #ffffff',
        maxWidth: '100%',
        margin: '2rem auto 0',
        textAlign: 'center'
      }}>
        {/* Success Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(145deg, #48bb78, #38a169)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          fontSize: '2.5rem',
          color: 'white',
          boxShadow: isDarkMode
            ? '10px 10px 20px rgb(25, 25, 25), -10px -10px 20px rgb(60, 60, 60)'
            : '10px 10px 20px #bebebe, -10px -10px 20px #ffffff'
        }}>
          ✓
        </div>

        <h2 style={{
          fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
          color: 'var(--neuro-text-primary, #2c3e50)',
          marginBottom: '0.5rem'
        }}>
          Recording Complete!
        </h2>
        <p style={{
          color: 'var(--neuro-text-secondary, #5a6c7d)',
          fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
          marginBottom: '2rem'
        }}>
          Review your recording and analyze it
        </p>

        {/* Error display */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '1rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#ef4444'
          }}>
            {error}
          </div>
        )}

        {/* Audio player */}
        {audioUrl && (
          <audio 
            src={audioUrl} 
            controls 
            style={{ 
              width: '100%',
              maxWidth: '400px',
              marginBottom: '2rem'
            }}
          />
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleAnalyzeAudio}
            style={{
              padding: '1rem 2rem',
              borderRadius: '50px',
              border: 'none',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              fontWeight: '600',
              cursor: 'pointer',
              background: 'linear-gradient(145deg, #667eea, #764ba2)',
              color: 'white',
              boxShadow: isDarkMode
                ? '8px 8px 16px rgb(25, 25, 25), -8px -8px 16px rgb(60, 60, 60)'
                : '8px 8px 16px #bebebe, -8px -8px 16px #ffffff',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            🤖 Analyze Recording
          </button>
          
          <button
            onClick={() => {
              setStep('input');
              setRecordingComplete(false);
              setAudioBlob(null);
              setAudioUrl(null);
            }}
            style={{
              padding: '1rem 2rem',
              borderRadius: '50px',
              border: 'none',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              fontWeight: '600',
              cursor: 'pointer',
              background: 'var(--neuro-bg, #e0e0e0)',
              color: 'var(--neuro-text-secondary, #5a6c7d)',
              boxShadow: isDarkMode
                ? '5px 5px 10px rgb(25, 25, 25), -5px -5px 10px rgb(60, 60, 60)'
                : '5px 5px 10px #bebebe, -5px -5px 10px #ffffff',
              transition: 'all 0.3s ease'
            }}
          >
            🔄 Record Again
          </button>
        </div>
      </div>
    );
  }

  // Analyzing screen with NEUMORPHIC UI
  if (step === 'analyzing') {
    return (
      <div className="neuro-card" style={{
        background: 'var(--neuro-bg, #e0e0e0)',
        borderRadius: 'var(--neuro-radius-lg, 2rem)',
        padding: 'clamp(2rem, 4vw, 3rem)',
        boxShadow: isDarkMode 
          ? '15px 15px 30px rgb(25, 25, 25), -15px -15px 30px rgb(60, 60, 60)'
          : '20px 20px 60px #bebebe, -20px -20px 60px #ffffff',
        maxWidth: '100%',
        margin: '2rem auto 0',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          border: `4px solid var(--neuro-bg, #e0e0e0)`,
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          margin: '0 auto 2rem',
          animation: 'spin 1s linear infinite',
          boxShadow: isDarkMode
            ? 'inset 5px 5px 10px rgb(25, 25, 25), inset -5px -5px 10px rgb(60, 60, 60)'
            : 'inset 5px 5px 10px #bebebe, inset -5px -5px 10px #ffffff'
        }} />
        
        <h2 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          color: 'var(--neuro-text-primary, #2c3e50)',
          marginBottom: '1rem'
        }}>
          Analyzing Your Feedback
        </h2>
        
        <p style={{
          fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
          color: 'var(--neuro-text-secondary, #5a6c7d)',
          marginBottom: '2rem'
        }}>
          {analysisProgress < 30 && "Processing your input..."}
          {analysisProgress >= 30 && analysisProgress < 60 && "Converting speech to text..."}
          {analysisProgress >= 60 && analysisProgress < 90 && "Analyzing sentiment and insights..."}
          {analysisProgress >= 90 && "Finalizing your review..."}
        </p>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          maxWidth: '400px',
          height: '10px',
          background: 'var(--neuro-bg, #e0e0e0)',
          borderRadius: '50px',
          boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.5)',
          overflow: 'hidden',
          margin: '0 auto 1rem'
        }}>
          <div style={{
            height: '100%',
            width: `${analysisProgress}%`,
            background: 'linear-gradient(90deg, #667eea, #764ba2)',
            transition: 'width 0.5s ease'
          }} />
        </div>

        <div style={{ 
          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
          color: 'var(--neuro-text-light, #8491a3)'
        }}>
          {analysisProgress}% Complete
        </div>
      </div>
    );
  }

  // Analysis results screen - KEEP ORIGINAL COMPONENT
  if (step === 'analysis' && analysisResult) {
    return (
      <ReviewAnalysis 
        reviewData={analysisResult}
        onSaveSuccess={() => {
          // Additional actions after saving if needed
        }}
        onStartOver={handleStartOver}
        placeId={placeId}
      />
    );
  }

  // Fallback
  return null;
};

export default FeedbackForm;