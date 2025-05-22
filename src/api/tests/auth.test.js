const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../server'); // Destructure app from server exports
const User = require('../models/user.model.js'); // Corrected user model path
const bcrypt = require('bcryptjs'); // For hashing password

// --- Test Suite for Auth API Endpoints ---
describe('Auth API Endpoints', () => {
  let registrationUserEmail; // For user created in registration test
  let loginTestUser; // For user created in beforeAll for login tests
  const loginTestUserCredentials = {
    email: `testlogin_${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Login',
    lastName: 'TestUser',
    role: 'user',
  };

  // --- Hooks ---
  // The Mongoose connection is now handled by jest.setup.js
  beforeAll(async () => {
    // Create a user for login tests
    // Ensure Mongoose is connected (implicitly by jest.setup.js via app server)
    // Adding a small delay or check for connection state might be needed if app server connection is slow
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
        // If not connected or connecting, something is wrong with global setup or app init
        // For now, we assume jest.setup.js + server.js handles the connection.
        console.warn(`Mongoose connection not ready in auth.test.js beforeAll. State: ${mongoose.connection.readyState}. Tests might fail if DB is needed immediately.`);
        // Attempting a direct connection here could conflict if the app also tries.
        // For now, proceed assuming the app will connect using the MONGODB_URI from process.env.
    }

    try {
      // console.log('Creating login test user in auth.test.js...');
      // Hash password before saving
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(loginTestUserCredentials.password, salt);

      loginTestUser = new User({
        firstName: loginTestUserCredentials.firstName,
        lastName: loginTestUserCredentials.lastName,
        email: loginTestUserCredentials.email,
        password: hashedPassword,
        role: loginTestUserCredentials.role,
      });
      await loginTestUser.save();
      console.log(`Created login test user: ${loginTestUser.email}. State:`, mongoose.connection.readyState);
    } catch (error) {
      console.error('Error creating login test user in auth.test.js beforeAll:', error);
      console.error('DB State at user creation failure:', mongoose.connection.readyState);
      throw error; // Stop tests if user creation fails
    }
  });

  afterAll(async () => {
    console.log('Starting afterAll in auth.test.js. DB State:', mongoose.connection.readyState);
    try {
      // Clean up users created during tests
      if (mongoose.connection.readyState === 1) { // Only attempt cleanup if connected
        const emailsToClean = [];
        if (registrationUserEmail) {
          emailsToClean.push(registrationUserEmail);
        }
        if (loginTestUser && loginTestUser.email) {
          emailsToClean.push(loginTestUser.email);
        }

        if (emailsToClean.length > 0) {
          console.log(`Attempting to clean up test users: ${emailsToClean.join(', ')}`);
          await User.deleteMany({ email: { $in: emailsToClean } });
          console.log(`Cleaned up test users: ${emailsToClean.join(', ')}`);
        }
      } else {
        console.warn('Skipping user cleanup in auth.test.js afterAll as DB is not connected.');
      }
    } catch (error) {
      console.error('Error cleaning up test users in auth.test.js afterAll:', error);
    } finally {
      // Close the mongoose connection if it's open
      if (mongoose.connection.readyState !== 0) {
        console.log('Disconnecting Mongoose in auth.test.js afterAll...');
        await mongoose.disconnect();
        console.log('Mongoose connection closed in auth.test.js afterAll.');
      } else {
        console.log('Mongoose already disconnected in auth.test.js afterAll.');
      }
    }
  });

  // --- Test Cases ---
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const newUser = {
        firstName: 'Test',
        lastName: 'User',
        email: uniqueEmail,
        password: 'password123',
        role: 'user', // Or 'client', 'member' depending on your roles
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('firstName', newUser.firstName);
      expect(response.body.user).toHaveProperty('lastName', newUser.lastName);
      expect(response.body.user).toHaveProperty('email', newUser.email);
      expect(response.body.user).toHaveProperty('role', newUser.role);
      expect(response.body.user).not.toHaveProperty('password');

      // Store the email for cleanup
      registrationUserEmail = newUser.email;
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: loginTestUserCredentials.email,
          password: loginTestUserCredentials.password,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', loginTestUserCredentials.email);
      expect(response.body.user).toHaveProperty('firstName', loginTestUserCredentials.firstName);
      expect(response.body.user).toHaveProperty('lastName', loginTestUserCredentials.lastName);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 for invalid credentials (wrong password)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: loginTestUserCredentials.email,
          password: 'wrongpassword',
        });

      expect(response.statusCode).toBe(401);
      // Check for a specific error message if your API provides one
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 401 for invalid credentials (non-existent email)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  // --- Test Cases for Authorization ---
  describe('Protected Route Access (GET /api/users)', () => {
    it('should deny access to GET /api/users without a token', async () => {
      const response = await request(app).get('/api/users');
      // Expect 401 Unauthorized or 403 Forbidden, depending on API design
      // Based on typical protect middleware, 401 is common if no token is sent.
      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty(
        'message',
        'You are not logged in! Please log in to get access.' // Common message for missing token
      );
    });

    it('should allow access to GET /api/users with a valid token', async () => {
      // 1. Login to get a token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: loginTestUserCredentials.email,
          password: loginTestUserCredentials.password,
        });

      expect(loginResponse.statusCode).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      const token = loginResponse.body.token;

      // 2. Access the protected route with the token
      const protectedResponse = await request(app)
        .get('/api/users') // Using GET /api/users as identified
        .set('Authorization', `Bearer ${token}`);

      expect(protectedResponse.statusCode).toBe(200);
      // Assuming GET /api/users returns a list of users
      // The response should be an array, and might contain the loginTestUser
      // For a more specific check, you'd need to know the exact response structure
      // and permissions of loginTestUser. If loginTestUser has VIEW_USERS,
      // they should be able to see at least themselves in the list.
      expect(protectedResponse.body).toHaveProperty('status', 'success');
      expect(protectedResponse.body).toHaveProperty('data');
      expect(Array.isArray(protectedResponse.body.data.users)).toBe(true);
      // Optionally, check if the loginTestUser is in the list,
      // if VIEW_USERS allows seeing other users or just oneself.
      // This depends on the controller logic for /api/users.
      const users = protectedResponse.body.data.users;
      const foundUser = users.find(user => user.email === loginTestUserCredentials.email);
      // This assertion might fail if the user role of loginTestUser doesn't have permission to view users,
      // or if the user object in the response doesn't include all fields by default.
      // For this test, we are primarily concerned with the 200 status if token is valid and the user can be found.
      // The `loginTestUser` is created with role 'user'. If 'user' role lacks VIEW_USERS, then `GET /api/users`
      // would return 403. Assuming 'user' can view users for now.
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(loginTestUserCredentials.email);
      // Ensure firstName and lastName are also present, as they are part of the user schema.
      // Depending on the controller for GET /api/users, these fields might be selected or deselected.
      // If these fail, it implies the controller might not be returning these fields or the user is not found as expected.
      expect(foundUser.firstName).toBe(loginTestUserCredentials.firstName);
      expect(foundUser.lastName).toBe(loginTestUserCredentials.lastName);
    });
  });
});
