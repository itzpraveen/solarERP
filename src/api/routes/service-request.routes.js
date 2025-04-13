const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/service-request.controller');
const authController = require('../controllers/auth.controller');

// Protect all routes
router.use(authController.protect);

// Get all service requests & Create new service request
router.route('/')
  .get(serviceRequestController.getServiceRequests)
  .post(serviceRequestController.createServiceRequest);

// Get, update, delete specific service request by ID
router.route('/:id')
  .get(serviceRequestController.getServiceRequest)
  .put(serviceRequestController.updateServiceRequest)
  .delete(serviceRequestController.deleteServiceRequest);

// Add note to service request
router.route('/:id/notes')
  .post(serviceRequestController.addNote);

// Assign technician to service request
router.route('/:id/assign')
  .put(serviceRequestController.assignTechnician);

// Update status of service request
router.route('/:id/status')
  .put(serviceRequestController.updateStatus);

// Schedule service request
router.route('/:id/schedule')
  .put(serviceRequestController.scheduleService);

// Complete service request
router.route('/:id/complete')
  .put(serviceRequestController.completeService);

// Get service requests for a specific customer
router.route('/customer/:customerId')
  .get(serviceRequestController.getCustomerServiceRequests);

// Get service requests for a specific project
router.route('/project/:projectId')
  .get(serviceRequestController.getProjectServiceRequests);

module.exports = router;