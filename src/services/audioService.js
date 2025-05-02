// src/services/audioService.js
import axios from 'axios';

// Function to transcribe audio using Lelapa API
export const transcribeAudio = async (audioFile) => {
  const formData = new FormData();
  formData.append('file', audioFile);

  try {
    const response = await axios.post(
      'https://vulavula-services.lelapa.ai/api/v2alpha/transcribe/sync/file',
      formData,
      {
        headers: {
          'X-CLIENT-TOKEN': process.env.REACT_APP_LELAPA_API_TOKEN,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.status === 200) {
      // Extract transcription text from response
      const transcriptionText = response.data.transcription_text || 
                               response.data.transcription || 
                               '';
      return transcriptionText;
    } else {
      throw new Error(`Transcription error: ${response.status}`);
    }
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
};

// Function to apply audio processing to improve quality before transcription
export const processAudio = async (audioBlob) => {
  try {
    // In the full implementation, you would apply audio processing here
    // For now, we'll just return the original audio blob
    // Advanced audio processing requires Web Audio API manipulations
    
    // This would include:
    // - Normalization
    // - Noise reduction
    // - High-pass filtering
    // But this is complex to implement in the browser
    
    return audioBlob;
  } catch (error) {
    console.error('Error processing audio:', error);
    // Return original audio if processing fails
    return audioBlob;
  }
};