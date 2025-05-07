// src/components/Feedback/AudioRecorder.js
import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

const AudioRecorder = ({ onAudioSaved, restaurantId, onProcessingStart }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  
  const { currentUser } = useAuth();
  
  const MAX_RECORDING_TIME = 25; // seconds
  
  useEffect(() => {
    return () => {
      // Cleanup function
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
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
          
          // IMPORTANT: Call onAudioSaved immediately when recording completes
          // This ensures the parent component has the audio data right away
          onAudioSaved(blob, url);
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

  // Function to analyze the recording
  const analyzeRecording = () => {
    // Double-check if we have a valid audio blob
    if (!audioBlob || audioBlob.size === 0) {
      setError('No audio recording found. Please try recording again.');
      return;
    }
    
    setProcessing(true);
    
    try {
      // Start the analysis process immediately
      if (onProcessingStart) {
        onProcessingStart();
      }
      
      // Handle the upload in the background
      uploadInBackground();
    } catch (err) {
      setError(`Failed to analyze recording: ${err.message}`);
      setProcessing(false);
    }
  };
  
  // Function to handle background upload
  const uploadInBackground = async () => {
    try {
      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const userId = currentUser?.uid || currentUser?.user_id || 'anonymous';
      const filename = `review_${restaurantId}_${userId}_${timestamp}.wav`;
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `audio_recordings/${filename}`);
      await uploadBytes(storageRef, audioBlob);
      await getDownloadURL(storageRef);
    } catch (err) {
      console.error('Background upload error:', err);
      // Don't surface this error to the user since analysis is the priority
    }
  };

  const recordAgain = () => {
    setRecordingComplete(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setError(null);
  };

  return (
    <div className="audio-recorder p-4 bg-gray-800 rounded-lg shadow">
      <div className="flex flex-col items-center space-y-4">
        {error && (
          <div className="w-full p-3 bg-red-900 text-white rounded-md">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="instruction-container bg-gray-700 p-4 rounded-lg w-full mb-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🎙️</span>
            <div>
              <p className="text-gray-200">
                {isRecording 
                  ? "Recording in progress... Click the microphone again to stop." 
                  : "Click the microphone to start recording and click again to stop."}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Maximum recording time: {MAX_RECORDING_TIME} seconds
              </p>
            </div>
          </div>
        </div>
        
        {isRecording && (
          <div className="recording-timer">
            <div className="text-center">
              <span className="text-xl font-mono">{recordingTime}s</span>
              <div className="h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-red-600 transition-all ease-linear duration-1000" 
                  style={{ width: `${(recordingTime / MAX_RECORDING_TIME) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {!recordingComplete ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`mic-button w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-10 w-10 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={isRecording 
                  ? "M5 5h14v14H5z" // Stop icon (square)
                  : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"} // Mic icon
              />
            </svg>
          </button>
        ) : (
          <div className="recording-complete bg-gray-700 p-4 rounded-lg w-full">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <p className="text-gray-200 font-medium">Recording completed!</p>
                <p className="text-gray-400 text-sm mt-1">
                  Review your recording below.
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <audio src={audioUrl} controls className="w-full" />
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={analyzeRecording}
                disabled={processing || !audioBlob}
                className={`py-2 px-4 text-white rounded-md flex items-center justify-center ${
                  audioBlob && !processing 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-900 cursor-not-allowed'
                }`}
              >
                {processing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>🔍 Analyze Feedback</>
                )}
              </button>
              <button
                onClick={recordAgain}
                disabled={processing}
                className="py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
              >
                🔄 Record Again
              </button>
            </div>
          </div>
        )}
        
        <div className="recording-tips bg-gray-700 p-4 rounded-lg w-full mt-4">
          <h4 className="text-lg font-medium text-white flex items-center">
            <span className="mr-2">📝</span> Tips for Better Audio Quality
          </h4>
          <ul className="text-gray-300 list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Speak clearly and at a normal pace</li>
            <li>Keep the microphone 4-6 inches from your mouth</li>
            <li>Reduce background noise when possible</li>
            <li>Ensure your device microphone is not covered</li>
            <li>Use headphones with a built-in microphone for better results</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;