const express = require('express');
const projectController = require('../../controllers/project.controller');
const authController = require('../../controllers/auth.controller');
const { check } = require('express-validator');
const router = express.Router();

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  next();
};

// Protect all routes
router.use(authController.protect);

// Input validation
const validateProject = [
  check('name', 'Project name is required').not().isEmpty(),
  check('customerId', 'Customer ID is required').isUUID(),
  check('systemSize', 'System size is required').isNumeric(),
  check('panelCount', 'Panel count is required').isNumeric(),
  check('panelType', 'Panel type is required').not().isEmpty(),
  check('inverterType', 'Inverter type is required').not().isEmpty(),
  check('installStreet', 'Installation street address is required').not().isEmpty(),
  check('installCity', 'Installation city is required').not().isEmpty(),
  check('installState', 'Installation state is required').not().isEmpty(),
  check('installZipCode', 'Installation ZIP code is required').not().isEmpty(),
  check('totalContractValue', 'Total contract value is required').isNumeric()
];

// Project statistics
router.get('/stats', authController.restrictTo('admin', 'manager'), projectController.getProjectStats);

// Project routes
router.route('/')
  .get(projectController.getAllProjects)
  .post(validateProject, handleValidationErrors, projectController.createProject);

router.route('/:id')
  .get(projectController.getProject)
  .patch(projectController.updateProject)
  .delete(authController.restrictTo('admin', 'manager'), projectController.deleteProject);

// Project status
router.route('/:id/status')
  .patch(
    check('status', 'Valid status is required').isIn(['active', 'on_hold', 'completed', 'cancelled']),
    handleValidationErrors,
    projectController.updateProjectStatus
  );

// Project stage
router.route('/:id/stage')
  .patch(
    check('stage', 'Valid stage is required').isIn(['planning', 'permitting', 'scheduled', 'in_progress', 'inspection', 'completed']),
    handleValidationErrors,
    projectController.updateProjectStage
  );

// Project notes
router.route('/:id/notes')
  .post(
    check('text', 'Note text is required').not().isEmpty(),
    handleValidationErrors,
    projectController.addProjectNote
  );

// Project issues
router.route('/:id/issues')
  .post([
    check('title', 'Issue title is required').not().isEmpty(),
    check('description', 'Issue description is required').not().isEmpty(),
    check('priority', 'Valid priority is required').isIn(['low', 'medium', 'high', 'critical'])
  ], handleValidationErrors, projectController.addProjectIssue);

router.route('/:id/issues/:issueId')
  .patch(projectController.updateProjectIssue);

// Project documents
router.route('/:id/documents')
  .post([
    check('type', 'Document type is required').isIn(['permit', 'contract', 'design', 'inspection', 'utility', 'warranty', 'other']),
    check('name', 'Document name is required').not().isEmpty(),
    check('fileUrl', 'File URL is required').not().isEmpty()
  ], handleValidationErrors, projectController.addProjectDocument);

// Project equipment
router.route('/:id/equipment')
  .post([
    check('type', 'Equipment type is required').isIn(['panel', 'inverter', 'battery', 'optimizers', 'racking', 'monitoring', 'other']),
    check('manufacturer', 'Manufacturer is required').not().isEmpty(),
    check('model', 'Model is required').not().isEmpty(),
    check('quantity', 'Quantity is required').isNumeric()
  ], handleValidationErrors, projectController.addProjectEquipment);

// Project team
router.route('/:id/team')
  .patch(projectController.updateProjectTeam);

// Project expenses
router.route('/:id/expenses')
  .post([
    check('category', 'Valid expense category is required').isIn(['equipment', 'labor', 'permits', 'subcontractor', 'other']),
    check('description', 'Expense description is required').not().isEmpty(),
    check('amount', 'Expense amount is required').isNumeric()
  ], handleValidationErrors, projectController.addProjectExpense);

// Project payments
router.route('/:id/payments')
  .post([
    check('name', 'Payment name is required').not().isEmpty(),
    check('amount', 'Payment amount is required').isNumeric()
  ], handleValidationErrors, projectController.addProjectPayment);

module.exports = router;
