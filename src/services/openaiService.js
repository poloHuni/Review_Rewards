// src/services/openaiService.js
import axios from 'axios';

// Function to analyze transcribed text and generate review
export const analyzeReview = async (transcribedText, restaurantName = 'this restaurant') => {
  try {
    // Get API key from environment or try fallback
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || window.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OpenAI API key not found');
      return createFallbackReview(transcribedText);
    }
    
    // Set timeout to avoid waiting too long
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
    
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
            'Authorization': `Bearer ${apiKey}`
          },
          signal: controller.signal
        }
      );
  
      clearTimeout(timeoutId);
  
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
            console.error('Failed to parse extracted JSON:', e);
            return createFallbackReview(transcribedText);
          }
        } else {
          console.error('Failed to extract JSON from OpenAI response');
          return createFallbackReview(transcribedText);
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('API call error:', error.message);
      return createFallbackReview(transcribedText);
    }
  } catch (error) {
    console.error('Error in analysis process:', error);
    return createFallbackReview(transcribedText);
  }
};

// Improved fallback review generation
function createFallbackReview(transcribedText) {
  // Extract sentiment clues from the text
  const lowerText = transcribedText.toLowerCase();
  
  // Determine sentiment score based on positive and negative words
  let sentimentScore = 3; // Default neutral
  
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'delicious', 'enjoyed', 'love', 'wonderful', 'fantastic', 'nice', 'best'];
  const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'disappointing', 'mediocre', 'slow', 'rude', 'cold', 'undercooked', 'overcooked'];
  
  // Count positive and negative words
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  // Calculate sentiment score
  if (positiveCount > negativeCount) {
    sentimentScore = 4 + (positiveCount > 3 ? 1 : 0);
  } else if (negativeCount > positiveCount) {
    sentimentScore = 2 - (negativeCount > 3 ? 1 : 0);
  }
  
  // Ensure score is between 1-5
  sentimentScore = Math.max(1, Math.min(5, sentimentScore));
  
  // Extract sentences
  const sentences = transcribedText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Choose summary - first sentence or fallback
  const summary = (sentences.length > 0)
    ? sentences[0].trim()
    : "I had a decent experience at this restaurant.";
  
  // Extract food, service, atmosphere comments
  let foodComment = "The food was satisfactory.";
  let serviceComment = "The service was adequate.";
  let atmosphereComment = "The atmosphere was pleasant.";
  let musicComment = "The music added to the experience.";
  
  // Try to find relevant sentences
  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();
    if (lower.includes('food') || lower.includes('dish') || lower.includes('meal') || lower.includes('taste')) {
      foodComment = sentence.trim();
    }
    if (lower.includes('service') || lower.includes('staff') || lower.includes('waiter') || lower.includes('waitress')) {
      serviceComment = sentence.trim();
    }
    if (lower.includes('atmosphere') || lower.includes('ambiance') || lower.includes('decor') || lower.includes('interior')) {
      atmosphereComment = sentence.trim();
    }
    if (lower.includes('music') || lower.includes('dj') || lower.includes('band') || lower.includes('entertainment')) {
      musicComment = sentence.trim();
    }
  });
  
  // Create points and suggestions
  const points = [];
  const suggestions = [];
  
  for (const s of sentences) {
    const lower = s.toLowerCase();
    if (lower.includes('should') || lower.includes('could') || lower.includes('wish') || lower.includes('hope') || lower.includes('improve')) {
      suggestions.push(s.trim());
    } else if (s.length > 15 && !points.includes(s.trim())) {
      points.push(s.trim());
    }
  }
  
  // Ensure we have at least some points and suggestions
  if (points.length === 0 && sentences.length > 1) {
    points.push(sentences[1].trim());
  }
  if (points.length === 0) {
    points.push("I thought the overall experience was worth sharing.");
  }
  
  if (suggestions.length === 0) {
    if (sentimentScore >= 4) {
      suggestions.push("I hope they continue providing this quality of experience.");
    } else if (sentimentScore <= 2) {
      suggestions.push("I hope they can improve their service and food quality.");
    } else {
      suggestions.push("They could make some minor improvements to enhance the experience.");
    }
  }
  
  // Return structured review
  return {
    summary: summary,
    food_quality: foodComment,
    service: serviceComment,
    atmosphere: atmosphereComment,
    music_and_entertainment: musicComment,
    specific_points: points.slice(0, 3),
    sentiment_score: sentimentScore,
    improvement_suggestions: suggestions.slice(0, 2),
    raw_transcription: transcribedText
  };
}