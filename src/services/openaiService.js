// src/services/openaiService.js
import axios from 'axios';

// Function to analyze transcribed text and generate review
export const analyzeReview = async (transcribedText, restaurantName = 'this restaurant') => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes restaurant feedback and formats it as a structured review.'
          },
          {
            role: 'user',
            content: `I want you to analyze my feedback for ${restaurantName}, which features live DJs and music.
The feedback was: "${transcribedText}"

Format this feedback as a first-person review that I can copy and paste directly to Google Reviews.
All assessments, opinions, and points should be written in first-person (using "I", "my", "me").

For example, instead of "The customer enjoyed the food" write "I enjoyed the food".
Instead of "The customer thought the music was too loud" write "I thought the music was too loud".

Provide your analysis in the following JSON format:
{
    "summary": "A brief first-person summary of my overall experience",
    "food_quality": "My assessment of food and drinks",
    "service": "My assessment of service quality",
    "atmosphere": "My assessment of ambiance, music, and entertainment",
    "music_and_entertainment": "My specific feedback on DJs, music selection, and overall vibe",
    "specific_points": ["My point 1", "My point 2", "My point 3"],
    "sentiment_score": 4,
    "improvement_suggestions": ["My suggestion 1", "My suggestion 2"]
}

MAKE SURE that:
1. All text fields are properly enclosed in double quotes
2. All arrays have square brackets and comma-separated values in double quotes
3. The sentiment_score is a number between 1-5 without quotes
4. There is no trailing comma after the last item in arrays or objects
5. Your response contains ONLY the JSON object - no other text before or after`
          }
        ],
        temperature: 0.4
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        }
      }
    );

    // Extract the JSON response
    const responseText = response.data.choices[0].message.content;
    
    try {
      // Parse the JSON
      const parsedResponse = JSON.parse(responseText);
      
      // Add raw transcription
      parsedResponse.raw_transcription = transcribedText;
      
      // Return the parsed object
      return parsedResponse;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      
      // Try to extract JSON using regex
      const jsonPattern = /(\{[\s\S]*\})/;
      const match = responseText.match(jsonPattern);
      
      if (match) {
        const jsonStr = match[1]
          .replace(/'/g, '"') // Replace single quotes with double quotes
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Add quotes to keys
          .replace(/,\s*}/g, '}') // Remove trailing commas before closing braces
          .replace(/,\s*]/g, ']'); // Remove trailing commas before closing brackets
        
        try {
          const parsedResponse = JSON.parse(jsonStr);
          parsedResponse.raw_transcription = transcribedText;
          return parsedResponse;
        } catch (e) {
          throw new Error('Failed to parse OpenAI response as JSON');
        }
      } else {
        throw new Error('Failed to extract JSON from OpenAI response');
      }
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    
    // Create a basic fallback response
    const sentences = transcribedText.split('.').filter(s => s.trim().length > 0);
    
    // Convert sentences to first person if they aren't already
    const firstPersonSentences = sentences.map(sentence => {
      const lowerSentence = sentence.toLowerCase();
      if (!lowerSentence.includes(' i ') && 
          !lowerSentence.includes(' my ') && 
          !lowerSentence.includes(' me ') && 
          !lowerSentence.includes(' we ') && 
          !lowerSentence.includes(' our ')) {
        // Convert to first person
        return `I ${sentence.trim().charAt(0).toLowerCase()}${sentence.trim().slice(1)}`;
      }
      return sentence.trim();
    });
    
    const summary = firstPersonSentences[0] || "I visited this restaurant.";
    
    // Extract specific points based on sentence length and content
    const points = [];
    const suggestions = [];
    
    for (const s of firstPersonSentences.slice(1)) {
      if (s.toLowerCase().includes('should') || 
          s.toLowerCase().includes('could') || 
          s.toLowerCase().includes('wish') || 
          s.toLowerCase().includes('hope')) {
        suggestions.push(s);
      } else if (s.length > 15) {
        points.push(s);
      }
    }
    
    // Ensure we have at least some points and suggestions
    if (points.length === 0 && firstPersonSentences.length > 1) {
      points.push(firstPersonSentences[1]);
    }
    
    if (suggestions.length === 0 && points.length > 0) {
      suggestions.push("I hope they continue providing this quality of experience.");
    }
    
    return {
      summary,
      food_quality: transcribedText.toLowerCase().includes('food') 
        ? "I enjoyed the food based on my visit." 
        : "N/A",
      service: transcribedText.toLowerCase().includes('service') 
        ? "The service was good during my visit." 
        : "N/A",
      atmosphere: transcribedText.toLowerCase().includes('atmosphere') 
        ? "I liked the atmosphere of the place." 
        : "N/A",
      music_and_entertainment: ['music', 'dj', 'entertainment'].some(term => 
        transcribedText.toLowerCase().includes(term)) 
        ? "The music added to my experience." 
        : "N/A",
      specific_points: points.slice(0, 3).length > 0 
        ? points.slice(0, 3) 
        : ["I had an experience worth sharing."],
      sentiment_score: ['good', 'great', 'excellent', 'amazing', 'enjoyed'].some(term => 
        transcribedText.toLowerCase().includes(term)) 
        ? 4 
        : 3,
      improvement_suggestions: suggestions.slice(0, 2).length > 0 
        ? suggestions.slice(0, 2) 
        : ["Based on my experience, I think they're doing well."],
      raw_transcription: transcribedText
    };
  }
};