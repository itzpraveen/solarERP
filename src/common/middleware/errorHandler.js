/**
 * Global error handler middleware
 * This middleware handles all errors in a consistent way
 */
const { validationResult } = require('express-validator'); // Import validationResult
const { AppError } = require('../utils/errors');
const config = require('../config');

/**
 * Middleware to handle express-validator validation errors
 * Place this middleware immediately after your validation checks in the route definition.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors for a consistent response
    const formattedErrors = errors.array().map((err) => ({
      field: err.param, // Use param instead of path for consistency
      message: err.msg,
      value: err.value, // Optionally include the value that failed validation
    }));
    // Use AppError for consistent error structure, send 400 Bad Request
    return next(new AppError('Validation failed', 400, formattedErrors)); // Added return
    // Or send response directly:
    // return res.status(400).json({ status: 'fail', errors: formattedErrors });
  }
  // No validation errors, proceed to the next middleware/controller
  return next(); // Added return
};

// Removed unused sendErrorDev function

/**
 * Handle production errors
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

/**
 * Handle MongoDB duplicate key error
 * @param {Error} err - Error object
 * @returns {AppError} - Formatted error
 */
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

/**
 * Handle MongoDB validation error
 * @param {Error} err - Error object
 * @returns {AppError} - Formatted error
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handle JWT error
 * @returns {AppError} - Formatted error
 */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

/**
 * Handle JWT expired error
 * @returns {AppError} - Formatted error
 */
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

/**
 * Handle Mongoose CastError
 * @param {Error} err - Error object
 * @returns {AppError} - Formatted error
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} _next - Express next function (renamed as unused)
 */
const globalErrorHandler = (err, req, res, _next) => {
  // Rename next to _next
  // Create a copy to work with, avoiding param reassignment
  const errorToHandle = { ...err, message: err.message };
  errorToHandle.statusCode = errorToHandle.statusCode || 500;
  errorToHandle.status = errorToHandle.status || 'error';

  if (config.server.env === 'development') {
    // Include validation errors array in dev response if present
    const response = {
      status: errorToHandle.status,
      error: errorToHandle, // Send the copied error object
      message: errorToHandle.message,
      stack: errorToHandle.stack,
    };
    if (errorToHandle.errors) {
      // Check if the error object has an 'errors' property (from handleValidationErrors)
      response.validationErrors = errorToHandle.errors;
    }
    return res.status(errorToHandle.statusCode).json(response); // Added return
  }
  if (config.server.env === 'production') {
    let handledError = errorToHandle; // Use the copied error

    // Handle specific operational errors first
    if (handledError.message === 'Validation failed' && handledError.errors) {
      // If it's our custom validation error, send the details
      return res.status(handledError.statusCode).json({
        // Added return
        status: handledError.status,
        message: handledError.message,
        errors: handledError.errors, // Include the formatted validation errors
      });
    }
    if (handledError.code === 11000)
      handledError = handleDuplicateFieldsDB(handledError);
    if (handledError.name === 'ValidationError')
      handledError = handleValidationErrorDB(handledError); // Mongoose validation
    if (handledError.name === 'CastError')
      handledError = handleCastErrorDB(handledError);
    if (handledError.name === 'JsonWebTokenError')
      handledError = handleJWTError();
    if (handledError.name === 'TokenExpiredError')
      handledError = handleJWTExpiredError();

    // Send generic or specific operational error message
    sendErrorProd(handledError, res); // Pass the handledError
  }
};

// Export both the global handler and the validation handler
module.exports = {
  globalErrorHandler,
  handleValidationErrors: exports.handleValidationErrors, // Re-export for clarity if needed elsewhere
};
