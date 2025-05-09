// src/components/Feedback/AudioWaveVisualizer.js
import React, { useRef, useEffect } from 'react';

/**
 * Audio waveform visualization component
 * Uses canvas to render real-time audio waveform visualization
 * 
 * @param {Uint8Array} audioData - Audio frequency data from analyzer node
 * @param {boolean} isRecording - Whether recording is active
 */
const AudioWaveVisualizer = ({ audioData, isRecording }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  // Draw waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || !isRecording || !audioData?.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match container
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up drawing styles
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(66, 153, 225, 0.8)'; // Blue
    
    // Draw frequency bars
    const drawFrequencyBars = () => {
      if (!audioData || !isRecording) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate bar width based on canvas width and data length
      const barWidth = canvas.width / audioData.length;
      const centerY = canvas.height / 2;
      
      // Draw each bar
      for (let i = 0; i < audioData.length; i++) {
        // Get normalized value (0-1)
        const value = audioData[i] / 255;
        
        // Calculate bar height (taller in the middle, shorter at edges)
        const positionFactor = 1 - Math.abs((i / audioData.length) - 0.5) * 2;
        const barHeight = value * canvas.height * 0.8 * positionFactor;
        
        // X position
        const x = i * barWidth;
        
        // Set color based on frequency and intensity
        const hue = 200 + (value * 60); // Blue to purple range
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${value * 0.8 + 0.2})`;
        
        // Draw the bar (centered vertically)
        ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
      }
      
      // Draw the waveform line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      
      for (let i = 0; i < audioData.length; i++) {
        const value = audioData[i] / 255;
        const x = i * barWidth + barWidth / 2;
        const y = centerY - (value * canvas.height * 0.4);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Continue animation loop
      animationRef.current = requestAnimationFrame(drawFrequencyBars);
    };
    
    // Start drawing
    drawFrequencyBars();
    
    // Cleanup animation on unmount or when dependency changes
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioData, isRecording]);
  
  // Handle window resize to update canvas dimensions
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.clientWidth;
        canvasRef.current.height = canvasRef.current.clientHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      style={{
        background: 'rgba(17, 24, 39, 0.5)',
        borderRadius: '0.5rem'
      }}
    />
  );
};

export default AudioWaveVisualizer;