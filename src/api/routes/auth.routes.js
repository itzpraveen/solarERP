const express = require('express');
const authController = require('../../controllers/auth.controller');
const { check } = require('express-validator');
const router = express.Router();

// Input validation
const validateSignup = [
  check('firstName', 'First name is required').not().isEmpty().trim().escape(),
  check('lastName', 'Last name is required').not().isEmpty().trim().escape(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const validateLogin = [
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password is required').not().isEmpty()
];

const validatePasswordReset = [
  check('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const validatePasswordUpdate = [
  check('currentPassword', 'Current password is required').not().isEmpty(),
  check('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .custom((value, { req }) => value !== req.body.currentPassword).withMessage('New password must be different from current password')
];

const validateForgotPassword = [
  check('email', 'Please include a valid email').isEmail().normalizeEmail()
];

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }
  next();
};

// Auth routes
router.post('/signup', validateSignup, handleValidationErrors, authController.signup);
router.post('/login', validateLogin, handleValidationErrors, authController.login);
router.post('/forgotPassword', validateForgotPassword, handleValidationErrors, authController.forgotPassword);
router.patch('/resetPassword/:token', validatePasswordReset, handleValidationErrors, authController.resetPassword);

// Demo user creation (protected and only for development)
if (process.env.NODE_ENV !== 'production') {
  router.post('/demo', authController.createDemoUser);
}

// Protected routes
router.use(authController.protect);
router.get('/me', authController.getMe);
router.patch('/updatePassword', validatePasswordUpdate, authController.updatePassword);

module.exports = router;