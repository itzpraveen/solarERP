const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const serviceRequestController = require('../controllers/serviceRequestController');

// Service Request Routes

// Get all service requests / Create new service request
router.route('/')
  .get(protect, serviceRequestController.getServiceRequests)
  .post(protect, serviceRequestController.createServiceRequest);

// Get/Update/Delete specific service request
router.route('/:id')
  .get(protect, serviceRequestController.getServiceRequest)
  .put(protect, serviceRequestController.updateServiceRequest)
  .delete(protect, serviceRequestController.deleteServiceRequest);

// Add note to service request
router.route('/:id/notes')
  .post(protect, serviceRequestController.addNote);

// Assign technician to service request
router.route('/:id/assign')
  .put(protect, serviceRequestController.assignTechnician);

// Update status of service request
router.route('/:id/status')
  .put(protect, serviceRequestController.updateStatus);

// Schedule service request
router.route('/:id/schedule')
  .put(protect, serviceRequestController.scheduleService);

// Complete service request
router.route('/:id/complete')
  .put(protect, serviceRequestController.completeService);

// Get service requests for a specific customer
router.route('/customer/:customerId')
  .get(protect, serviceRequestController.getCustomerServiceRequests);

// Get service requests for a specific project
router.route('/project/:projectId')
  .get(protect, serviceRequestController.getProjectServiceRequests);

module.exports = router;