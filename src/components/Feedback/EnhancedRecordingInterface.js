// Enhanced Beautiful Recording Interface Component
// Replace the recording section in your FeedbackForm.js

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  RotateCcw, 
  Send, 
  Zap,
  Sparkles,
  Volume2,
  Heart,
  Star
} from 'lucide-react';

const EnhancedRecordingInterface = ({ 
  onAudioComplete, 
  onTextComplete, 
  restaurantName 
}) => {
  const [inputMethod, setInputMethod] = useState('audio');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [textFeedback, setTextFeedback] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [audioLevels, setAudioLevels] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);

  const MAX_RECORDING_TIME = 120; // 2 minutes

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const waveVariants = {
    animate: {
      height: [10, 30, 10],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Generate random audio levels for visualization
  const generateAudioLevels = () => {
    return Array.from({ length: 20 }, () => Math.random() * 100);
  };

  // Start recording with enhanced audio analysis
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Setup audio analysis for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
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
        
        // Stop audio analysis
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);
      
      // Start audio visualization
      startAudioVisualization();
      
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  // Audio visualization
  const startAudioVisualization = () => {
    const updateAudioLevels = () => {
      if (analyserRef.current && isRecording) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Convert to percentage and create levels array
        const levels = Array.from({ length: 20 }, (_, i) => {
          const index = Math.floor((i / 20) * bufferLength);
          return (dataArray[index] / 255) * 100;
        });
        
        setAudioLevels(levels);
        animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
      }
    };
    updateAudioLevels();
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  // Format time display
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
    setAudioLevels([]);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Play/pause audio
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle audio submission
  const handleAudioSubmit = () => {
    if (audioBlob && onAudioComplete) {
      onAudioComplete(audioBlob, audioUrl);
    }
  };

  // Handle text submission
  const handleTextSubmit = () => {
    if (textFeedback.trim() && onTextComplete) {
      onTextComplete(textFeedback.trim());
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="text-center mb-8" variants={itemVariants}>
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Share Your Experience
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          Tell us about your visit to <span className="font-semibold text-purple-400">{restaurantName}</span>
        </p>
      </motion.div>

      {/* Input Method Selector */}
      <motion.div 
        className="flex justify-center mb-8"
        variants={itemVariants}
      >
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
          <div className="flex gap-2">
            <button
              onClick={() => setInputMethod('audio')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                inputMethod === 'audio'
                  ? 'bg-white text-gray-900 shadow-lg transform scale-105'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Mic size={18} />
              Voice Recording
            </button>
            <button
              onClick={() => setInputMethod('text')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                inputMethod === 'text'
                  ? 'bg-white text-gray-900 shadow-lg transform scale-105'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              ✍️ Write Review
            </button>
          </div>
        </div>
      </motion.div>

      {/* Audio Recording Interface */}
      <AnimatePresence mode="wait">
        {inputMethod === 'audio' && (
          <motion.div
            key="audio"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="glass-card rounded-3xl p-8 border border-white/20"
          >
            {!recordingComplete ? (
              <div className="text-center space-y-8">
                {/* Recording Button */}
                <div className="relative">
                  <motion.button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-32 h-32 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-2xl transition-all duration-300 ${
                      isRecording
                        ? 'bg-gradient-to-r from-red-500 to-pink-500'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-110'
                    }`}
                    animate={isRecording ? "pulse" : ""}
                    variants={pulseVariants}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isRecording ? <MicOff size={48} /> : <Mic size={48} />}
                    
                    {/* Pulse rings during recording */}
                    {isRecording && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-red-400/30"
                          animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.4, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-red-400/50"
                          animate={{ scale: [1, 1.3, 1.8], opacity: [0.6, 0.3, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        />
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Recording Status */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">
                    {isRecording ? (
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="flex items-center justify-center gap-2"
                      >
                        🔴 Recording... {formatTime(recordingTime)}
                      </motion.span>
                    ) : (
                      '🎙️ Ready to Record'
                    )}
                  </h3>
                  
                  <p className="text-gray-300">
                    {isRecording 
                      ? 'Share your thoughts about the food, service, and atmosphere' 
                      : 'Tap the microphone to start recording your review'
                    }
                  </p>
                </div>

                {/* Audio Visualization */}
                {isRecording && (
                  <motion.div 
                    className="flex justify-center items-end gap-1 h-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {Array.from({ length: 20 }, (_, i) => (
                      <motion.div
                        key={i}
                        className="bg-gradient-to-t from-purple-500 to-pink-400 rounded-full w-2"
                        animate={{
                          height: audioLevels[i] ? `${Math.max(audioLevels[i], 10)}%` : "10%"
                        }}
                        transition={{ duration: 0.1 }}
                        style={{
                          minHeight: "8px",
                          maxHeight: "60px"
                        }}
                      />
                    ))}
                  </motion.div>
                )}

                {/* Progress Bar */}
                {isRecording && (
                  <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-red-400 to-pink-400 h-full rounded-full"
                      style={{ width: `${(recordingTime / MAX_RECORDING_TIME) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

                {/* Tips */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Heart className="text-pink-400" size={20} />
                    Quick Tips for Great Reviews
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Star className="text-yellow-400" size={16} />
                      Speak naturally and clearly
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="text-yellow-400" size={16} />
                      Mention specific dishes you tried
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="text-yellow-400" size={16} />
                      Share what made your visit special
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="text-yellow-400" size={16} />
                      Include both positives and improvements
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Recording Complete Interface */
              <div className="space-y-6">
                <motion.div 
                  className="text-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      ✅
                    </motion.div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Recording Complete!</h3>
                  <p className="text-gray-300">Duration: {formatTime(recordingTime)}</p>
                </motion.div>

                {/* Audio Player */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlayback}
                      className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    
                    <div className="flex-1">
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        className="w-full"
                        controls
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <motion.button
                    onClick={resetRecording}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 px-6 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-2 border border-white/20"
                    whileTap={{ scale: 0.98 }}
                  >
                    <RotateCcw size={20} />
                    Record Again
                  </motion.button>
                  
                  <motion.button
                    onClick={handleAudioSubmit}
                    className="flex-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-4 px-8 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg transform hover:scale-105"
                    whileTap={{ scale: 0.98 }}
                  >
                    <Send size={20} />
                    Submit Review
                    <Zap size={16} className="text-yellow-300" />
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Text Input Interface */}
        {inputMethod === 'text' && (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="glass-card rounded-3xl p-8 border border-white/20"
          >
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  ✍️
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Write Your Review</h3>
                <p className="text-gray-300">Share your dining experience in your own words</p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={textFeedback}
                  onChange={(e) => setTextFeedback(e.target.value)}
                  placeholder="Tell us about your visit... What did you love? What could be improved? How was the food, service, and atmosphere?"
                  className="w-full h-40 bg-white/5 border border-white/20 rounded-2xl p-6 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  rows={6}
                />
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">
                    {textFeedback.length} characters
                  </span>
                  <span className="text-gray-400">
                    Minimum 50 characters recommended
                  </span>
                </div>
              </div>

              <motion.button
                onClick={handleTextSubmit}
                disabled={textFeedback.trim().length < 10}
                className={`w-full py-4 px-6 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                  textFeedback.trim().length >= 10
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg transform hover:scale-105'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <Send size={20} />
                Submit Review
                {textFeedback.trim().length >= 10 && <Zap size={16} className="text-yellow-300" />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EnhancedRecordingInterface;