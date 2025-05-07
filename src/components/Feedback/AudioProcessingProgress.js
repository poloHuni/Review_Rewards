// src/components/Feedback/AudioProcessingProgress.js
import React, { useState, useEffect } from 'react';

const AudioProcessingProgress = ({ processingStep, isProcessing }) => {
  const [loadingDots, setLoadingDots] = useState('.');
  const [progressPercentage, setProgressPercentage] = useState(0);
  
  // Animate the loading dots
  useEffect(() => {
    if (!isProcessing) return;
    
    const dotsInterval = setInterval(() => {
      setLoadingDots(dots => dots.length >= 3 ? '.' : dots + '.');
    }, 500);
    
    return () => clearInterval(dotsInterval);
  }, [isProcessing]);
  
  // Animate the progress percentage
  useEffect(() => {
    if (!isProcessing) return;
    
    // Map processing step to target percentage
    let targetPercentage = 0;
    switch (processingStep) {
      case 'starting': targetPercentage = 10; break;
      case 'processing': targetPercentage = 30; break;
      case 'transcribing': targetPercentage = 60; break;
      case 'analyzing': targetPercentage = 85; break;
      case 'completing': targetPercentage = 95; break;
      case 'complete': targetPercentage = 100; break;
      default: targetPercentage = 10;
    }
    
    // Simulate progress animation toward target
    const progressInterval = setInterval(() => {
      setProgressPercentage(current => {
        if (current >= targetPercentage) {
          clearInterval(progressInterval);
          return current;
        }
        return current + 1;
      });
    }, 50);
    
    return () => clearInterval(progressInterval);
  }, [processingStep, isProcessing]);
  
  if (!isProcessing) return null;
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white flex items-center">
          <span className="animate-pulse mr-2">🎙️</span>
          Processing Audio{loadingDots}
        </h3>
        <span className="text-blue-400 font-mono">{progressPercentage}%</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      {/* Current step */}
      <div className="mt-4 text-gray-400 text-sm">
        {processingStep === 'starting' && 'Initializing audio processing...'}
        {processingStep === 'processing' && 'Cleaning up audio for better results...'}
        {processingStep === 'transcribing' && 'Converting speech to text...'}
        {processingStep === 'analyzing' && 'Analyzing your feedback...'}
        {processingStep === 'completing' && 'Finalizing your review...'}
        {processingStep === 'complete' && 'Processing complete!'}
      </div>
      
      {/* Steps indicators */}
      <div className="mt-6 flex justify-between">
        <div className={`flex flex-col items-center ${progressPercentage >= 10 ? 'text-blue-400' : 'text-gray-600'}`}>
          <div className={`w-4 h-4 rounded-full ${progressPercentage >= 10 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
          <span className="text-xs mt-1">Start</span>
        </div>
        <div className={`flex flex-col items-center ${progressPercentage >= 30 ? 'text-blue-400' : 'text-gray-600'}`}>
          <div className={`w-4 h-4 rounded-full ${progressPercentage >= 30 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
          <span className="text-xs mt-1">Process</span>
        </div>
        <div className={`flex flex-col items-center ${progressPercentage >= 60 ? 'text-blue-400' : 'text-gray-600'}`}>
          <div className={`w-4 h-4 rounded-full ${progressPercentage >= 60 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
          <span className="text-xs mt-1">Transcribe</span>
        </div>
        <div className={`flex flex-col items-center ${progressPercentage >= 85 ? 'text-blue-400' : 'text-gray-600'}`}>
          <div className={`w-4 h-4 rounded-full ${progressPercentage >= 85 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
          <span className="text-xs mt-1">Analyze</span>
        </div>
        <div className={`flex flex-col items-center ${progressPercentage >= 100 ? 'text-blue-400' : 'text-gray-600'}`}>
          <div className={`w-4 h-4 rounded-full ${progressPercentage >= 100 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
          <span className="text-xs mt-1">Complete</span>
        </div>
      </div>
    </div>
  );
};

export default AudioProcessingProgress;