const request = require('supertest');
const app = require('../server');
const db = require('../models');
const jwt = require('jsonwebtoken');

describe('Authentication Tests', () => {
  let server;
  let authToken;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(0); // Random port
  });

  afterAll(async () => {
    await server.close();
    await db.sequelize.close();
  });

  describe('POST /api/auth/signup', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'newuser@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.user.password).toBeUndefined(); // Password should not be returned
    });

    test('should not register user with existing email', async () => {
      const userData = {
        firstName: 'Duplicate',
        lastName: 'User',
        email: 'newuser@example.com',
        password: 'AnotherPass123!'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    test('should validate password requirements', async () => {
      const userData = {
        firstName: 'Weak',
        lastName: 'Password',
        email: 'weak@example.com',
        password: 'weak' // Too short
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should validate required fields', async () => {
      const userData = {
        email: 'incomplete@example.com',
        password: 'ValidPass123!'
        // Missing firstName and lastName
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a test user for login tests
      await db.User.create({
        firstName: 'Login',
        lastName: 'Test',
        email: 'login@example.com',
        password: 'LoginPass123!',
        isVerified: true
      });
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'LoginPass123!'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      
      authToken = response.body.token; // Save for protected route tests
      
      // Verify token is valid
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'test-secret');
      expect(decoded.id).toBeDefined();
      expect(decoded.iss).toBe('solarerp');
      expect(decoded.aud).toBe('solarerp-client');
    });

    test('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.message).toContain('Incorrect');
    });

    test('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePass123!'
        })
        .expect(401);

      expect(response.body.message).toContain('Incorrect');
    });

    test('should track failed login attempts', async () => {
      // Make multiple failed login attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'login@example.com',
            password: 'WrongPassword!'
          })
          .expect(401);
      }

      // Check that login attempts are being tracked
      const user = await db.User.findOne({ 
        where: { email: 'login@example.com' }
      });
      
      expect(user.loginAttempts).toBeGreaterThan(0);
    });
  });

  describe('Protected Routes', () => {
    test('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.email).toBe('login@example.com');
    });

    test('should not access protected route without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.message).toContain('not logged in');
    });

    test('should not access protected route with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.message).toContain('Invalid token');
    });

    test('should not access protected route with expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: 'test-id' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h', issuer: 'solarerp', audience: 'solarerp-client' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toContain('expired');
    });
  });

  describe('Password Reset', () => {
    test('should request password reset for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgotPassword')
        .send({ email: 'login@example.com' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('sent to email');
    });

    test('should not reveal if email does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/forgotPassword')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('reset link');
    });
  });

  describe('Password Update', () => {
    test('should update password when authenticated', async () => {
      const response = await request(app)
        .patch('/api/auth/updatePassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'LoginPass123!',
          newPassword: 'NewSecurePass456!'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'NewSecurePass456!'
        })
        .expect(200);

      expect(loginResponse.body.status).toBe('success');
    });

    test('should not update password with wrong current password', async () => {
      const response = await request(app)
        .patch('/api/auth/updatePassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongCurrentPass!',
          newPassword: 'NewPass123!'
        })
        .expect(401);

      expect(response.body.message).toContain('wrong');
    });

    test('should validate new password requirements', async () => {
      const response = await request(app)
        .patch('/api/auth/updatePassword')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'NewSecurePass456!',
          newPassword: 'weak'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    test('should rate limit authentication endpoints', async () => {
      // Make multiple rapid requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: `test${i}@example.com`,
              password: 'TestPass123!'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});
