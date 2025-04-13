/**
 * Auth Service
 * This module handles business logic related to authentication
 */

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const authRepository = require('./auth.repository');
const config = require('../../common/config');
const { 
  AuthenticationError, 
  ValidationError,
  NotFoundError 
} = require('../../common/utils/errors');
const sendEmail = require('../../utils/email');

/**
 * Auth Service
 * @class
 */
class AuthService {
  /**
   * Generate JWT token
   * @param {string} userId - User ID
   * @returns {string} JWT token
   */
  generateToken(userId) {
    return jwt.sign({ id: userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} User and token
   */
  async signup(userData) {
    // Create new user
    const newUser = await authRepository.createUser({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'user'
    });
    
    // Generate token
    const token = this.generateToken(newUser._id);
    
    // Remove password from output
    newUser.password = undefined;
    
    return { user: newUser, token };
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} User and token
   * @throws {ValidationError} If email or password is missing
   * @throws {AuthenticationError} If credentials are invalid
   */
  async login(email, password) {
    // Check if email and password exist
    if (!email || !password) {
      throw new ValidationError('Please provide email and password');
    }
    
    // Get user from database
    const user = await authRepository.findUserByEmail(email);
    
    // Check if user exists and password is correct
    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new AuthenticationError('Incorrect email or password');
    }
    
    // Generate token
    const token = this.generateToken(user._id);
    
    // Remove password from output
    user.password = undefined;
    
    return { user, token };
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token
   * @throws {AuthenticationError} If token is invalid
   */
  async verifyToken(token) {
    try {
      return await promisify(jwt.verify)(token, config.jwt.secret);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid token. Please log in again');
      }
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Your token has expired. Please log in again');
      }
      throw error;
    }
  }

  /**
   * Protect route - verify user is authenticated
   * @param {string} token - JWT token
   * @returns {Object} Current user
   * @throws {AuthenticationError} If not authenticated
   */
  async protect(token) {
    // Verify token
    const decoded = await this.verifyToken(token);
    
    // Check if user still exists
    const currentUser = await authRepository.findUserById(decoded.id);
    
    // Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      throw new AuthenticationError('User recently changed password. Please log in again');
    }
    
    return currentUser;
  }

  /**
   * Forgot password
   * @param {string} email - User email
   * @param {string} resetURL - Reset URL base
   * @returns {string} Success message
   * @throws {NotFoundError} If user not found
   */
  async forgotPassword(email, resetURL) {
    // Get user by email
    const user = await authRepository.findUserByEmail(email);
    
    if (!user) {
      throw new NotFoundError('There is no user with that email address');
    }
    
    // Generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    // Create reset URL
    const passwordResetURL = `${resetURL}/${resetToken}`;
    
    const message = `Forgot your password? Submit a PATCH request with your new password to: ${passwordResetURL}.\nIf you didn't forget your password, please ignore this email!`;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 min)',
        message
      });
      
      return 'Token sent to email!';
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      throw new Error('There was an error sending the email. Try again later!');
    }
  }

  /**
   * Reset password
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Object} User and token
   * @throws {AuthenticationError} If token is invalid or expired
   */
  async resetPassword(token, newPassword) {
    // Hash the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user by reset token
    const user = await authRepository.findUserByResetToken(hashedToken, Date.now());
    
    if (!user) {
      throw new AuthenticationError('Token is invalid or has expired');
    }
    
    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    // Generate JWT token
    const jwtToken = this.generateToken(user._id);
    
    // Remove password from output
    user.password = undefined;
    
    return { user, token: jwtToken };
  }

  /**
   * Update password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Object} User and token
   * @throws {AuthenticationError} If current password is incorrect
   */
  async updatePassword(userId, currentPassword, newPassword) {
    // Get user with password
    const user = await authRepository.findUserByIdWithPassword(userId);
    
    // Check if current password is correct
    if (!(await user.correctPassword(currentPassword, user.password))) {
      throw new AuthenticationError('Your current password is incorrect');
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Generate JWT token
    const token = this.generateToken(user._id);
    
    // Remove password from output
    user.password = undefined;
    
    return { user, token };
  }

  /**
   * Create demo user
   * @returns {Object} Demo user credentials
   */
  async createDemoUser() {
    // Check if demo user already exists
    const existingUser = await authRepository.findDemoUser();
    
    if (existingUser) {
      return {
        message: 'Demo user already exists',
        credentials: {
          email: 'demo@example.com',
          password: 'password123'
        }
      };
    }
    
    // Create a new demo user
    await authRepository.createUser({
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@example.com',
      password: 'password123',
      role: 'admin'
    });
    
    return {
      message: 'Demo user created successfully',
      credentials: {
        email: 'demo@example.com',
        password: 'password123'
      }
    };
  }
}

module.exports = new AuthService();