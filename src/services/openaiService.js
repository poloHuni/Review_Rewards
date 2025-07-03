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
              content: 'You are a helpful assistant that analyzes restaurant feedback and formats it as a structured review. You MUST always provide responses for all 4 categories, even if the customer did not mention them.'
            },
            {
              role: 'user',
              content: `I want you to analyze my feedback for ${restaurantName}.
The feedback was: "${transcribedText}"

Format this feedback as a first-person review that I can copy and paste directly to Google Reviews.
All assessments, opinions, and points should be written in first-person (using "I", "my", "me").

CRITICAL REQUIREMENTS:
1. You MUST provide responses for ALL 4 categories: food_quality, service, atmosphere, music_and_entertainment
2. If I didn't mention a specific category, use this EXACT format: "Nothing to say about [category]"
3. For example, if I didn't mention food, write: "Nothing to say about food"
4. If I didn't mention service, write: "Nothing to say about service"
5. If I didn't mention atmosphere, write: "Nothing to say about atmosphere"  
6. If I didn't mention music/entertainment, write: "Nothing to say about music and entertainment"

Provide your analysis in the following JSON format:
{
    "summary": "A brief first-person summary of my overall experience",
    "food_quality": "My assessment of food and drinks OR 'Nothing to say about food' if not mentioned",
    "service": "My assessment of service quality OR 'Nothing to say about service' if not mentioned",
    "atmosphere": "My assessment of ambiance and environment OR 'Nothing to say about atmosphere' if not mentioned",
    "music_and_entertainment": "My specific feedback on music, DJs, and entertainment OR 'Nothing to say about music and entertainment' if not mentioned",
    "specific_points": ["My specific point 1", "My specific point 2", "My specific point 3"],
    "sentiment_score": 4,
    "improvement_suggestions": ["My suggestion 1 if any", "My suggestion 2 if any"]
}

MAKE SURE that:
1. All text fields are properly enclosed in double quotes
2. All arrays have square brackets and comma-separated values in double quotes
3. The sentiment_score is a number between 1-5 without quotes
4. There is no trailing comma after the last item in arrays or objects
5. You use the EXACT "Nothing to say about..." format when a category wasn't mentioned
6. All responses are in first-person perspective

Remember: EVERY category must have a response - either actual feedback or "Nothing to say about [category]"`
            }
          ],
          max_tokens: 800,
          temperature: 0.3
        },
        {
          signal: controller.signal,
          timeout: 15000
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.data?.choices?.[0]?.message?.content) {
        console.error('Invalid OpenAI response structure:', response.data);
        return createFallbackReview(transcribedText);
      }
      
      const aiResponse = response.data.choices[0].message.content;
      console.log('Raw AI response:', aiResponse);
      
      // Try to parse JSON from the response
      let parsedResult;
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        console.error('AI response was:', aiResponse);
        return createFallbackReview(transcribedText);
      }
      
      // Validate the structure and ensure all required fields are present
      const validatedResult = validateAndFixResult(parsedResult, transcribedText);
      
      console.log('Final validated result:', validatedResult);
      return validatedResult;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('OpenAI request timed out');
      } else {
        console.error('OpenAI API error:', error);
      }
      
      return createFallbackReview(transcribedText);
    }
    
  } catch (error) {
    console.error('Error in analysis process:', error);
    return createFallbackReview(transcribedText);
  }
};

// Validate and fix the AI result to ensure consistency
function validateAndFixResult(result, originalText) {
  const validated = {
    summary: result.summary || "I had an experience at this restaurant.",
    food_quality: result.food_quality || "Nothing to say about food",
    service: result.service || "Nothing to say about service", 
    atmosphere: result.atmosphere || "Nothing to say about atmosphere",
    music_and_entertainment: result.music_and_entertainment || "Nothing to say about music and entertainment",
    specific_points: Array.isArray(result.specific_points) ? result.specific_points : ["I wanted to share my experience"],
    sentiment_score: (typeof result.sentiment_score === 'number' && result.sentiment_score >= 1 && result.sentiment_score <= 5) 
      ? result.sentiment_score 
      : calculateFallbackSentiment(originalText),
    improvement_suggestions: Array.isArray(result.improvement_suggestions) ? result.improvement_suggestions : [],
    raw_transcription: originalText
  };

  // Ensure we have at least one specific point
  if (validated.specific_points.length === 0) {
    validated.specific_points = ["I wanted to share my experience"];
  }

  // Ensure improvement suggestions is an array (can be empty)
  if (!Array.isArray(validated.improvement_suggestions)) {
    validated.improvement_suggestions = [];
  }

  return validated;
}

// Calculate sentiment from text for fallback
function calculateFallbackSentiment(text) {
  const lowerText = text.toLowerCase();
  
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'delicious', 'enjoyed', 'love', 'wonderful', 'fantastic', 'nice', 'best', 'perfect', 'outstanding'];
  const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'disappointing', 'mediocre', 'slow', 'rude', 'cold', 'undercooked', 'overcooked', 'worst', 'hate'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  // Calculate sentiment score
  if (positiveCount > negativeCount + 1) return 5;
  if (positiveCount > negativeCount) return 4;
  if (negativeCount > positiveCount + 1) return 2;
  if (negativeCount > positiveCount) return 1;
  return 3; // neutral
}

// Improved fallback review generation with consistent formatting
function createFallbackReview(transcribedText) {
  console.log('Creating fallback review for:', transcribedText);
  
  const sentimentScore = calculateFallbackSentiment(transcribedText);
  const lowerText = transcribedText.toLowerCase();
  
  // Extract sentences for analysis
  const sentences = transcribedText.split(/[.!?]+/).filter(s => s.trim().length > 5);
  
  // Create summary
  const summary = sentences.length > 0 
    ? sentences[0].trim() + "."
    : "I had an experience at this restaurant.";
  
  // Check if specific categories are mentioned and create responses
  let foodComment = "Nothing to say about food";
  let serviceComment = "Nothing to say about service";
  let atmosphereComment = "Nothing to say about atmosphere";
  let musicComment = "Nothing to say about music and entertainment";
  
  // Look for mentions of each category
  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();
    
    // Food-related keywords
    if (lower.includes('food') || lower.includes('dish') || lower.includes('meal') || 
        lower.includes('taste') || lower.includes('flavor') || lower.includes('cook') ||
        lower.includes('eat') || lower.includes('drink') || lower.includes('menu')) {
      foodComment = "I " + sentence.trim().replace(/^[^a-zA-Z]+/, '').toLowerCase();
      if (!foodComment.endsWith('.')) foodComment += '.';
    }
    
    // Service-related keywords  
    if (lower.includes('service') || lower.includes('staff') || lower.includes('waiter') || 
        lower.includes('waitress') || lower.includes('server') || lower.includes('employee') ||
        lower.includes('manager') || lower.includes('friendly') || lower.includes('help')) {
      serviceComment = "I " + sentence.trim().replace(/^[^a-zA-Z]+/, '').toLowerCase();
      if (!serviceComment.endsWith('.')) serviceComment += '.';
    }
    
    // Atmosphere-related keywords
    if (lower.includes('atmosphere') || lower.includes('ambiance') || lower.includes('decor') || 
        lower.includes('interior') || lower.includes('place') || lower.includes('room') ||
        lower.includes('lighting') || lower.includes('noise') || lower.includes('crowd')) {
      atmosphereComment = "I " + sentence.trim().replace(/^[^a-zA-Z]+/, '').toLowerCase();
      if (!atmosphereComment.endsWith('.')) atmosphereComment += '.';
    }
    
    // Music/Entertainment-related keywords
    if (lower.includes('music') || lower.includes('dj') || lower.includes('band') || 
        lower.includes('entertainment') || lower.includes('sound') || lower.includes('volume') ||
        lower.includes('song') || lower.includes('play')) {
      musicComment = "I " + sentence.trim().replace(/^[^a-zA-Z]+/, '').toLowerCase();
      if (!musicComment.endsWith('.')) musicComment += '.';
    }
  });
  
  // Create specific points (filter meaningful sentences)
  const specificPoints = sentences
    .filter(s => s.trim().length > 15)
    .slice(0, 3)
    .map(s => {
      let point = s.trim();
      if (!point.startsWith('I ')) {
        point = 'I ' + point.toLowerCase();
      }
      if (!point.endsWith('.')) point += '.';
      return point;
    });
  
  if (specificPoints.length === 0) {
    specificPoints.push("I wanted to share my experience.");
  }
  
  // Create improvement suggestions based on sentiment
  const improvementSuggestions = [];
  if (sentimentScore <= 3) {
    if (lowerText.includes('service')) {
      improvementSuggestions.push("I hope they can improve their service quality.");
    }
    if (lowerText.includes('food')) {
      improvementSuggestions.push("I hope they can improve their food quality.");
    }
    if (improvementSuggestions.length === 0) {
      improvementSuggestions.push("I hope they can make improvements to enhance the overall experience.");
    }
  }
  
  return {
    summary: summary,
    food_quality: foodComment,
    service: serviceComment,
    atmosphere: atmosphereComment,
    music_and_entertainment: musicComment,
    specific_points: specificPoints,
    sentiment_score: sentimentScore,
    improvement_suggestions: improvementSuggestions,
    raw_transcription: transcribedText
  };
}