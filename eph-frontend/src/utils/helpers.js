export const formatError = (error) => {
  if (!error) return 'An unknown error occurred';
  
  if (typeof error === 'string') return error;
  
  if (error.message) return error.message;
  
  if (error.errors) {
    if (typeof error.errors === 'object') {
      const errorMessages = [];
      Object.entries(error.errors).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          errorMessages.push(`${key}: ${value.join(', ')}`);
        } else {
          errorMessages.push(`${key}: ${value}`);
        }
      });
      return errorMessages.join('\n');
    }
    
    if (Array.isArray(error.errors)) {
      return error.errors.join('\n');
    }
  }
  
  return 'An error occurred';
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};