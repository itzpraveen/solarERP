/**
 * Auth Validation
 * This module contains validation schemas for auth-related requests
 */

const { check } = require('express-validator');

/**
 * Validation schemas for auth-related requests
 */
const authValidation = {
  /**
   * Validate signup request
   */
  signup: [
    check('firstName')
      .notEmpty()
      .withMessage('First name is required')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),

    check('lastName')
      .notEmpty()
      .withMessage('Last name is required')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),

    check('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),

    check('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[a-zA-Z]/)
      .withMessage('Password must contain at least one letter'),

    check('role')
      .optional()
      .isIn(['user', 'admin', 'manager', 'sales', 'installer', 'finance'])
      .withMessage('Invalid role'),
  ],

  /**
   * Validate login request
   */
  login: [
    check('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),

    check('password').notEmpty().withMessage('Password is required'),
  ],

  /**
   * Validate forgot password request
   */
  forgotPassword: [
    check('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
  ],

  /**
   * Validate reset password request
   */
  resetPassword: [
    check('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[a-zA-Z]/)
      .withMessage('Password must contain at least one letter'),
  ],

  /**
   * Validate update password request
   */
  updatePassword: [
    check('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),

    check('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('New password must contain at least one number')
      .matches(/[a-zA-Z]/)
      .withMessage('New password must contain at least one letter')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error(
            'New password cannot be the same as current password'
          );
        }
        return true;
      }),
  ],
};

module.exports = authValidation;
