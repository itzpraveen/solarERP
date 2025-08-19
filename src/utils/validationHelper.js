const mongoose = require('mongoose');

/**
 * Validation and sanitization helper functions
 * Used to secure controllers against NoSQL injection and other input vulnerabilities
 */

// Maximum pagination limits
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;

/**
 * Sanitize query parameters to prevent NoSQL injection
 * Removes dangerous MongoDB operators that could be injected
 */
const sanitizeQuery = (query) => {
  const sanitized = {};
  
  for (const key in query) {
    if (query.hasOwnProperty(key)) {
      const value = query[key];
      
      // Skip if value is an object with MongoDB operators (potential injection)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Only allow specific safe operators
        const allowedOperators = ['$gte', '$gt', '$lte', '$lt', '$ne', '$in', '$nin'];
        const hasUnsafeOperator = Object.keys(value).some(op => 
          op.startsWith('$') && !allowedOperators.includes(op)
        );
        
        if (hasUnsafeOperator) {
          continue; // Skip this field entirely
        }
      }
      
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate and sanitize pagination parameters
 */
const sanitizePagination = (query) => {
  let { page, limit } = query;
  
  // Ensure page and limit are positive integers
  page = Math.max(1, parseInt(page) || DEFAULT_PAGE);
  limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit) || DEFAULT_LIMIT));
  
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

/**
 * Validate and sanitize sort parameters
 */
const sanitizeSort = (sortParam, allowedFields = [], defaultSort = '-createdAt') => {
  if (!sortParam || typeof sortParam !== 'string') {
    return defaultSort;
  }
  
  // Split by comma and validate each field
  const sortFields = sortParam.split(',').map(field => field.trim());
  const validFields = [];
  
  for (const field of sortFields) {
    const isDescending = field.startsWith('-');
    const fieldName = isDescending ? field.substring(1) : field;
    
    // Check if field is allowed (if allowedFields is provided)
    if (allowedFields.length > 0 && !allowedFields.includes(fieldName)) {
      continue; // Skip invalid field
    }
    
    // Basic field name validation (alphanumeric, underscore, dot for nested fields)
    if (!/^[a-zA-Z0-9_.]+$/.test(fieldName)) {
      continue; // Skip invalid field
    }
    
    validFields.push(isDescending ? `-${fieldName}` : fieldName);
  }
  
  return validFields.length > 0 ? validFields.join(' ') : defaultSort;
};

/**
 * Validate and sanitize field selection parameters
 */
const sanitizeFields = (fieldsParam, allowedFields = []) => {
  if (!fieldsParam || typeof fieldsParam !== 'string') {
    return '-__v'; // Default to excluding version field
  }
  
  const fields = fieldsParam.split(',').map(field => field.trim());
  const validFields = [];
  
  for (const field of fields) {
    const isExcluded = field.startsWith('-');
    const fieldName = isExcluded ? field.substring(1) : field;
    
    // Check if field is allowed (if allowedFields is provided)
    if (allowedFields.length > 0 && !allowedFields.includes(fieldName)) {
      continue; // Skip invalid field
    }
    
    // Basic field name validation
    if (!/^[a-zA-Z0-9_.]+$/.test(fieldName)) {
      continue; // Skip invalid field
    }
    
    validFields.push(isExcluded ? `-${fieldName}` : fieldName);
  }
  
  return validFields.length > 0 ? validFields.join(' ') : '-__v';
};

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Sanitize string input to prevent XSS and other attacks
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') {
    return str;
  }
  
  // Remove potentially dangerous characters
  return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
           .replace(/javascript:/gi, '')
           .replace(/on\w+="[^"]*"/gi, '')
           .trim();
};

/**
 * Build safe query object for filtering with soft delete support
 */
const buildSafeQuery = (queryParams, excludedFields = ['page', 'sort', 'limit', 'fields'], includeSoftDelete = true) => {
  const queryObj = { ...queryParams };
  
  // Remove pagination and other control parameters
  excludedFields.forEach(field => delete queryObj[field]);
  
  // Sanitize the query to prevent NoSQL injection
  const sanitizedQuery = sanitizeQuery(queryObj);
  
  // Add soft delete filter if required
  if (includeSoftDelete) {
    sanitizedQuery.active = { $ne: false };
  }
  
  return sanitizedQuery;
};

/**
 * Advanced filtering with safe MongoDB operator replacement
 */
const buildAdvancedFilter = (sanitizedQuery) => {
  let queryStr = JSON.stringify(sanitizedQuery);
  
  // Only replace specific allowed operators
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt|ne)\b/g, match => `$${match}`);
  
  return JSON.parse(queryStr);
};

/**
 * Validate required fields in request body
 */
const validateRequiredFields = (body, requiredFields) => {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      missingFields.push(field);
    }
  }
  
  return missingFields;
};

/**
 * Sanitize request body to prevent injection attacks
 */
const sanitizeBody = (body) => {
  const sanitized = {};
  
  for (const key in body) {
    if (body.hasOwnProperty(key)) {
      let value = body[key];
      
      if (typeof value === 'string') {
        value = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects but avoid dangerous operators
        if (Array.isArray(value)) {
          value = value.map(item => 
            typeof item === 'string' ? sanitizeString(item) : item
          );
        } else {
          // For objects, be very careful about MongoDB operators
          const sanitizedObj = {};
          for (const nestedKey in value) {
            if (!nestedKey.startsWith('$')) { // Prevent injection of MongoDB operators
              sanitizedObj[nestedKey] = typeof value[nestedKey] === 'string' 
                ? sanitizeString(value[nestedKey]) 
                : value[nestedKey];
            }
          }
          value = sanitizedObj;
        }
      }
      
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Create standardized error response
 */
const createErrorResponse = (message, statusCode = 400, errors = null) => {
  const errorResponse = {
    status: 'error',
    message
  };
  
  if (errors) {
    errorResponse.errors = errors;
  }
  
  return { statusCode, response: errorResponse };
};

/**
 * Email validation
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Phone validation
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Date validation
 */
const isValidDate = (date) => {
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate);
};

module.exports = {
  MAX_LIMIT,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  sanitizeQuery,
  sanitizePagination,
  sanitizeSort,
  sanitizeFields,
  isValidObjectId,
  sanitizeString,
  buildSafeQuery,
  buildAdvancedFilter,
  validateRequiredFields,
  sanitizeBody,
  createErrorResponse,
  isValidEmail,
  isValidPhone,
  isValidDate
};