const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/user.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const sendEmail = require('../../utils/email');
const crypto = require('crypto');

// Create JWT token
const signToken = id => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be defined and at least 32 characters long. Please check your environment variables.');
  }
  
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: jwtExpiresIn,
    issuer: 'solarerp',
    audience: 'solarerp-client'
  });
};

// Send token to client
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // Remove password from output
  user.password = undefined;
  
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// Register new user
exports.signup = catchAsync(async (req, res, next) => {
  // Validate required fields
  const { firstName, lastName, email, password } = req.body;
  
  if (!firstName || !lastName || !email || !password) {
    return next(new AppError('Please provide all required fields', 400));
  }
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 409));
  }
  
  // Create new user (role is always 'user' for signup)
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: 'user' // Never allow role to be set during signup
  });
  
  // Send welcome email (optional - uncomment if email service is configured)
  // try {
  //   await sendEmail({
  //     email: newUser.email,
  //     subject: 'Welcome to SolarERP',
  //     message: `Welcome ${newUser.firstName}! Your account has been created successfully.`
  //   });
  // } catch (err) {
  //   console.error('Failed to send welcome email:', err);
  // }
  
  createSendToken(newUser, 201, res);
});

// Login user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  
  // 2) Check if user exists
  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
  
  if (!user) {
    return next(new AppError('Incorrect email or password', 401));
  }
  
  // 3) Check if account is locked
  if (user.isLocked) {
    return next(new AppError('Account is locked due to too many failed login attempts. Please try again later.', 423));
  }
  
  // 4) Check if password is correct
  const isPasswordCorrect = await user.correctPassword(password, user.password);
  
  if (!isPasswordCorrect) {
    await user.incLoginAttempts();
    return next(new AppError('Incorrect email or password', 401));
  }
  
  // 5) Reset login attempts and update last login
  await user.resetLoginAttempts();
  
  // 6) If everything ok, send token to client
  createSendToken(user, 200, res);
});

// Protect routes
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  
  // 2) Verification token
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return next(new AppError('Server configuration error. Please contact administrator.', 500));
  }
  
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, jwtSecret, {
      issuer: 'solarerp',
      audience: 'solarerp-client'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    return next(new AppError('Token verification failed.', 401));
  }
  
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }
  
  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }
  
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

// Restrict to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'manager']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    
    next();
  };
};

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }
  
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  
  // 3) Send it to user's email
  const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
  const resetURL = `${clientUrl}/reset-password/${resetToken}`;
  
  const message = `Hi ${user.firstName},\\n\\nYou requested a password reset for your SolarERP account.\\n\\nPlease click the following link to reset your password:\\n${resetURL}\\n\\nThis link will expire in 10 minutes.\\n\\nIf you didn't request this password reset, please ignore this email and your password will remain unchanged.\\n\\nBest regards,\\nSolarERP Team`;
  
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  
  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  
  // 3) Update changedPasswordAt property for the user
  // This is done in the model with a pre save middleware
  
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

// Update password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  
  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  
  // 3) If so, update password
  user.password = req.body.newPassword;
  await user.save();
  
  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

// Get current user
exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: req.user
  });
});

// Create demo user (only for development)
exports.createDemoUser = catchAsync(async (req, res, next) => {
  // This endpoint should only be available in development
  if (process.env.NODE_ENV === 'production') {
    return next(new AppError('This endpoint is not available in production', 403));
  }
  
  // Additional security: require a secret key
  const demoKey = req.headers['x-demo-key'];
  if (demoKey !== process.env.DEMO_KEY) {
    return next(new AppError('Invalid demo key', 403));
  }
  
  // Check if demo user already exists
  const existingUser = await User.findOne({ email: 'demo@example.com' });
  
  if (existingUser) {
    return res.status(200).json({
      status: 'success',
      message: 'Demo user already exists'
    });
  }
  
  // Generate a random password for demo user
  const demoPassword = crypto.randomBytes(16).toString('hex');
  
  // Create a new demo user
  const demoUser = await User.create({
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@example.com',
    password: demoPassword,
    role: 'user' // Demo user should have limited permissions
  });
  
  res.status(201).json({
    status: 'success',
    message: 'Demo user created successfully',
    data: {
      email: 'demo@example.com',
      password: demoPassword,
      note: 'Please save this password as it will not be shown again'
    }
  });
});