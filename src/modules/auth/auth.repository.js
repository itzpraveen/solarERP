/**
 * Auth Repository
 * This module abstracts database operations related to authentication
 */

const User = require('../../api/models/user.model');
const { NotFoundError } = require('../../common/utils/errors');

/**
 * Auth Repository
 * @class
 */
class AuthRepository {
  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User object
   */
  async findUserByEmail(email) {
    return User.findOne({ email }).select('+password');
  }

  /**
   * Find a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} User object
   * @throws {NotFoundError} If user not found
   */
  async findUserById(id) {
    const user = await User.findById(id);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    return user;
  }

  /**
   * Find a user by ID and select password
   * @param {string} id - User ID
   * @returns {Promise<Object>} User object with password
   * @throws {NotFoundError} If user not found
   */
  async findUserByIdWithPassword(id) {
    const user = await User.findById(id).select('+password');
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    return user;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    return User.create(userData);
  }

  /**
   * Find a user by password reset token
   * @param {string} hashedToken - Hashed reset token
   * @param {Date} expiryDate - Token expiry date
   * @returns {Promise<Object>} User object
   */
  async findUserByResetToken(hashedToken, expiryDate) {
    return User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: expiryDate }
    });
  }

  /**
   * Update user password
   * @param {Object} user - User object
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Updated user
   */
  async updatePassword(user, newPassword) {
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    return user.save();
  }

  /**
   * Find demo user by email
   * @param {string} email - Demo user email
   * @returns {Promise<Object>} User object
   */
  async findDemoUser(email = 'demo@example.com') {
    return User.findOne({ email });
  }
}

module.exports = new AuthRepository();