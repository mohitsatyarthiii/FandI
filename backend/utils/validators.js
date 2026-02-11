import { validationResult } from 'express-validator';

// Validation middleware
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// Custom validators
export const customValidators = {
  // Validate phone number (Indian format)
  isIndianPhone: (value) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(value)) {
      throw new Error('Invalid Indian phone number');
    }
    return true;
  },
  
  // Validate location
  isValidLocation: (value) => {
    const validLocations = ['mathura', 'agra', 'noida', 'all'];
    if (!validLocations.includes(value)) {
      throw new Error(`Location must be one of: ${validLocations.join(', ')}`);
    }
    return true;
  },
  
  // Validate date is in future
  isFutureDate: (value) => {
    const inputDate = new Date(value);
    const today = new Date();
    
    if (inputDate <= today) {
      throw new Error('Date must be in the future');
    }
    return true;
  },
  
  // Validate priority
  isValidPriority: (value) => {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(value)) {
      throw new Error(`Priority must be one of: ${validPriorities.join(', ')}`);
    }
    return true;
  }
};

// Sanitize input data
export const sanitizeData = (data) => {
  const sanitized = { ...data };
  
  // Trim string fields
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key].trim();
    }
  });
  
  return sanitized;
};

// Validate MongoDB ObjectId
export const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};