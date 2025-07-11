// src/components/Feedback/FeedbackForm.js
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
  
  const MAX_RECORDING_TIME = 30; // 30 seconds

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

  // REAL Audio Processing Function
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
      analysis.restaurant_name = restaurantName; // ADD THIS LINE
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
      setStep('input');
    }
  };

  // REAL Text Analysis Function  
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
      analysis.restaurant_name = restaurantName; // ADD THIS LINE
      
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

  // Main input screen
  if (step === 'input') {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        color: 'white',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '32px',
            marginBottom: '20px',
            background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            Share Your Experience
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.8 }}>
            Tell us about your visit to {restaurantName}
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '15px',
            marginBottom: '20px',
            color: '#fca5a5',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Input method selector */}
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '8px',
          marginBottom: '40px',
          backdropFilter: 'blur(10px)'
        }}>
          <button
            onClick={() => setInputMethod('audio')}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              borderRadius: '10px',
              background: inputMethod === 'audio' 
                ? 'linear-gradient(45deg, #8b5cf6, #ec4899)' 
                : 'transparent',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '16px'
            }}
          >
            🎤 Voice Feedback
          </button>
          <button
            onClick={() => setInputMethod('text')}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              borderRadius: '10px',
              background: inputMethod === 'text' 
                ? 'linear-gradient(45deg, #8b5cf6, #ec4899)' 
                : 'transparent',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '16px'
            }}
          >
            ✍️ Written Feedback
          </button>
        </div>

        {/* Audio Recording Interface */}
        {inputMethod === 'audio' && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: isRecording 
                ? 'linear-gradient(45deg, #ef4444, #dc2626)' 
                : 'linear-gradient(45deg, #8b5cf6, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 30px auto',
              cursor: 'pointer',
              fontSize: '40px',
              transition: 'all 0.3s ease',
              transform: isRecording ? 'scale(1.1)' : 'scale(1)',
              boxShadow: isRecording 
                ? '0 0 30px rgba(239, 68, 68, 0.5)' 
                : '0 0 30px rgba(139, 92, 246, 0.3)'
            }}
            onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? '⏸️' : '🎤'}
            </div>

            {isRecording && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  color: '#ef4444'
                }}>
                  {formatTime(recordingTime)}
                </div>
                <div style={{
                  width: '200px',
                  height: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  margin: '0 auto',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(recordingTime / MAX_RECORDING_TIME) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(45deg, #ef4444, #dc2626)',
                    transition: 'width 1s linear'
                  }} />
                </div>
              </div>
            )}

            <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>
              {isRecording ? 'Recording...' : 'Ready to Record'}
            </h3>
            <p style={{ fontSize: '16px', opacity: 0.8, lineHeight: '1.6' }}>
              {isRecording 
                ? `Share your thoughts about ${restaurantName}. Speak clearly and mention food, service, and atmosphere.`
                : 'Tap the microphone to start recording your feedback. You have up to 30 seconds.'
              }
            </p>
          </div>
        )}

        {/* Text Input Interface */}
        {inputMethod === 'text' && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '30px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>
              Write Your Feedback
            </h3>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`What did you think of ${restaurantName}? Share details about the food quality, service, atmosphere, and overall experience.`}
              style={{
                width: '100%',
                height: '200px',
                padding: '20px',
                fontSize: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: 'white',
                resize: 'none',
                outline: 'none',
                marginBottom: '20px',
                transition: 'border-color 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div style={{
              textAlign: 'right',
              fontSize: '14px',
              color: '#9ca3af',
              marginBottom: '20px'
            }}>
              {textInput.length} characters
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleSubmitText}
                disabled={textInput.length < 10}
                style={{
                  padding: '15px 40px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: textInput.length >= 10 ? 'pointer' : 'not-allowed',
                  background: textInput.length >= 10 ? 'linear-gradient(45deg, #8b5cf6, #ec4899)' : '#6b7280',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  margin: '0 auto',
                  transform: textInput.length >= 10 ? 'scale(1)' : 'scale(0.95)',
                  transition: 'all 0.3s ease',
                  boxShadow: textInput.length >= 10 ? '0 4px 16px rgba(139, 92, 246, 0.4)' : 'none'
                }}
              >
                🤖 Analyze & Submit
              </button>
              {textInput.length < 10 && (
                <p style={{
                  color: '#fbbf24',
                  fontSize: '14px',
                  marginTop: '10px'
                }}>
                  Please write at least 10 characters
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Recording complete screen
  if (step === 'recorded') {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        color: 'white',
        minHeight: '100vh',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#22c55e',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            fontSize: '40px'
          }}>
            ✅
          </div>
          <h2 style={{ fontSize: '28px', marginBottom: '10px' }}>
            Recording Complete!
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.8 }}>
            Review your recording and analyze it
          </p>
        </div>

        {/* Audio player */}
        {audioUrl && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '30px',
            backdropFilter: 'blur(10px)'
          }}>
            <audio 
              src={audioUrl} 
              controls 
              style={{ width: '100%' }}
            />
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleAnalyzeAudio}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
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
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '10px',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🔄 Record Again
          </button>
        </div>
      </div>
    );
  }

  // Analyzing screen
  if (step === 'analyzing') {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        color: 'white',
        minHeight: '100vh',
        textAlign: 'center'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          border: '4px solid rgba(139, 92, 246, 0.3)',
          borderTop: '4px solid #8b5cf6',
          borderRadius: '50%',
          margin: '0 auto 30px auto',
          animation: 'spin 1s linear infinite'
        }} />
        
        <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>
          Analyzing Your Feedback
        </h2>
        
        <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '30px' }}>
          {analysisProgress < 30 && "Processing your input..."}
          {analysisProgress >= 30 && analysisProgress < 60 && "Converting speech to text..."}
          {analysisProgress >= 60 && analysisProgress < 90 && "Analyzing sentiment and insights..."}
          {analysisProgress >= 90 && "Finalizing your review..."}
        </p>

        {/* Progress bar */}
        <div style={{
          width: '300px',
          height: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          margin: '0 auto 20px auto',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${analysisProgress}%`,
            height: '100%',
            background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
            transition: 'width 0.5s ease'
          }} />
        </div>

        <div style={{ fontSize: '14px', opacity: 0.6 }}>
          {analysisProgress}% Complete
        </div>

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Analysis results screen
  if (step === 'analysis' && analysisResult) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        color: 'white',
        minHeight: '100vh'
      }}>
        <ReviewAnalysis 
          reviewData={analysisResult}
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
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      color: 'white',
      minHeight: '100vh',
      textAlign: 'center'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '3px solid rgba(139, 92, 246, 0.3)',
        borderTop: '3px solid #8b5cf6',
        borderRadius: '50%',
        margin: '0 auto 20px auto',
        animation: 'spin 1s linear infinite'
      }} />
      <p>Loading feedback form...</p>
    </div>
  );
};

export default FeedbackForm;