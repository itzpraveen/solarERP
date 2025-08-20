'use strict';

const logger = require('../utils/logger');
const AppError = require('../utils/appError');

/**
 * Handle cast errors from database
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle duplicate field errors
 */
const handleDuplicateFieldsDB = (err) => {
  const field = err.errors?.[0]?.path || 'field';
  const message = `Duplicate value for ${field}. Please use another value!`;
  return new AppError(message, 400);
};

/**
 * Handle validation errors
 */
const handleValidationErrorDB = (err) => {
  const errors = err.errors?.map(e => e.message).join('. ') || 'Validation error';
  const message = `Invalid input data. ${errors}`;
  return new AppError(message, 400);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

/**
 * Handle Sequelize errors
 */
const handleSequelizeValidationError = (err) => {
  const errors = Object.values(err.errors).map(e => e.message);
  const message = `Validation error: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleSequelizeUniqueConstraintError = (err) => {
  const field = err.errors?.[0]?.path || 'field';
  const message = `The ${field} already exists. Please use another value.`;
  return new AppError(message, 400);
};

const handleSequelizeForeignKeyConstraintError = (err) => {
  const message = 'Referenced record does not exist or cannot be deleted due to existing references.';
  return new AppError(message, 400);
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, req, res) => {
  // API error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // Rendered page error
  logger.error('ERROR 💥', err);
  return res.status(err.statusCode).json({
    status: 'error',
    message: err.message
  });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, req, res) => {
  // API error
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }

    // Programming or other unknown error: don't leak error details
    logger.logError(err, req);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }

  // Rendered page error
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  // Programming or other unknown error
  logger.logError(err, req);
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
};

/**
 * Global error handling middleware
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = Object.assign({}, err);
    error.message = err.message;
    error.name = err.name;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    
    // Sequelize errors
    if (error.name === 'SequelizeValidationError') {
      error = handleSequelizeValidationError(error);
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      error = handleSequelizeUniqueConstraintError(error);
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      error = handleSequelizeForeignKeyConstraintError(error);
    }

    sendErrorProd(error, req, res);
  }
};

/**
 * Handle 404 errors
 */
module.exports.handle404 = (req, res, next) => {
  const message = `Can't find ${req.originalUrl} on this server!`;
  const err = new AppError(message, 404);
  next(err);
};

/**
 * Handle async errors
 */
module.exports.handleAsyncErrors = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};