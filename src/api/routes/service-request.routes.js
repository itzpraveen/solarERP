const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/service-request.controller');
const authController = require('../controllers/auth.controller');

// Protect all routes
router.use(authController.protect);

// Get all service requests & Create new service request
router.route('/')
  .get(authController.restrictTo('admin', 'manager', 'installer'), serviceRequestController.getServiceRequests)
  .post(authController.restrictTo('admin', 'manager', 'installer'), serviceRequestController.createServiceRequest);

// Get, update, delete specific service request by ID
router.route('/:id')
  .get(authController.restrictTo('admin', 'manager', 'installer'), serviceRequestController.getServiceRequest)
  .put(authController.restrictTo('admin', 'manager', 'installer'), serviceRequestController.updateServiceRequest)
  .delete(authController.restrictTo('admin', 'manager'), serviceRequestController.deleteServiceRequest);

// Add note to service request
router.route('/:id/notes')
  .post(authController.restrictTo('admin', 'manager', 'installer'), serviceRequestController.addNote);

// Assign technician to service request
router.route('/:id/assign')
  .put(authController.restrictTo('admin', 'manager'), serviceRequestController.assignTechnician);

// Update status of service request
router.route('/:id/status')
  .put(authController.restrictTo('admin', 'manager', 'installer'), serviceRequestController.updateStatus);

// Schedule service request
router.route('/:id/schedule')
  .put(authController.restrictTo('admin', 'manager'), serviceRequestController.scheduleService);

// Complete service request
router.route('/:id/complete')
  .put(authController.restrictTo('admin', 'manager', 'installer'), serviceRequestController.completeService);

// Get service requests for a specific customer
router.route('/customer/:customerId')
  .get(authController.restrictTo('admin', 'manager', 'installer'), serviceRequestController.getCustomerServiceRequests);

// Get service requests for a specific project
router.route('/project/:projectId')
  .get(authController.restrictTo('admin', 'manager', 'installer'), serviceRequestController.getProjectServiceRequests);

module.exports = router;