// src/components/Feedback/FeedbackForm.js - WITH REALISTIC ANALYSIS & SHARE FUNCTIONALITY
import React, { useState, useEffect, useRef } from 'react';

const FeedbackForm = ({ restaurantId, restaurantName, placeId }) => {
  const [inputMethod, setInputMethod] = useState('audio');
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [step, setStep] = useState('input'); // 'input', 'recorded', 'analyzing', 'analysis', 'submitted'
  const [recordingTime, setRecordingTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const recordingIntervalRef = useRef(null);
  const recordingTimeoutRef = useRef(null);
  const analysisIntervalRef = useRef(null);

  const MAX_RECORDING_TIME = 30; // 30 seconds

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, []);

  // Simulate realistic analysis based on content
  const analyzeContent = (content) => {
    const lowerContent = content.toLowerCase();
    
    // Extract mentions of food, service, and atmosphere
    const foodKeywords = ['food', 'dish', 'meal', 'taste', 'flavor', 'delicious', 'tasty', 'spicy', 'sweet', 'salty', 'fresh', 'cooked', 'menu', 'portion', 'price', 'expensive', 'cheap', 'quality'];
    const serviceKeywords = ['service', 'staff', 'waiter', 'waitress', 'server', 'friendly', 'rude', 'helpful', 'slow', 'fast', 'attentive', 'polite', 'professional'];
    const atmosphereKeywords = ['atmosphere', 'ambiance', 'environment', 'music', 'noise', 'quiet', 'loud', 'clean', 'dirty', 'decor', 'lighting', 'seating', 'comfortable'];

    // Check what was mentioned
    const foodMentioned = foodKeywords.some(keyword => lowerContent.includes(keyword));
    const serviceMentioned = serviceKeywords.some(keyword => lowerContent.includes(keyword));
    const atmosphereMentioned = atmosphereKeywords.some(keyword => lowerContent.includes(keyword));

    // Determine sentiment (simple keyword analysis)
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'perfect', 'delicious', 'friendly', 'helpful', 'clean', 'comfortable'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'disgusting', 'rude', 'slow', 'dirty', 'uncomfortable', 'expensive', 'cold'];
    
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    
    let sentimentScore = 3; // Default neutral
    if (positiveCount > negativeCount) sentimentScore = Math.min(5, 3 + positiveCount);
    if (negativeCount > positiveCount) sentimentScore = Math.max(1, 3 - negativeCount);

    // Extract key points (split into sentences and filter meaningful ones)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keyPoints = sentences.slice(0, 3).map(s => s.trim()).filter(s => s.length > 0);

    return {
      sentiment_score: sentimentScore,
      summary: content.length > 200 ? content.substring(0, 200) + '...' : content,
      food_quality: foodMentioned ? "Based on your feedback about the food" : "No specific food feedback provided",
      service_quality: serviceMentioned ? "Based on your feedback about the service" : "No specific service feedback provided", 
      atmosphere: atmosphereMentioned ? "Based on your feedback about the atmosphere" : "No specific atmosphere feedback provided",
      key_points: keyPoints.length > 0 ? keyPoints : ["Overall dining experience feedback provided"],
      improvement_suggestions: [
        "Continue maintaining quality standards",
        "Keep focusing on customer satisfaction",
        "Monitor consistency across all service areas"
      ],
      food_mentioned: foodMentioned,
      service_mentioned: serviceMentioned,
      atmosphere_mentioned: atmosphereMentioned
    };
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setProgress(0);
    
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prevTime => {
        const newTime = prevTime + 0.1;
        setProgress((newTime / MAX_RECORDING_TIME) * 100);
        return newTime;
      });
    }, 100);
    
    recordingTimeoutRef.current = setTimeout(() => {
      handleStopRecording();
    }, MAX_RECORDING_TIME * 1000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    setStep('recorded');
  };

  const handleAnalyzeRecording = () => {
    setStep('analyzing');
    setAnalysisProgress(0);
    
    analysisIntervalRef.current = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(analysisIntervalRef.current);
          setTimeout(() => {
            // Use placeholder content for audio (in real app, this would be transcribed audio)
            const simulatedTranscription = `I had a great experience at ${restaurantName}. The food was delicious and the service was very friendly. The atmosphere was comfortable and welcoming.`;
            setAnalysisResult(analyzeContent(simulatedTranscription));
            setStep('analysis');
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const handleSubmitText = () => {
    if (textInput.trim().length < 10) {
      alert('Please provide more detailed feedback (at least 10 characters).');
      return;
    }
    
    setStep('analyzing');
    setAnalysisProgress(0);
    
    analysisIntervalRef.current = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(analysisIntervalRef.current);
          setTimeout(() => {
            setAnalysisResult(analyzeContent(textInput));
            setStep('analysis');
          }, 500);
          return 100;
        }
        return prev + 3;
      });
    }, 100);
  };

  const handleSaveReview = () => {
    setStep('submitted');
    setShowShareModal(true);
  };

  const generateFormattedReview = () => {
    if (!analysisResult) return '';
    
    let formattedReview = `⭐ ${analysisResult.sentiment_score}/5 - Review for ${restaurantName}\n\n`;
    
    // Add summary
    formattedReview += `📝 SUMMARY:\n${analysisResult.summary}\n\n`;
    
    // Add category breakdowns
    formattedReview += `🍽️ FOOD QUALITY:\n${analysisResult.food_quality}\n\n`;
    formattedReview += `👥 SERVICE QUALITY:\n${analysisResult.service_quality}\n\n`;
    formattedReview += `🏛️ ATMOSPHERE:\n${analysisResult.atmosphere}\n\n`;
    
    // Add key points
    if (analysisResult.key_points && analysisResult.key_points.length > 0) {
      formattedReview += `✨ KEY HIGHLIGHTS:\n`;
      analysisResult.key_points.forEach((point, index) => {
        formattedReview += `${index + 1}. ${point}\n`;
      });
      formattedReview += `\n`;
    }
    
    // Add footer
    formattedReview += `#${restaurantName.replace(/\s+/g, '')} #RestaurantReview #DiningExperience`;
    
    return formattedReview;
  };

  const handleCopyReview = async () => {
    try {
      const formattedText = generateFormattedReview();
      await navigator.clipboard.writeText(formattedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy review. Please try again.');
    }
  };

  const getGoogleReviewsLink = () => {
    if (placeId) {
      return `https://search.google.com/local/writereview?placeid=${placeId}`;
    } else {
      // Fallback if no place ID
      const encodedName = encodeURIComponent(restaurantName);
      return `https://www.google.com/maps/search/${encodedName}`;
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
    setShowShareModal(false);
    setCopySuccess(false);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Share Modal Component
  const ShareModal = () => {
    if (!showShareModal) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          color: '#1f2937',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#22c55e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              fontSize: '30px'
            }}>
              📤
            </div>
            <h2 style={{ fontSize: '28px', marginBottom: '10px', color: '#1f2937' }}>
              Share Your Review
            </h2>
            <p style={{ color: '#6b7280' }}>
              Copy your formatted review and share it on Google Reviews
            </p>
          </div>

          {/* Formatted Review Preview */}
          <div style={{
            backgroundColor: '#f9fafb',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.6',
            maxHeight: '300px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {generateFormattedReview()}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '15px',
            flexDirection: 'column'
          }}>
            <button
              onClick={handleCopyReview}
              style={{
                backgroundColor: copySuccess ? '#22c55e' : '#3b82f6',
                color: 'white',
                padding: '15px 30px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {copySuccess ? '✅ Copied!' : '📋 Copy Review Text'}
            </button>
            
            <a
              href={getGoogleReviewsLink()}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#db4437',
                color: 'white',
                padding: '15px 30px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '10px',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              🔗 Write Google Review
            </a>
            
            <button
              onClick={() => setShowShareModal(false)}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '12px 24px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Analyzing screen
  if (step === 'analyzing') {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px',
        backgroundColor: 'rgba(147, 51, 234, 0.2)',
        border: '2px solid #8b5cf6',
        borderRadius: '20px',
        textAlign: 'center',
        color: 'white',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 30px auto',
          fontSize: '40px',
          animation: 'spin 2s linear infinite'
        }}>
          🤖
        </div>
        <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>
          Analyzing Your Feedback
        </h2>
        <p style={{ fontSize: '18px', marginBottom: '30px', color: '#c084fc' }}>
          Processing your review and extracting insights...
        </p>
        
        <div style={{
          width: '100%',
          maxWidth: '400px',
          height: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          margin: '0 auto 20px auto',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: `${analysisProgress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #f59e0b)',
            borderRadius: '8px',
            transition: 'width 0.2s ease-out',
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.6)'
          }} />
        </div>
        
        <p style={{ fontSize: '16px', color: '#a855f7', fontFamily: 'monospace' }}>
          {analysisProgress.toFixed(0)}% Complete
        </p>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Analysis Results screen
  if (step === 'analysis' && analysisResult) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: 'white',
        backdropFilter: 'blur(15px)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(45deg, #22c55e, #10b981)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            fontSize: '40px'
          }}>
            ✨
          </div>
          <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>
            Analysis Complete!
          </h2>
          <p style={{ fontSize: '18px', color: '#9ca3af' }}>
            Here's what we found in your review
          </p>
        </div>

        {/* Rating Stars */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>
            {[...Array(5)].map((_, i) => (
              <span key={i} style={{ 
                color: i < Math.floor(analysisResult.sentiment_score) ? '#fbbf24' : '#374151',
                marginRight: '5px'
              }}>
                ⭐
              </span>
            ))}
          </div>
          <p style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {analysisResult.sentiment_score}/5.0 Overall Rating
          </p>
        </div>

        {/* Summary */}
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#60a5fa' }}>
            📝 Review Summary
          </h3>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            {analysisResult.summary}
          </p>
        </div>

        {/* Category Analysis */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: analysisResult.food_mentioned ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
            border: `1px solid ${analysisResult.food_mentioned ? 'rgba(34, 197, 94, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`,
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h4 style={{ fontSize: '16px', marginBottom: '10px', color: analysisResult.food_mentioned ? '#4ade80' : '#9ca3af' }}>
              🍽️ Food Quality
            </h4>
            <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
              {analysisResult.food_quality}
            </p>
          </div>
          
          <div style={{
            backgroundColor: analysisResult.service_mentioned ? 'rgba(168, 85, 247, 0.1)' : 'rgba(107, 114, 128, 0.1)',
            border: `1px solid ${analysisResult.service_mentioned ? 'rgba(168, 85, 247, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`,
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h4 style={{ fontSize: '16px', marginBottom: '10px', color: analysisResult.service_mentioned ? '#a855f7' : '#9ca3af' }}>
              👥 Service Quality
            </h4>
            <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
              {analysisResult.service_quality}
            </p>
          </div>
          
          <div style={{
            backgroundColor: analysisResult.atmosphere_mentioned ? 'rgba(245, 158, 11, 0.1)' : 'rgba(107, 114, 128, 0.1)',
            border: `1px solid ${analysisResult.atmosphere_mentioned ? 'rgba(245, 158, 11, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`,
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h4 style={{ fontSize: '16px', marginBottom: '10px', color: analysisResult.atmosphere_mentioned ? '#f59e0b' : '#9ca3af' }}>
              🏛️ Atmosphere
            </h4>
            <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
              {analysisResult.atmosphere}
            </p>
          </div>
        </div>

        {/* Key Points */}
        {analysisResult.key_points && analysisResult.key_points.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#10b981' }}>
              ✨ Key Points Mentioned
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {analysisResult.key_points.map((point, index) => (
                <li key={index} style={{ fontSize: '16px', marginBottom: '8px', lineHeight: '1.5' }}>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleStartOver}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          >
            🔄 Start Over
          </button>
          
          <button
            onClick={handleSaveReview}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              backgroundColor: '#22c55e',
              color: 'white',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#16a34a'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#22c55e'}
          >
            💾 Save Review
          </button>
        </div>
      </div>
    );
  }

  // Final success screen
  if (step === 'submitted') {
    return (
      <>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '40px',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          border: '2px solid #22c55e',
          borderRadius: '20px',
          textAlign: 'center',
          color: 'white',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#22c55e',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px auto',
            fontSize: '40px',
            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)'
          }}>
            ✅
          </div>
          <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>
            Review Saved! 🎉
          </h2>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>
            Your review for {restaurantName} has been analyzed and saved successfully!
          </p>
          {recordingTime > 0 && (
            <p style={{ fontSize: '16px', marginBottom: '30px', color: '#86efac' }}>
              Recording duration: {formatTime(recordingTime)}
            </p>
          )}
          <button
            onClick={handleStartOver}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '15px 30px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            Leave Another Review
          </button>
        </div>
        <ShareModal />
      </>
    );
  }

  // Recording completed - show analyze button
  if (step === 'recorded') {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: 'white',
        backdropFilter: 'blur(15px)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#22c55e',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 30px auto',
          fontSize: '40px',
          boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)'
        }}>
          🎙️
        </div>
        <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>
          Recording Complete!
        </h2>
        <p style={{ fontSize: '18px', marginBottom: '10px' }}>
          Duration: {formatTime(recordingTime)}
        </p>
        <p style={{ fontSize: '16px', marginBottom: '40px', color: '#9ca3af' }}>
          Ready to analyze your feedback with AI
        </p>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button
            onClick={handleStartOver}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              transition: 'all 0.3s ease'
            }}
          >
            🔄 Record Again
          </button>
          
          <button
            onClick={handleAnalyzeRecording}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
              color: 'white',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            🤖 Analyze Recording
          </button>
        </div>
      </div>
    );
  }

  // Main input interface
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white',
      backdropFilter: 'blur(15px)'
    }}>
      <h2 style={{
        fontSize: '36px',
        textAlign: 'center',
        marginBottom: '10px',
        fontWeight: 'bold',
        background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        🎤 Leave Your Review
      </h2>
      <p style={{
        fontSize: '20px',
        textAlign: 'center',
        marginBottom: '40px',
        color: '#fb923c'
      }}>
        for {restaurantName}
      </p>
      
      {/* Method Selection */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <button
          onClick={() => setInputMethod('audio')}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            backgroundColor: inputMethod === 'audio' ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: inputMethod === 'audio' ? 'bold' : 'normal',
            transform: inputMethod === 'audio' ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.3s ease',
            boxShadow: inputMethod === 'audio' ? '0 4px 16px rgba(59, 130, 246, 0.3)' : 'none'
          }}
        >
          🎤 Voice Recording
        </button>
        <button
          onClick={() => setInputMethod('text')}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            backgroundColor: inputMethod === 'text' ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: inputMethod === 'text' ? 'bold' : 'normal',
            transform: inputMethod === 'text' ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.3s ease',
            boxShadow: inputMethod === 'text' ? '0 4px 16px rgba(59, 130, 246, 0.3)' : 'none'
          }}
        >
          ✍️ Write Review
        </button>
      </div>

      {/* Audio Recording Interface */}
      {inputMethod === 'audio' && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              border: 'none',
              fontSize: '60px',
              cursor: 'pointer',
              backgroundColor: isRecording ? '#ef4444' : '#3b82f6',
              color: 'white',
              marginBottom: '30px',
              boxShadow: isRecording 
                ? '0 8px 32px rgba(239, 68, 68, 0.4)' 
                : '0 8px 32px rgba(59, 130, 246, 0.3)',
              transform: isRecording ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>
          
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{
              fontSize: '24px',
              marginBottom: '10px',
              fontWeight: 'bold'
            }}>
              {isRecording ? '🔴 Recording...' : '🎤 Ready to Record'}
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#d1d5db',
              marginBottom: '15px'
            }}>
              {isRecording 
                ? 'Speak now about your experience (click stop button or wait for auto-stop)' 
                : `Click the microphone to start recording (max ${MAX_RECORDING_TIME} seconds)`
              }
            </p>
            
            {/* Timer Display */}
            {isRecording && (
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#ef4444',
                marginBottom: '20px',
                fontFamily: 'monospace'
              }}>
                {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
              </div>
            )}
            
            {/* Progress Bar */}
            {isRecording && (
              <div style={{
                width: '100%',
                maxWidth: '400px',
                height: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                margin: '0 auto 20px auto',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
                  borderRadius: '6px',
                  transition: 'width 0.1s ease-out',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                }} />
              </div>
            )}
          </div>

          {/* Fake audio levels when recording */}
          {isRecording && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: '3px',
              height: '80px',
              marginTop: '20px'
            }}>
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '6px',
                    background: 'linear-gradient(to top, #3b82f6, #8b5cf6)',
                    borderRadius: '3px',
                    height: `${Math.random() * 60 + 10}px`,
                    animation: `pulse ${Math.random() * 0.5 + 0.5}s infinite alternate`,
                    boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Text Input Interface */}
      {inputMethod === 'text' && (
        <div>
          <h3 style={{
            fontSize: '24px',
            textAlign: 'center',
            marginBottom: '20px',
            fontWeight: 'bold'
          }}>
            ✍️ Write Your Review
          </h3>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={`Tell us about your experience at ${restaurantName}... 

Talk about:
• Food quality and taste
• Service and staff
• Atmosphere and environment
• Overall experience`}
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
};

export default FeedbackForm;