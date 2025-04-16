/**
 * Auth Routes
 * This module defines routes for authentication
 */

const express = require('express');
const authController = require('./auth.controller');
const authValidation = require('./auth.validation');

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', authValidation.signup, authController.signup);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authValidation.login, authController.login);

/**
 * @route   POST /api/auth/forgotPassword
 * @desc    Forgot password
 * @access  Public
 */
router.post(
  '/forgotPassword',
  authValidation.forgotPassword,
  authController.forgotPassword
);

/**
 * @route   PATCH /api/auth/resetPassword/:token
 * @desc    Reset password
 * @access  Public
 */
router.patch(
  '/resetPassword/:token',
  authValidation.resetPassword,
  authController.resetPassword
);

/**
 * @route   POST /api/auth/demo
 * @desc    Create demo user (for development)
 * @access  Public
 */
router.post('/demo', authController.createDemoUser);

// Protected routes - require authentication
router.use(authController.protect);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authController.getMe);

/**
 * @route   PATCH /api/auth/updatePassword
 * @desc    Update password
 * @access  Private
 */
router.patch(
  '/updatePassword',
  authValidation.updatePassword,
  authController.updatePassword
);

module.exports = router;
