// src/utils/dateUtils.js

/**
 * Format a date object or Firestore timestamp into a readable string
 * 
 * @param {Date|Object} date - Date object or Firestore timestamp
 * @param {string} format - Optional format string (defaults to 'MMM D, YYYY')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'MMM D, YYYY') => {
  if (!date) return 'Unknown date';
  
  try {
    let dateObj;
    
    // Handle Firestore timestamp
    if (date && typeof date === 'object' && date.seconds) {
      dateObj = new Date(date.seconds * 1000);
    } 
    // Handle ISO string
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    } 
    // Handle Date object
    else if (date instanceof Date) {
      dateObj = date;
    } else {
      return 'Invalid date';
    }
    
    // Check for invalid date
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    // Define months array for use in multiple formats
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Format date based on format string
    if (format === 'MMM D, YYYY') {
      return `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
    } 
    else if (format === 'YYYY-MM-DD') {
      return dateObj.toISOString().split('T')[0];
    }
    else if (format === 'MM/DD/YYYY') {
      return `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;
    }
    else if (format === 'relative') {
      // Simple relative time formatting
      const now = new Date();
      const diffMs = now - dateObj;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffSec < 60) return 'just now';
      if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
      if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
      if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
      
      // Fall back to standard format for older dates
      return `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
    }
    // Default format for unsupported format strings
    return dateObj.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Get a relative time string (e.g., "2 days ago")
 * 
 * @param {Date|Object} date - Date object or Firestore timestamp
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  return formatDate(date, 'relative');
};

/**
 * Compare two dates for sorting
 * 
 * @param {Date|Object} dateA - First date
 * @param {Date|Object} dateB - Second date
 * @param {boolean} ascending - Sort order (true for ascending, false for descending)
 * @returns {number} Comparison result
 */
export const compareDates = (dateA, dateB, ascending = true) => {
  let dateObjA, dateObjB;
  
  // Handle Firestore timestamp
  if (dateA && typeof dateA === 'object' && dateA.seconds) {
    dateObjA = new Date(dateA.seconds * 1000);
  } else if (typeof dateA === 'string') {
    dateObjA = new Date(dateA);
  } else if (dateA instanceof Date) {
    dateObjA = dateA;
  } else {
    dateObjA = new Date(0); // Invalid date defaults to epoch
  }
  
  if (dateB && typeof dateB === 'object' && dateB.seconds) {
    dateObjB = new Date(dateB.seconds * 1000);
  } else if (typeof dateB === 'string') {
    dateObjB = new Date(dateB);
  } else if (dateB instanceof Date) {
    dateObjB = dateB;
  } else {
    dateObjB = new Date(0); // Invalid date defaults to epoch
  }
  
  // Compare timestamps
  const compareResult = dateObjA.getTime() - dateObjB.getTime();
  
  // Apply sort direction
  return ascending ? compareResult : -compareResult;
};