const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/user.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const sendEmail = require('../../utils/email');
const crypto = require('crypto');
const { getDefaultPermissions } = require('../../common/config/permissions');

// Create JWT token
const signToken = id => {
  // Fallback JWT secret in case environment variable is not set
  const jwtSecret = process.env.JWT_SECRET || '692cb33671b08ed48e58c5a70696b5cdc3038b8b919af6a83792541b1c507203df53c7ba89b3e3f5f13ae695a3a7ed608ea49a2cc111cef99d6120867553276d';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined. Please check your environment variables.');
  }
  
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: jwtExpiresIn
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
  const userRole = req.body.role || 'user';
  const defaultPermissions = getDefaultPermissions(userRole);

  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    role: userRole,
    permissions: defaultPermissions, // Assign default permissions
  });
  
  createSendToken(newUser, 201, res);
});

// Login user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  
  // 3) If everything ok, send token to client
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
  const jwtSecret = process.env.JWT_SECRET || '692cb33671b08ed48e58c5a70696b5cdc3038b8b919af6a83792541b1c507203df53c7ba89b3e3f5f13ae695a3a7ed608ea49a2cc111cef99d6120867553276d';
  const decoded = await promisify(jwt.verify)(token, jwtSecret);
  
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
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/auth/resetPassword/${resetToken}`;
  
  const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}.\\nIf you didn't forget your password, please ignore this email!`;
  
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
  // Check if demo user already exists
  const existingUser = await User.findOne({ email: 'demo@example.com' });
  
  if (existingUser) {
    return res.status(200).json({
      status: 'success',
      message: 'Demo user already exists',
      data: {
        email: 'demo@example.com',
        password: 'password123'
      }
    });
  }
  
  // Get default permissions for admin role
  const adminPermissions = getDefaultPermissions('admin');

  // Create a new demo user with permissions
  const demoUser = await User.create({
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@example.com',
    password: 'password123',
    role: 'admin',
    permissions: adminPermissions // Assign default admin permissions
  });
  
  res.status(201).json({
    status: 'success',
    message: 'Demo user created successfully',
    data: {
      email: 'demo@example.com',
      password: 'password123'
    }
  });
});