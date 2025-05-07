// src/services/audioService.js
import axios from 'axios';

// Function to transcribe audio using Lelapa API with better error handling and retries
export const transcribeAudio = async (audioBlob) => {
  try {
    console.log('Starting transcription with blob size:', audioBlob.size);
    console.log('Audio blob type:', audioBlob.type);
    
    // DIRECT OPENAI API ATTEMPT FIRST
    try {
      const transcription = await transcribeWithOpenAI(audioBlob);
      if (transcription && transcription.length > 10) {
        console.log('OpenAI transcription success:', transcription);
        return transcription;
      }
    } catch (err) {
      console.warn('OpenAI transcription failed, trying alternatives:', err.message);
    }
    
    // Create form data for Lelapa API call
    const formData = new FormData();
    formData.append('file', audioBlob);

    // Set timeout to 60 seconds for large audio files
    const timeout = 90000; // Increased timeout
    
    // Get the API token either from env vars or window global
    const apiToken = process.env.REACT_APP_LELAPA_API_TOKEN || window.LELAPA_API_TOKEN;
    
    // Get OpenAI token
    const openaiToken = process.env.REACT_APP_OPENAI_API_KEY || window.OPENAI_API_KEY;
    
    console.log('Attempting API transcription with Lelapa token available:', !!apiToken);
    
    // Promise.race implementation for multiple transcription attempts
    const transcriptionPromises = [];
    
    // Promise for Lelapa API
    const lelapaPromise = new Promise(async (resolve) => {
      try {
        if (!apiToken) {
          console.warn('No Lelapa API token available');
          resolve(null);
          return;
        }
        
        console.log('Sending request to Lelapa API...');
        const response = await axios.post(
          'https://vulavula-services.lelapa.ai/api/v2alpha/transcribe/sync/file',
          formData,
          {
            headers: {
              'X-CLIENT-TOKEN': apiToken,
              'Content-Type': 'multipart/form-data',
            },
            timeout: timeout
          }
        );
        
        console.log('Lelapa API Response status:', response.status);
  
        if (response.status === 200) {
          console.log('Raw Lelapa API response:', response.data);
          
          // Extract transcription text from response
          const transcriptionText = response.data.transcription_text || 
                                response.data.transcription || 
                                response.data.text ||
                                '';
                                
          if (!transcriptionText || transcriptionText.trim() === '') {
            console.warn('Received empty transcription from Lelapa API');
            resolve(null);
          } else {
            console.log('Successfully transcribed with Lelapa:', transcriptionText);
            resolve(transcriptionText);
          }
        } else {
          console.warn(`Lelapa API returned status ${response.status}`);
          resolve(null);
        }
      } catch (err) {
        console.error('Error in Lelapa API transcription:', err.message);
        resolve(null);
      }
    });
    
    // Promise for browser transcription
    const browserPromise = new Promise(async (resolve) => {
      try {
        const browserResult = await tryBrowserTranscription(audioBlob);
        if (browserResult && browserResult.trim() !== '') {
          console.log('Browser transcription succeeded:', browserResult);
          resolve(browserResult);
        } else {
          console.warn('Browser transcription failed');
          resolve(null);
        }
      } catch (err) {
        console.error('Error in browser transcription:', err.message);
        resolve(null);
      }
    });
    
    // Add the promises to the array
    transcriptionPromises.push(lelapaPromise);
    transcriptionPromises.push(browserPromise);
    
    // Wait for all promises to complete and use the first valid result
    const results = await Promise.all(transcriptionPromises);
    
    for (const result of results) {
      if (result && result.trim() !== '' && result.length > 10) {
        return result;
      }
    }
    
    // If we've reached this point, all transcription attempts failed
    console.warn('All transcription methods failed');
    
    // Use a more descriptive message that won't be mistaken for actual transcription
    return "Speech transcription failed. Please try recording again with clearer speech or using the text input option instead.";
    
  } catch (error) {
    console.error('General transcription error:', error);
    return "An error occurred during transcription. Please try again or use text input.";
  }
};

// Direct transcription using OpenAI Whisper API
async function transcribeWithOpenAI(audioBlob) {
  try {
    console.log('Attempting OpenAI Whisper transcription...');
    
    // Get OpenAI token - use the one from environment or fallback
    const openaiToken = process.env.REACT_APP_OPENAI_API_KEY || window.OPENAI_API_KEY;
    
    if (!openaiToken) {
      console.warn('No OpenAI token available');
      return null;
    }
    
    // Create form data for the request
    const formData = new FormData();
    
    // Convert to mp3 if needed (Whisper prefers mp3)
    let fileToSend = audioBlob;
    if (audioBlob.type !== 'audio/mp3' && audioBlob.type !== 'audio/mpeg') {
      console.log('Audio is not mp3, using as-is');
      // In a production app, you would convert to mp3 here
    }
    
    // Add the file to form data
    formData.append('file', fileToSend, 'recording.mp3');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    
    console.log('Sending request to OpenAI Whisper API...');
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${openaiToken}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000
      }
    );
    
    console.log('OpenAI Whisper API response:', response.data);
    
    if (response.data && response.data.text) {
      return response.data.text;
    } else {
      console.warn('OpenAI Whisper API returned no text');
      return null;
    }
  } catch (error) {
    console.error('Error using OpenAI Whisper API:', error);
    return null;
  }
}

// Try using the browser's built-in speech recognition (works in Chrome)
async function tryBrowserTranscription(audioBlob) {
  return new Promise((resolve) => {
    try {
      console.log('Attempting browser transcription...');
      
      // Check if the browser supports speech recognition
      if (!window.webkitSpeechRecognition && !window.SpeechRecognition) {
        console.log('Browser speech recognition not supported');
        return resolve(null);
      }
      
      // Create audio element to play the blob
      const audio = new Audio();
      audio.src = URL.createObjectURL(audioBlob);
      
      // Set up speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = false;
      
      let transcription = '';
      let recognitionTimeout;
      
      recognition.onresult = (event) => {
        console.log('Got speech recognition result');
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcription += event.results[i][0].transcript + ' ';
          console.log(`Partial transcription: ${transcription}`);
        }
      };
      
      recognition.onerror = (error) => {
        console.error('Speech recognition error:', error);
        clearTimeout(recognitionTimeout);
        recognition.stop();
        audio.pause();
        resolve(null);
      };
      
      recognition.onend = () => {
        clearTimeout(recognitionTimeout);
        audio.pause();
        console.log('Browser transcription complete:', transcription);
        resolve(transcription.trim());
      };
      
      // Start playback and recognition
      audio.onplay = () => {
        console.log('Starting speech recognition...');
        recognition.start();
      };
      
      audio.onended = () => {
        // Give recognition a moment to process the final words
        console.log('Audio playback ended, stopping recognition soon...');
        setTimeout(() => {
          recognition.stop();
        }, 1000);
      };
      
      // Set a timeout in case something goes wrong
      recognitionTimeout = setTimeout(() => {
        console.warn('Browser transcription timeout');
        recognition.stop();
        audio.pause();
        resolve(null);
      }, 30000);
      
      console.log('Starting audio playback for transcription...');
      audio.play().catch(err => {
        console.error('Error playing audio for transcription:', err);
        resolve(null);
      });
    } catch (error) {
      console.error('Error with browser transcription:', error);
      resolve(null);
    }
  });
}

// Function to apply audio processing to improve quality before transcription
export const processAudio = async (audioBlob) => {
  try {
    console.log('Processing audio before transcription...');
    
    // Check if the audio blob is valid
    if (!audioBlob || audioBlob.size === 0) {
      console.warn('Invalid audio blob');
      return audioBlob;
    }
    
    // Convert to proper format if needed
    const blobType = audioBlob.type;
    console.log('Original audio format:', blobType);
    
    // In a real implementation, you would have audio processing logic here
    // For now, just return the original blob
    
    console.log('Audio processing complete, size:', audioBlob.size);
    return audioBlob;
  } catch (error) {
    console.error('Error processing audio:', error);
    // Return original audio if processing fails
    return audioBlob;
  }
};

// Fallback transcription 
export const fallbackTranscription = () => {
  console.log('Using fallback transcription mechanism');
  
  // Return a message that's clearly different from actual transcription
  return "TRANSCRIPTION_FAILED: Unable to convert speech to text. Please try again.";
};