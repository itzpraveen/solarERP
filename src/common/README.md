# Common Module

This directory contains common utilities, middleware, and configuration that are shared across the application.

## Structure

- **config/**: Configuration settings
- **middleware/**: Express middleware
- **utils/**: Utility functions and classes

## Configuration

The `config` directory contains centralized configuration settings for the application. This helps avoid hardcoded values and makes it easier to manage environment-specific configurations.

### Usage

```javascript
const config = require('../common/config');

// Access configuration values
const port = config.server.port;
const jwtSecret = config.jwt.secret;
```

## Middleware

The `middleware` directory contains Express middleware that can be used across the application.

### Error Handler

The error handler middleware provides a centralized way to handle errors in the application. It formats errors differently based on the environment (development or production).

#### Usage

```javascript
const errorHandler = require('../common/middleware/errorHandler');

// Add to Express app
app.use(errorHandler);
```

## Utilities

The `utils` directory contains utility functions and classes that can be used across the application.

### Error Classes

The error classes provide a consistent way to handle errors in the application. They extend the built-in Error class and add additional properties.

#### Available Error Classes

- `AppError`: Base application error class
- `ValidationError`: For input validation errors
- `AuthenticationError`: For authentication failures
- `AuthorizationError`: For permission issues
- `NotFoundError`: For resources not found
- `ConflictError`: For resource conflicts
- `ServerError`: For internal server errors

#### Usage

```javascript
const { NotFoundError, ValidationError } = require('../common/utils/errors');

// Throw a not found error
throw new NotFoundError('User not found');

// Throw a validation error
throw new ValidationError('Invalid input', errors);
```

### Async Error Handler

The async error handler utility wraps async controller functions to catch errors and pass them to the error handler middleware. This eliminates the need for try-catch blocks in every controller function.

#### Usage

```javascript
const catchAsync = require('../common/utils/catchAsync');

// Wrap an async controller function
const getUsers = catchAsync(async (req, res, next) => {
  const users = await userService.getUsers();
  
  res.status(200).json({
    status: 'success',
    data: {
      users
    }
  });
});
```

## Best Practices

1. **Use the configuration module** for all configuration values instead of hardcoding them or using environment variables directly.

2. **Use the error classes** for consistent error handling across the application.

3. **Use the catchAsync utility** to handle errors in async controller functions.

4. **Add new common utilities** to this directory if they are used across multiple modules.

5. **Document new utilities** in this README file.