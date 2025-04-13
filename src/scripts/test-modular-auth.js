/**
 * Test script for the modular auth architecture
 * This script tests the auth service and repository
 */

require('dotenv').config();
const mongoose = require('mongoose');
const authService = require('../modules/auth/auth.service');
const authRepository = require('../modules/auth/auth.repository');
const config = require('../common/config');
const {
  AuthenticationError,
  NotFoundError,
} = require('../common/utils/errors');
const User = require('../api/models/user.model'); // Moved from cleanUp

// Test user data
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'Password123',
  role: 'user',
};

/**
 * Test signup
 */
async function testSignup() {
  try {
    return await authService.signup(testUser);
  } catch (error) {
    console.error('Signup failed:', error);
    throw error;
  }
}

/**
 * Test login
 */
async function testLogin(email, password) {
  try {
    return await authService.login(email, password);
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

/**
 * Test login with incorrect credentials
 */
async function testLoginWithIncorrectCredentials() {
  try {
    await authService.login(testUser.email, 'wrongpassword');
    throw new Error('Login should have failed with incorrect credentials');
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.log(
        'Login correctly failed with incorrect credentials:',
        error.message
      );
      return;
    }
    throw error;
  }
}

/**
 * Test token verification
 */
async function testVerifyToken(token) {
  try {
    return await authService.verifyToken(token);
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
}

/**
 * Test get user by ID
 */
async function testGetUserById(id) {
  try {
    return await authRepository.findUserById(id);
  } catch (error) {
    console.error('Get user by ID failed:', error);
    throw error;
  }
}

/**
 * Test get user by non-existent ID
 */
async function testGetUserByNonExistentId() {
  try {
    await authRepository.findUserById('5f9d5c5b9d9d5c5b9d9d5c5b');
    throw new Error('Get user by non-existent ID should have failed');
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.log(
        'Get user by non-existent ID correctly failed:',
        error.message
      );
      return;
    }
    throw error;
  }
}

/**
 * Clean up test data
 */
async function cleanUp() {
  try {
    // User model is now required at the top
    await User.deleteOne({ email: testUser.email });
    console.log('Cleaned up test user');
  } catch (error) {
    console.error('Clean up failed:', error);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    console.log('Starting tests...');

    // Clean up any existing test user
    await cleanUp();

    // Test signup
    console.log('\n--- Testing signup ---');
    const signupResult = await testSignup();
    console.log('Signup successful:', signupResult.user.email);

    // Test login with correct credentials
    console.log('\n--- Testing login (correct credentials) ---');
    const loginResult = await testLogin(testUser.email, testUser.password);
    console.log('Login successful:', loginResult.user.email);

    // Test login with incorrect credentials
    console.log('\n--- Testing login (incorrect credentials) ---');
    await testLoginWithIncorrectCredentials();

    // Test token verification
    console.log('\n--- Testing token verification ---');
    const { token } = loginResult;
    const verifyResult = await testVerifyToken(token);
    console.log('Token verification successful:', verifyResult.id);

    // Test get user by ID
    console.log('\n--- Testing get user by ID ---');
    // eslint-disable-next-line no-underscore-dangle
    const userId = loginResult.user._id.toString();
    const user = await testGetUserById(userId);
    console.log('Get user by ID successful:', user.email);

    // Test get user by non-existent ID
    console.log('\n--- Testing get user by non-existent ID ---');
    await testGetUserByNonExistentId();

    // Clean up
    await cleanUp();

    console.log('\nAll tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Connect to database
mongoose
  .connect(config.database.uri, config.database.options)
  .then(() => {
    console.log('Connected to MongoDB');
    runTests(); // runTests is now defined before this call
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
