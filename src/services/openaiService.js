// src/services/openaiService.js - LangChain Version with Pydantic-like Structure
import axios from 'axios';

// Define the expected response structure (Pydantic-like schema)
const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    sentiment: {
      type: "number",
      description: "Sentiment score from 1-5 where 1=very negative, 5=very positive",
      minimum: 1,
      maximum: 5
    },
    summary: {
      type: "string",
      description: "A brief 1-2 sentence summary of the overall dining experience"
    },
    food: {
      type: "string",
      description: "Summary of food quality feedback, or 'I have nothing to say about food' if not mentioned"
    },
    service: {
      type: "string", 
      description: "Summary of service quality feedback, or 'I have nothing to say about service' if not mentioned"
    },
    atmosphere: {
      type: "string",
      description: "Summary of atmosphere/ambiance feedback, or 'I have nothing to say about atmosphere' if not mentioned"
    },
    music: {
      type: "string",
      description: "Summary of music/entertainment feedback, or 'I have nothing to say about music' if not mentioned"
    },
    suggested_improvements: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Array of improvement suggestions, empty array if none"
    },
    key_points: {
      type: "array", 
      items: {
        type: "string"
      },
      description: "Array of key highlights from the review, minimum 1 item"
    }
  },
  required: ["sentiment", "summary", "food", "service", "atmosphere", "music", "suggested_improvements", "key_points"]
};

// LangChain-style prompt template
const REVIEW_ANALYSIS_PROMPT = `
You are a professional restaurant review analyzer specializing in structuring customer feedback. Your objective is to extract key insights and sentiments in a clear, FIRST PERSON narrative.

STRICT INSTRUCTIONS — Follow precisely:
1. Return ONLY a valid JSON object that adheres EXACTLY to the schema provided below. No extra commentary.
2. ALL summaries and key points must be written in FIRST PERSON (use "I", "me", "my"). Avoid third-person or generic statements.
3. For each category (food, service, atmosphere, music):
   - If the customer mentions it: summarize briefly IN FIRST PERSON.
   - If it is not mentioned: return "I have nothing to say about [category]".
4. The field 'sentiment' must be a number between 1-5 (1 = very negative, 5 = very positive).
5. The 'key_points' list must contain AT LEAST ONE item, written in FIRST PERSON.
6. If sentiment is 1, 2, or 3 (poor/negative experience): you MUST include at least one improvement suggestion in 'suggested_improvements'.
7. If sentiment is 4 or 5 (positive experience): 'suggested_improvements' can be an empty list.

EXAMPLES OF FIRST PERSON WRITING:
-Good: "I enjoyed the delicious pasta"
-Bad:  "The pasta was delicious"
-Good: "I felt the service was slow"
-Bad:  "The service was slow"

INPUT VARIABLES:
Customer feedback: "{transcript}"
Restaurant: "{restaurant_name}"

TASK:
Analyze the feedback and output ONLY the following JSON object:

{
  "sentiment": <number 1-5>,
  "summary": "<1-2 sentence overall summary in FIRST PERSON>",
  "food": "<FIRST PERSON summary of food feedback OR 'I have nothing to say about food'>",
  "service": "<FIRST PERSON summary of service feedback OR 'I have nothing to say about service'>", 
  "atmosphere": "<FIRST PERSON summary of atmosphere feedback OR 'I have nothing to say about atmosphere'>",
  "music": "<FIRST PERSON summary of music feedback OR 'I have nothing to say about music'>",
  "suggested_improvements": ["<improvement 1>", "<improvement 2>"],
  "key_points": ["<FIRST PERSON key point 1>", "<FIRST PERSON key point 2>", "<FIRST PERSON key point 3>"]
}

DO NOT include any explanations, notes, or text outside the JSON object.
`;

// Custom output parser (LangChain-style)
class ReviewOutputParser {
  parse(text) {
    try {
      // Clean the response text
      const cleanedText = text.trim();
      
      // Extract JSON from the response
      let jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      
      // Validate against schema
      const validated = this.validateAndFix(parsed);
      
      return validated;
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      throw new Error(`Failed to parse response: ${error.message}`);
    }
  }
  
  validateAndFix(data) {
    // Ensure all required fields exist with proper defaults
    const validated = {
      sentiment: this.validateSentiment(data.sentiment),
      summary: this.validateString(data.summary, "I had an experience at this restaurant."),
      food: this.validateCategoryString(data.food, "food"),
      service: this.validateCategoryString(data.service, "service"),
      atmosphere: this.validateCategoryString(data.atmosphere, "atmosphere"),
      music: this.validateCategoryString(data.music, "music"),
      suggested_improvements: this.validateArray(data.suggested_improvements),
      key_points: this.validateArray(data.key_points, ["I wanted to share my experience"])
    };
    
    return validated;
  }
  
  validateSentiment(value) {
    const num = Number(value);
    if (isNaN(num) || num < 1 || num > 5) {
      return 3; // Default neutral
    }
    return Math.round(num);
  }
  
  validateString(value, defaultValue) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return defaultValue;
  }
  
  validateCategoryString(value, category) {
    if (typeof value === 'string' && value.trim()) {
      const trimmed = value.trim();
      // If it's empty or just says nothing, use standard format
      if (trimmed.toLowerCase().includes('nothing') || trimmed.toLowerCase().includes('no mention')) {
        return `I have nothing to say about ${category}`;
      }
      return trimmed;
    }
    return `I have nothing to say about ${category}`;
  }
  
  validateArray(value, defaultValue = []) {
    if (Array.isArray(value)) {
      const filtered = value.filter(item => typeof item === 'string' && item.trim());
      return filtered.length > 0 ? filtered : defaultValue;
    }
    return defaultValue;
  }
}

// LangChain-style chain class
class ReviewAnalysisChain {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.outputParser = new ReviewOutputParser();
  }
  
  async invoke({ transcript, restaurant_name }) {
    try {
      // Format the prompt
      const prompt = REVIEW_ANALYSIS_PROMPT
        .replace('{transcript}', transcript)
        .replace('{restaurant_name}', restaurant_name || 'this restaurant');
      
      // Call OpenAI API with structured output
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a restaurant review analyzer that returns structured JSON responses. You must follow the exact schema provided and never deviate from the format.'
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.1, // Low temperature for consistent structure
          response_format: { type: "json_object" } // Force JSON response
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      
      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid OpenAI response structure');
      }
      
      const rawResponse = response.data.choices[0].message.content;
      console.log('Raw LLM response:', rawResponse);
      
      // Parse and validate using our custom parser
      const structuredOutput = this.outputParser.parse(rawResponse);
      
      console.log('Structured output:', structuredOutput);
      return structuredOutput;
      
    } catch (error) {
      console.error('Error in ReviewAnalysisChain:', error);
      throw error;
    }
  }
}

// Main analysis function (LangChain-style interface)
export const analyzeReview = async (transcribedText, restaurantName = 'this restaurant') => {
  try {
    // Get API key
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || window.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OpenAI API key not found');
      return createFallbackReview(transcribedText);
    }
    
    console.log('🔗 Analyzing review with LangChain-style chain...');
    
    // Create the analysis chain
    const chain = new ReviewAnalysisChain(apiKey);
    
    // Invoke the chain
    const result = await chain.invoke({
      transcript: transcribedText,
      restaurant_name: restaurantName
    });
    
    // Convert to the format expected by the rest of the application
    const convertedResult = {
      summary: result.summary,
      food_quality: result.food,
      service: result.service,
      atmosphere: result.atmosphere, 
      music_and_entertainment: result.music,
      specific_points: result.key_points,
      sentiment_score: result.sentiment,
      improvement_suggestions: result.suggested_improvements,
      raw_transcription: transcribedText
    };
    
    console.log('✅ LangChain analysis completed:', convertedResult);
    return convertedResult;
    
  } catch (error) {
    console.error('❌ Error in LangChain analysis:', error);
    console.log('🔄 Falling back to traditional analysis...');
    return createFallbackReview(transcribedText);
  }
};

// Fallback function for when LangChain fails
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
  
  // Analyze content for different categories
  let foodComment = "I have nothing to say about food";
  let serviceComment = "I have nothing to say about service";
  let atmosphereComment = "I have nothing to say about atmosphere";
  let musicComment = "I have nothing to say about music";
  
  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();
    
    // Food-related keywords
    if (lower.includes('food') || lower.includes('meal') || lower.includes('dish') || 
        lower.includes('delicious') || lower.includes('tasty') || lower.includes('flavor')) {
      foodComment = "I shared feedback about the food quality.";
    }
    
    // Service-related keywords
    if (lower.includes('service') || lower.includes('staff') || lower.includes('waiter') || 
        lower.includes('waitress') || lower.includes('server')) {
      serviceComment = "I commented on the service experience.";
    }
    
    // Atmosphere-related keywords
    if (lower.includes('atmosphere') || lower.includes('ambiance') || lower.includes('setting') || 
        lower.includes('environment') || lower.includes('decor')) {
      atmosphereComment = "I mentioned the restaurant's atmosphere.";
    }
    
    // Music-related keywords
    if (lower.includes('music') || lower.includes('entertainment') || lower.includes('dj') || 
        lower.includes('live') || lower.includes('band')) {
      musicComment = "I provided feedback on the music and entertainment.";
    }
  });
  
  // Create specific points
  const specificPoints = sentences
    .filter(s => s.trim().length > 15)
    .slice(0, 3)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  if (specificPoints.length === 0) {
    specificPoints.push("I wanted to share my experience");
  }
  
  // Create improvement suggestions
  const improvementSuggestions = [];
  if (sentimentScore <= 3) {
    if (lowerText.includes('service')) {
      improvementSuggestions.push("Consider improving service quality");
    }
    if (lowerText.includes('food')) {
      improvementSuggestions.push("Consider improving food quality");
    }
    if (improvementSuggestions.length === 0) {
      improvementSuggestions.push("Consider improvements to enhance overall experience");
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