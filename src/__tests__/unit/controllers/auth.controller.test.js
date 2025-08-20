'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authController = require('../../../controllers/auth.controller');
const db = require('../../../models');
const AppError = require('../../../utils/appError');
const catchAsync = require('../../../utils/catchAsync');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcrypt');
jest.mock('../../../models');
jest.mock('../../../utils/logger');

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      headers: {},
      user: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };

    next = jest.fn();
  });

  describe('signup', () => {
    it('should create a new user and return token', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        passwordConfirm: 'Password123!'
      };

      req.body = userData;

      const mockUser = {
        id: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'user',
        toJSON: function() {
          const obj = { ...this };
          delete obj.password;
          return obj;
        }
      };

      // Mock database calls
      db.User = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockUser)
      };

      // Mock bcrypt
      bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword');

      // Mock JWT
      jwt.sign = jest.fn().mockReturnValue('test-token');

      await authController.signup(req, res, next);

      expect(db.User.findOne).toHaveBeenCalledWith({
        where: { email: userData.email }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(db.User.create).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        token: 'test-token',
        data: { user: expect.any(Object) }
      });
    });

    it('should return error if email already exists', async () => {
      req.body = {
        email: 'existing@example.com',
        password: 'Password123!'
      };

      db.User = {
        findOne: jest.fn().mockResolvedValue({ id: 'existing-user' })
      };

      await authController.signup(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Email already registered');
      expect(error.statusCode).toBe(400);
    });

    it('should return error if passwords do not match', async () => {
      req.body = {
        email: 'john@example.com',
        password: 'Password123!',
        passwordConfirm: 'DifferentPassword'
      };

      await authController.signup(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Passwords do not match');
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      req.body = {
        email: 'john@example.com',
        password: 'Password123!'
      };

      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        password: 'hashedPassword',
        isActive: true,
        toJSON: function() {
          const obj = { ...this };
          delete obj.password;
          return obj;
        }
      };

      db.User = {
        findOne: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn()
      };

      bcrypt.compare = jest.fn().mockResolvedValue(true);
      jwt.sign = jest.fn().mockReturnValue('test-token');

      await authController.login(req, res, next);

      expect(db.User.findOne).toHaveBeenCalledWith({
        where: { email: req.body.email }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(req.body.password, mockUser.password);
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        token: 'test-token',
        data: { user: expect.any(Object) }
      });
    });

    it('should return error for invalid credentials', async () => {
      req.body = {
        email: 'john@example.com',
        password: 'WrongPassword'
      };

      const mockUser = {
        id: 'user-123',
        password: 'hashedPassword'
      };

      db.User = {
        findOne: jest.fn().mockResolvedValue(mockUser)
      };

      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Incorrect email or password');
      expect(error.statusCode).toBe(401);
    });

    it('should return error if user does not exist', async () => {
      req.body = {
        email: 'nonexistent@example.com',
        password: 'Password123!'
      };

      db.User = {
        findOne: jest.fn().mockResolvedValue(null)
      };

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Incorrect email or password');
    });

    it('should return error if user is inactive', async () => {
      req.body = {
        email: 'john@example.com',
        password: 'Password123!'
      };

      const mockUser = {
        id: 'user-123',
        password: 'hashedPassword',
        isActive: false
      };

      db.User = {
        findOne: jest.fn().mockResolvedValue(mockUser)
      };

      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Your account has been deactivated');
    });
  });

  describe('protect', () => {
    it('should allow access with valid token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        isActive: true
      };

      req.headers.authorization = 'Bearer valid-token';

      jwt.verify = jest.fn().mockReturnValue({ id: 'user-123', iat: Date.now() / 1000 });
      
      db.User = {
        findByPk: jest.fn().mockResolvedValue(mockUser)
      };

      await authController.protect(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(db.User.findByPk).toHaveBeenCalledWith('user-123');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });

    it('should return error if no token provided', async () => {
      await authController.protect(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('You are not logged in! Please log in to get access.');
      expect(error.statusCode).toBe(401);
    });

    it('should return error for invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authController.protect(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Invalid token');
    });

    it('should return error if user no longer exists', async () => {
      req.headers.authorization = 'Bearer valid-token';

      jwt.verify = jest.fn().mockReturnValue({ id: 'deleted-user', iat: Date.now() / 1000 });
      
      db.User = {
        findByPk: jest.fn().mockResolvedValue(null)
      };

      await authController.protect(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('The user belonging to this token does no longer exist.');
    });
  });

  describe('restrictTo', () => {
    it('should allow access for authorized roles', () => {
      req.user = { role: 'admin' };

      const middleware = authController.restrictTo('admin', 'manager');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access for unauthorized roles', () => {
      req.user = { role: 'user' };

      const middleware = authController.restrictTo('admin', 'manager');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('You do not have permission to perform this action');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('forgotPassword', () => {
    it('should send reset token for valid email', async () => {
      req.body = { email: 'john@example.com' };

      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        createPasswordResetToken: jest.fn().mockReturnValue('reset-token-123'),
        save: jest.fn().mockResolvedValue(true)
      };

      db.User = {
        findOne: jest.fn().mockResolvedValue(mockUser)
      };

      // Mock email sending (would need to be implemented)
      await authController.forgotPassword(req, res, next);

      expect(db.User.findOne).toHaveBeenCalledWith({
        where: { email: req.body.email }
      });
      expect(mockUser.createPasswordResetToken).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Token sent to email!'
      });
    });

    it('should return error for non-existent email', async () => {
      req.body = { email: 'nonexistent@example.com' };

      db.User = {
        findOne: jest.fn().mockResolvedValue(null)
      };

      await authController.forgotPassword(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('There is no user with that email address.');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('updatePassword', () => {
    it('should update password for authenticated user', async () => {
      const mockUser = {
        id: 'user-123',
        password: 'oldHashedPassword',
        save: jest.fn().mockResolvedValue(true)
      };

      req.user = mockUser;
      req.body = {
        passwordCurrent: 'OldPassword123!',
        password: 'NewPassword123!',
        passwordConfirm: 'NewPassword123!'
      };

      bcrypt.compare = jest.fn().mockResolvedValue(true);
      bcrypt.hash = jest.fn().mockResolvedValue('newHashedPassword');
      jwt.sign = jest.fn().mockReturnValue('new-token');

      await authController.updatePassword(req, res, next);

      expect(bcrypt.compare).toHaveBeenCalledWith(req.body.passwordCurrent, mockUser.password);
      expect(bcrypt.hash).toHaveBeenCalledWith(req.body.password, 12);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        token: 'new-token',
        data: { user: mockUser }
      });
    });

    it('should return error for incorrect current password', async () => {
      const mockUser = {
        id: 'user-123',
        password: 'hashedPassword'
      };

      req.user = mockUser;
      req.body = {
        passwordCurrent: 'WrongPassword',
        password: 'NewPassword123!',
        passwordConfirm: 'NewPassword123!'
      };

      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await authController.updatePassword(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Your current password is incorrect');
      expect(error.statusCode).toBe(401);
    });
  });
});