// src/utils/reviewDisplayUtils.js

/**
 * Standardize the display of review categories throughout the system
 * Ensures consistent formatting and handles "Nothing to say about..." cases
 */

// Standard category labels
export const CATEGORY_LABELS = {
  food_quality: '🍽️ Food',
  service: '👥 Service', 
  atmosphere: '🏠 Atmosphere',
  music_and_entertainment: '🎵 Music & Entertainment'
};

// Standard "nothing to say" phrases
export const NOTHING_TO_SAY_PHRASES = {
  food_quality: 'Nothing to say about food',
  service: 'Nothing to say about service',
  atmosphere: 'Nothing to say about atmosphere', 
  music_and_entertainment: 'Nothing to say about music and entertainment'
};

/**
 * Format a category value for display
 * @param {string} categoryKey - The category key (e.g., 'food_quality')
 * @param {string} value - The raw value from the database
 * @returns {object} - Formatted display object
 */
export const formatCategoryForDisplay = (categoryKey, value) => {
  if (!value || value.trim() === '') {
    return {
      label: CATEGORY_LABELS[categoryKey] || categoryKey,
      text: NOTHING_TO_SAY_PHRASES[categoryKey] || `Nothing to say about ${categoryKey}`,
      isEmpty: true,
      className: 'category-empty'
    };
  }

  const trimmedValue = value.trim();
  const lowerValue = trimmedValue.toLowerCase();
  
  // Check if it's already a "nothing to say" response
  const isEmptyResponse = lowerValue.includes('nothing to say about') || 
                         lowerValue === 'n/a' || 
                         lowerValue === 'not mentioned' ||
                         lowerValue === 'no comment';

  return {
    label: CATEGORY_LABELS[categoryKey] || categoryKey,
    text: trimmedValue,
    isEmpty: isEmptyResponse,
    className: isEmptyResponse ? 'category-empty' : 'category-filled'
  };
};

/**
 * Format all categories for a review
 * @param {object} review - The review object
 * @returns {object} - All formatted categories
 */
export const formatAllCategoriesForDisplay = (review) => {
  return {
    food_quality: formatCategoryForDisplay('food_quality', review.food_quality),
    service: formatCategoryForDisplay('service', review.service),
    atmosphere: formatCategoryForDisplay('atmosphere', review.atmosphere),
    music_and_entertainment: formatCategoryForDisplay('music_and_entertainment', review.music_and_entertainment)
  };
};

/**
 * Check if a review has complete category data
 * @param {object} review - The review object  
 * @returns {object} - Completion status
 */
export const checkReviewCompleteness = (review) => {
  const categories = formatAllCategoriesForDisplay(review);
  const totalCategories = Object.keys(categories).length;
  const filledCategories = Object.values(categories).filter(cat => !cat.isEmpty).length;
  
  return {
    totalCategories,
    filledCategories,
    emptyCategories: totalCategories - filledCategories,
    completionPercentage: Math.round((filledCategories / totalCategories) * 100),
    isComplete: filledCategories === totalCategories
  };
};

/**
 * Get a standardized category display component props
 * @param {string} categoryKey - The category key
 * @param {string} value - The category value
 * @param {object} options - Display options
 * @returns {object} - Props for display component
 */
export const getCategoryDisplayProps = (categoryKey, value, options = {}) => {
  const formatted = formatCategoryForDisplay(categoryKey, value);
  const { showEmptyCategories = true, emptyStyle = 'muted' } = options;
  
  if (formatted.isEmpty && !showEmptyCategories) {
    return null; // Don't render empty categories
  }
  
  return {
    label: formatted.label,
    text: formatted.text,
    isEmpty: formatted.isEmpty,
    style: formatted.isEmpty ? emptyStyle : 'normal',
    className: `category-display ${formatted.className} ${emptyStyle === 'muted' && formatted.isEmpty ? 'muted' : ''}`
  };
};

/**
 * Ensure a review object has all required categories with proper defaults
 * @param {object} review - The review object
 * @returns {object} - Review with all categories filled
 */
export const ensureCompleteReview = (review) => {
  return {
    ...review,
    food_quality: review.food_quality || NOTHING_TO_SAY_PHRASES.food_quality,
    service: review.service || NOTHING_TO_SAY_PHRASES.service,
    atmosphere: review.atmosphere || NOTHING_TO_SAY_PHRASES.atmosphere,
    music_and_entertainment: review.music_and_entertainment || NOTHING_TO_SAY_PHRASES.music_and_entertainment,
    specific_points: Array.isArray(review.specific_points) ? review.specific_points : [],
    improvement_suggestions: Array.isArray(review.improvement_suggestions) ? review.improvement_suggestions : []
  };
};

/**
 * Create a summary of what categories were mentioned in a review
 * @param {object} review - The review object
 * @returns {string} - Summary text
 */
export const createCategorySummary = (review) => {
  const categories = formatAllCategoriesForDisplay(review);
  const mentionedCategories = Object.entries(categories)
    .filter(([key, cat]) => !cat.isEmpty)
    .map(([key, cat]) => cat.label.replace(/[^\w\s]/g, '').trim()); // Remove emojis for summary
  
  if (mentionedCategories.length === 0) {
    return "No specific categories mentioned";
  } else if (mentionedCategories.length === 1) {
    return `Mentioned: ${mentionedCategories[0]}`;
  } else if (mentionedCategories.length === 4) {
    return "Complete review covering all categories";
  } else {
    return `Mentioned: ${mentionedCategories.join(', ')}`;
  }
};