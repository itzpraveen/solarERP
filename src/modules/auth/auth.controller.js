/**
 * Auth Controller
 * This module handles HTTP requests and responses for authentication
 */

const { validationResult } = require('express-validator');
const authService = require('./auth.service');
const catchAsync = require('../../common/utils/catchAsync');
const { ValidationError } = require('../../common/utils/errors');

/**
 * Auth Controller
 * @class
 */
class AuthController {
  constructor() {
    this.signup = catchAsync(this.signup.bind(this));
    this.login = catchAsync(this.login.bind(this));
    this.protect = catchAsync(this.protect.bind(this));
    this.forgotPassword = catchAsync(this.forgotPassword.bind(this));
    this.resetPassword = catchAsync(this.resetPassword.bind(this));
    this.updatePassword = catchAsync(this.updatePassword.bind(this));
    this.getMe = catchAsync(this.getMe.bind(this));
    this.createDemoUser = catchAsync(this.createDemoUser.bind(this));
    // restrictTo does not need catchAsync
  }

  /**
   * Register a new user
   */
  async signup(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }
    const { user, token } = await authService.signup(req.body);
    res.status(201).json({
      status: 'success',
      token,
      data: { user },
    });
  }

  /**
   * Login user
   */
  async login(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);
    res.status(200).json({
      status: 'success',
      token,
      data: { user },
    });
  }

  /**
   * Protect routes - verify user is authenticated
   */
  async protect(req, res, next) {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      [, token] = req.headers.authorization.split(' '); // Use array destructuring
    }
    if (!token) {
      return next(
        new ValidationError(
          'You are not logged in! Please log in to get access.'
        )
      );
    }
    const currentUser = await authService.protect(token);
    req.user = currentUser;
    return next(); // Added return
  }

  /**
   * Restrict to certain roles
   */
  restrictTo(...roles) {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(
          new ValidationError(
            'You do not have permission to perform this action',
            403
          )
        );
      }
      return next(); // Added return
    };
  }

  /**
   * Forgot password
   */
  async forgotPassword(req, res, next) {
    const resetURL = `${req.protocol}://${req.get('host')}/api/auth/resetPassword`;
    const message = await authService.forgotPassword(req.body.email, resetURL);
    res.status(200).json({
      status: 'success',
      message,
    });
    // No return needed here as it's the main function body
  }

  /**
   * Reset password
   */
  async resetPassword(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }
    const { user, token } = await authService.resetPassword(
      req.params.token,
      req.body.password
    );
    res.status(200).json({
      status: 'success',
      token,
      data: { user },
    });
    // No return needed here as it's the main function body
  }

  /**
   * Update password
   */
  async updatePassword(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }
    const { user, token } = await authService.updatePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    res.status(200).json({
      status: 'success',
      token,
      data: { user },
    });
    // No return needed here as it's the main function body
  }

  /**
   * Get current user
   */
  async getMe(req, res, next) {
    res.status(200).json({
      status: 'success',
      data: req.user,
    });
    // No return needed here as it's the main function body
  }

  /**
   * Create demo user
   */
  async createDemoUser(req, res, next) {
    const result = await authService.createDemoUser();
    res.status(result.message.includes('created') ? 201 : 200).json({
      status: 'success',
      message: result.message,
      data: result.credentials,
    });
    // No return needed here as it's the main function body
  }
}

module.exports = new AuthController();
