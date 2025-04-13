# Auth Module

This module handles all authentication-related functionality in the Solar ERP system.

## Architecture

The auth module follows a clean architecture pattern with the following components:

1. **Controller** (`auth.controller.js`): Handles HTTP requests and responses
2. **Service** (`auth.service.js`): Contains business logic
3. **Repository** (`auth.repository.js`): Abstracts database operations
4. **Routes** (`auth.routes.js`): Defines API endpoints
5. **Validation** (`auth.validation.js`): Validates input data

## Features

- User registration
- User login
- Password reset
- JWT authentication
- Role-based access control
- Demo user creation (for development)

## API Endpoints

| Method | Endpoint                    | Description                | Access      |
|--------|----------------------------|----------------------------|-------------|
| POST   | `/api/auth/signup`         | Register a new user        | Public      |
| POST   | `/api/auth/login`          | Login user                 | Public      |
| POST   | `/api/auth/forgotPassword` | Request password reset     | Public      |
| PATCH  | `/api/auth/resetPassword/:token` | Reset password       | Public      |
| POST   | `/api/auth/demo`           | Create demo user           | Public      |
| GET    | `/api/auth/me`             | Get current user           | Private     |
| PATCH  | `/api/auth/updatePassword` | Update password            | Private     |

## Usage

### Controller

The controller handles HTTP requests and responses. It uses the service layer for business logic.

```javascript
// Example: Login controller
login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Login user using auth service
  const { user, token } = await authService.login(email, password);
  
  // Send response
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
});
```

### Service

The service layer contains business logic. It uses the repository layer for database operations.

```javascript
// Example: Login service
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
```

### Repository

The repository layer abstracts database operations.

```javascript
// Example: Find user by email
async findUserByEmail(email) {
  return User.findOne({ email }).select('+password');
}
```

### Validation

The validation layer validates input data.

```javascript
// Example: Login validation
login: [
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  check('password')
    .notEmpty()
    .withMessage('Password is required')
]
```

## Error Handling

The module uses custom error classes for consistent error handling:

- `ValidationError`: For input validation errors
- `AuthenticationError`: For authentication failures
- `NotFoundError`: For resources not found
- `AuthorizationError`: For permission issues

## Dependencies

- `jsonwebtoken`: For JWT generation and verification
- `bcryptjs`: For password hashing
- `express-validator`: For input validation
- `crypto`: For token generation