const User = require('../models/user.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const { getDefaultPermissions } = require('../../common/config/permissions');

// Utility function to filter allowed fields for update
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Get all users (with basic filtering/pagination)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  // Basic filtering (can be expanded)
  const filter = {};
  if (req.query.role) {
    filter.role = req.query.role;
  }

  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;

  const users = await User.find(filter).skip(skip).limit(limit);
  const totalUsers = await User.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: totalUsers,
    data: {
      users
    }
  });
});

// Get a single user by ID
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Create a new user (Admin action)
exports.createUser = catchAsync(async (req, res, next) => {
  // Basic validation (can be expanded with express-validator)
  if (!req.body.firstName || !req.body.lastName || !req.body.email || !req.body.password || !req.body.role) {
    return next(new AppError('Please provide firstName, lastName, email, password, and role.', 400));
  }

  // Add explicit password length check
  if (req.body.password.length < 8) {
    return next(new AppError('Password must be at least 8 characters long.', 400));
  }

  const userRole = req.body.role;
  const defaultPermissions = getDefaultPermissions(userRole);

  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password, // Password hashing is handled by pre-save hook in model
    role: userRole,
    permissions: defaultPermissions,
    // Add other fields as necessary, e.g., createdBy: req.user.id
  });

  // Don't send password back
  newUser.password = undefined;

  res.status(201).json({
    status: 'success',
    data: {
      user: newUser
    }
  });
});

// Update user details (Admin action - restricted fields)
// For self-update, use authController.updateMe or similar
exports.updateUser = catchAsync(async (req, res, next) => {
  // 1) Filter out unwanted fields names that are not allowed to be updated by admin directly
  // Especially password, don't update password with this!
  const filteredBody = filterObj(req.body, 'firstName', 'lastName', 'email', 'role', 'permissions', 'active');

  // If role is updated, update permissions to default for that role (unless permissions are explicitly provided)
  if (filteredBody.role && !filteredBody.permissions) {
      filteredBody.permissions = getDefaultPermissions(filteredBody.role);
  }

  // 2) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true
  });

  if (!updatedUser) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

// Delete user (soft delete - Admin action)
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, { active: false });

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});