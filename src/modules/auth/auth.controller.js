/**
 * Auth Controller
 * This module handles HTTP requests and responses for authentication
 */

const authService = require('./auth.service');
const catchAsync = require('../../common/utils/catchAsync');
const { ValidationError } = require('../../common/utils/errors');
const { validationResult } = require('express-validator');

/**
 * Auth Controller
 * @class
 */
class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  signup = catchAsync(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }
    
    // Register user using auth service
    const { user, token } = await authService.signup(req.body);
    
    // Send response
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  });

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  login = catchAsync(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }
    
    const { email, password } = req.body;
    
    // Login user using auth service
    const { user, token } = await authService.login(email, password);
    
    // Send response
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  });

  /**
   * Protect routes - verify user is authenticated
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  protect = catchAsync(async (req, res, next) => {
    // Get token from authorization header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return next(new ValidationError('You are not logged in! Please log in to get access.'));
    }
    
    // Verify token and get user
    const currentUser = await authService.protect(token);
    
    // Set user on request object
    req.user = currentUser;
    next();
  });

  /**
   * Restrict to certain roles
   * @param {...string} roles - Allowed roles
   * @returns {Function} Middleware function
   */
  restrictTo = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(new ValidationError('You do not have permission to perform this action', 403));
      }
      
      next();
    };
  };

  /**
   * Forgot password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  forgotPassword = catchAsync(async (req, res, next) => {
    // Create reset URL base
    const resetURL = `${req.protocol}://${req.get('host')}/api/auth/resetPassword`;
    
    // Call service to handle forgot password logic
    const message = await authService.forgotPassword(req.body.email, resetURL);
    
    // Send response
    res.status(200).json({
      status: 'success',
      message
    });
  });

  /**
   * Reset password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  resetPassword = catchAsync(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }
    
    // Call service to handle reset password logic
    const { user, token } = await authService.resetPassword(
      req.params.token,
      req.body.password
    );
    
    // Send response
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  });

  /**
   * Update password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  updatePassword = catchAsync(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }
    
    // Call service to handle update password logic
    const { user, token } = await authService.updatePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    
    // Send response
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  });

  /**
   * Get current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  getMe = catchAsync(async (req, res, next) => {
    res.status(200).json({
      status: 'success',
      data: req.user
    });
  });

  /**
   * Create demo user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  createDemoUser = catchAsync(async (req, res, next) => {
    // Call service to handle demo user creation
    const result = await authService.createDemoUser();
    
    // Send response
    res.status(result.message.includes('created') ? 201 : 200).json({
      status: 'success',
      message: result.message,
      data: result.credentials
    });
  });
}

module.exports = new AuthController();