const express = require('express');
const authController = require('../controllers/auth.controller');
const { check } = require('express-validator');
const router = express.Router();

// Input validation
const validateSignup = [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 8 characters').isLength({ min: 8 })
];

const validateLogin = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

const validatePasswordReset = [
  check('password', 'Password must be at least 8 characters').isLength({ min: 8 })
];

const validatePasswordUpdate = [
  check('currentPassword', 'Current password is required').exists(),
  check('newPassword', 'New password must be at least 8 characters').isLength({ min: 8 })
];

// Auth routes
router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', validatePasswordReset, authController.resetPassword);

// Demo user creation (for development)
// router.post('/demo', authController.createDemoUser); // Disabled for production - was causing undefined error

// Protected routes
router.use(authController.protect);
router.get('/me', authController.getMe);
router.patch('/updatePassword', validatePasswordUpdate, authController.updatePassword);

module.exports = router;