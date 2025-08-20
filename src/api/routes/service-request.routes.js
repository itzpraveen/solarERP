const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const serviceRequestController = require('../../controllers/service-request.controller');
const authController = require('../../controllers/auth.controller');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  next();
};

// Validators
const validateCreate = [
  check('title', 'Title is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('requestType', 'Request type is required').isIn(['maintenance', 'repair', 'installation', 'inspection', 'other']),
  check('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  check('customerId', 'Valid customerId is required').isUUID(),
  check('projectId').optional().isUUID(),
  check('assignedToId').optional().isUUID(),
  check('scheduledDate').optional().isISO8601()
];
const validateNote = [ check('text', 'Note text is required').not().isEmpty() ];
const validateAssign = [ check('assignedToId', 'assignedToId is required').isUUID() ];
const validateStatus = [ check('status', 'Valid status is required').isIn(['new','assigned','in_progress','on_hold','completed','cancelled']) ];
const validateSchedule = [ check('scheduledDate', 'Valid scheduledDate is required').isISO8601() ];

// Protect all routes
router.use(authController.protect);

// Get all service requests & Create new service request
router.route('/')
  .get(serviceRequestController.getServiceRequests)
  .post(validateCreate, handleValidationErrors, serviceRequestController.createServiceRequest);

// Get, update, delete specific service request by ID
router.route('/:id')
  .get(serviceRequestController.getServiceRequest)
  .put(serviceRequestController.updateServiceRequest)
  .delete(serviceRequestController.deleteServiceRequest);

// Add note to service request
router.route('/:id/notes')
  .post(validateNote, handleValidationErrors, serviceRequestController.addNote);

// Assign technician to service request
router.route('/:id/assign')
  .put(validateAssign, handleValidationErrors, serviceRequestController.assignTechnician);

// Update status of service request
router.route('/:id/status')
  .put(validateStatus, handleValidationErrors, serviceRequestController.updateStatus);

// Schedule service request
router.route('/:id/schedule')
  .put(validateSchedule, handleValidationErrors, serviceRequestController.scheduleService);

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
