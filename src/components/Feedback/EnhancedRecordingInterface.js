// src/components/Feedback/EnhancedRecordingInterface.js - COMPLETE FIXED VERSION
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

  // Initialize audio levels array
  useEffect(() => {
    setAudioLevels(Array(20).fill(10));
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // Audio level visualization
  const updateAudioLevels = () => {
    if (analyserRef.current && isRecording) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const levels = [];
      for (let i = 0; i < 20; i++) {
        const value = dataArray[i * 5] || 0;
        levels.push(Math.max(10, (value / 255) * 40 + 10));
      }
      
      setAudioLevels(levels);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Set up audio context for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Set up media recorder
      chunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setRecordingComplete(true);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setRecordingComplete(false);
      updateAudioLevels();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check your permissions and try again.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  // Reset recording
  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingComplete(false);
    setRecordingTime(0);
    setAudioLevels(Array(20).fill(10));
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Handle audio playback
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  // Submit handlers
  const handleAudioSubmit = () => {
    if (audioBlob && audioUrl) {
      onAudioComplete(audioBlob, audioUrl);
    }
  };

  const handleTextSubmit = () => {
    if (textFeedback.trim().length >= 10) {
      onTextComplete(textFeedback);
    } else {
      alert('Please provide at least 10 characters of feedback.');
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Method Selection */}
      <motion.div variants={itemVariants} className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Share Your Experience at {restaurantName}
        </h2>
        <p className="text-gray-300 mb-8">
          Choose how you'd like to leave your feedback
        </p>
        
        <div className="flex justify-center gap-4 p-2 glass-card rounded-2xl w-fit mx-auto">
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
                  </motion.button>
                  
                  {/* Audio level visualization */}
                  {isRecording && (
                    <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 flex items-end gap-1">
                      {audioLevels.map((level, index) => (
                        <motion.div
                          key={index}
                          className="w-2 bg-gradient-to-t from-blue-400 to-purple-400 rounded-full"
                          style={{ height: level }}
                          animate={{ height: level }}
                          transition={{ duration: 0.1 }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Instructions and Timer */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">
                    {isRecording ? 'Recording...' : 'Ready to Record'}
                  </h3>
                  
                  {isRecording ? (
                    <div className="space-y-2">
                      <p className="text-gray-300">
                        Share your thoughts about the food, service, and atmosphere
                      </p>
                      <div className="text-2xl font-mono text-blue-400">
                        {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-300 max-w-2xl mx-auto">
                        Tap the microphone to start recording your review. 
                        Talk about what you loved, what could be improved, 
                        and your overall experience.
                      </p>
                      <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Volume2 size={16} />
                          High Quality Audio
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} />
                          AI-Powered Analysis
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Recording complete interface
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="text-white" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Recording Complete!</h3>
                  <p className="text-gray-300">Review your recording and submit when ready</p>
                </div>

                {/* Audio Player */}
                <div className="glass-card-subtle rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlayback}
                      className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-300"
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
                  placeholder="Tell us about your visit... What did you love? What could be improved? How was the service, food quality, and atmosphere?"
                  className="w-full h-48 p-4 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  maxLength={2000}
                />
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">
                    {textFeedback.length >= 10 ? '✅' : '⏳'} 
                    {textFeedback.length >= 10 ? 'Ready to submit' : `Need ${10 - textFeedback.length} more characters`}
                  </span>
                  <span className="text-gray-400">
                    {textFeedback.length}/2000
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                onClick={handleTextSubmit}
                disabled={textFeedback.length < 10}
                className={`w-full py-4 px-8 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                  textFeedback.length >= 10
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg transform hover:scale-105'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                whileTap={textFeedback.length >= 10 ? { scale: 0.98 } : {}}
              >
                <Send size={20} />
                Submit Review
                <Zap size={16} className="text-yellow-300" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips Section */}
      <motion.div 
        variants={itemVariants}
        className="glass-card-subtle rounded-2xl p-6 border border-white/10"
      >
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="text-yellow-400" size={20} />
          Tips for Great Feedback
        </h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
          <div>
            <h5 className="font-medium text-white mb-2">Food Quality</h5>
            <p>Taste, presentation, temperature, freshness</p>
          </div>
          <div>
            <h5 className="font-medium text-white mb-2">Service</h5>
            <p>Staff friendliness, attentiveness, speed</p>
          </div>
          <div>
            <h5 className="font-medium text-white mb-2">Atmosphere</h5>
            <p>Ambiance, cleanliness, noise level</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EnhancedRecordingInterface;