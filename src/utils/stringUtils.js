// src/utils/stringUtils.js

/**
 * Convert a string to a URL-friendly slug
 * @param {string} text - The text to convert to a slug
 * @returns {string} - URL-friendly slug
 */
export const createSlug = (text) => {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
      .replace(/(^-|-$)/g, '')     // Remove leading/trailing hyphens
      .trim();
  };
  
  /**
   * Convert a slug back to a readable format
   * @param {string} slug - The slug to convert
   * @returns {string} - Human-readable text
   */
  export const slugToReadable = (slug) => {
    if (!slug) return '';
    
    return slug
      .replace(/-/g, ' ')  // Replace hyphens with spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
  };