const express = require('express');
const userController = require('../controllers/user.controller');
const authController = require('../controllers/auth.controller');
const authorize = require('../../common/middleware/authorize');
const { PERMISSIONS } = require('../../common/config/permissions');

const router = express.Router();

// All routes below this are protected (require login)
router.use(authController.protect);

// Routes for managing users (typically admin/manager roles)
router
  .route('/')
  .get(authorize(PERMISSIONS.VIEW_USERS), userController.getAllUsers)
  .post(authorize(PERMISSIONS.MANAGE_USERS), userController.createUser); // Only those with MANAGE_USERS can create

router
  .route('/:id')
  .get(authorize(PERMISSIONS.VIEW_USERS), userController.getUser) // Or maybe MANAGE_USERS if viewing specific details is sensitive
  .patch(authorize(PERMISSIONS.MANAGE_USERS), userController.updateUser) // Only MANAGE_USERS can update others
  .delete(authorize(PERMISSIONS.MANAGE_USERS), userController.deleteUser); // Only MANAGE_USERS can delete

// Note: Routes for users managing their own profile (updateMe, deleteMe, getMe)
// are typically handled in auth.routes.js as they don't require special permissions beyond being logged in.

module.exports = router;
