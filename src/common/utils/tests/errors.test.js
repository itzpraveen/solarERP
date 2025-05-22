const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ServerError,
} = require('../errors');

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should correctly instantiate with a 4xx status code', () => {
      const message = 'Test 4xx Error';
      const statusCode = 400;
      const error = new AppError(message, statusCode);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(statusCode);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('Error'); // AppError itself doesn't set 'name', so it defaults to 'Error'
    });

    it('should correctly instantiate with a 5xx status code', () => {
      const message = 'Test 5xx Error';
      const statusCode = 500;
      const error = new AppError(message, statusCode);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(statusCode);
      expect(error.status).toBe('error');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('Error'); // AppError itself doesn't set 'name', so it defaults to 'Error'
    });
  });

  describe('ValidationError', () => {
    it('should correctly instantiate with a message and error details', () => {
      const message = 'Validation Failed';
      const errorDetails = [{ field: 'email', message: 'Invalid email format' }];
      const error = new ValidationError(message, errorDetails);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('ValidationError');
      expect(error.errors).toEqual(errorDetails);
    });

    it('should correctly instantiate with only a message (defaulting errors to empty array)', () => {
      const message = 'Simple Validation Failed';
      const error = new ValidationError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
      expect(error.errors).toEqual([]);
    });

     it('should use an empty message if an undefined message is provided', () => {
      const errorDetails = [{ field: 'email', message: 'Invalid email format' }];
      const error = new ValidationError(undefined, errorDetails);
      expect(error.message).toBe(''); // super(undefined) results in an empty message string
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
      expect(error.errors).toEqual(errorDetails);
    });
  });

  describe('AuthenticationError', () => {
    it('should correctly instantiate with a custom message', () => {
      const message = 'Custom Auth Error';
      const error = new AuthenticationError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(401);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AuthenticationError');
    });

    it('should use the default message if none is provided', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('Authentication failed');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthenticationError');
    });
  });

  describe('AuthorizationError', () => {
    it('should correctly instantiate with a custom message', () => {
      const message = 'Custom AuthZ Error';
      const error = new AuthorizationError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(403);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AuthorizationError');
    });

    it('should use the default message if none is provided', () => {
      const error = new AuthorizationError();
      expect(error.message).toBe('You do not have permission to perform this action');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('AuthorizationError');
    });
  });

  describe('NotFoundError', () => {
    it('should correctly instantiate with a custom message', () => {
      const message = 'Custom Not Found Error';
      const error = new NotFoundError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(404);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('NotFoundError');
    });

    it('should use the default message if none is provided', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('ConflictError', () => {
    it('should correctly instantiate with a custom message', () => {
      const message = 'Custom Conflict Error';
      const error = new ConflictError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(409);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('ConflictError');
    });

    it('should use the default message if none is provided', () => {
      const error = new ConflictError();
      expect(error.message).toBe('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });
  });

  describe('ServerError', () => {
    it('should correctly instantiate with a custom message', () => {
      const message = 'Custom Server Error';
      const error = new ServerError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ServerError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(500);
      expect(error.status).toBe('error');
      expect(error.isOperational).toBe(true); // ServerError is operational for our definition
      expect(error.name).toBe('ServerError');
    });

    it('should use the default message if none is provided', () => {
      const error = new ServerError();
      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('ServerError');
    });
  });
});
