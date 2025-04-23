const AppError = require('../../utils/appError');
const { PERMISSIONS } = require('../config/permissions'); // Import permission constants if needed

/**
 * Middleware to check if the logged-in user has the required permission(s).
 * @param {...string} requiredPermissions - One or more permission strings required to access the route.
 */
const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    // Ensure user object exists (should be populated by 'protect' middleware)
    if (!req.user) {
      return next(
        new AppError('Authentication required. User not found on request.', 401)
      );
    }

    // --- Add Logging ---
    console.log(
      `[Authorize] User ID: ${req.user.id}, Email: ${req.user.email}`
    );
    console.log(`[Authorize] User Role: ${req.user.role}`);
    console.log(
      `[Authorize] User Permissions: ${JSON.stringify(req.user.permissions)}`
    );
    console.log(
      `[Authorize] Required Permissions: ${JSON.stringify(requiredPermissions)}`
    );
    // --- End Logging ---

    // Ensure user has a permissions array
    const userPermissions = req.user.permissions || [];

    // Check if user has ALL required permissions
    const hasRequiredPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    // Admins might have all permissions implicitly (optional, adjust as needed)
    if (req.user.role === 'admin') {
      // Check if role is exactly 'admin' (lowercase)
      console.log(
        '[Authorize] Admin user detected, bypassing specific permission check.'
      );
      return next(); // Admins bypass specific permission checks
    }

    if (!hasRequiredPermissions) {
      console.log(
        `Authorization failed for user ${req.user.id} (${req.user.email}). Required: ${requiredPermissions.join(', ')}. Has: ${userPermissions.join(', ')}`
      );
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }

    // User has the required permissions
    return next(); // Added return
  };
};

module.exports = authorize;
