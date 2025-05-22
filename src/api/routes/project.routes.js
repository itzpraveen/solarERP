const express = require('express');
const { check } = require('express-validator');
const projectController = require('../controllers/project.controller');
const taskController = require('../controllers/task.controller'); // Assuming tasks have their own controller logic
const authController = require('../controllers/auth.controller');

const router = express.Router();

// Protect all routes
router.use(authController.protect);

// Input validation
const validateProject = [
  check('name', 'Project name is required').not().isEmpty(),
  check('customer', 'Customer ID is required').isMongoId(),
  check('systemSize', 'System size is required').isNumeric(),
  check('panelCount', 'Panel count is required').isNumeric(),
  check('panelType', 'Panel type is required').not().isEmpty(),
  check('inverterType', 'Inverter type is required').not().isEmpty(),
  check('installAddress.street', 'Installation street address is required')
    .not()
    .isEmpty(),
  check('installAddress.city', 'Installation city is required').not().isEmpty(),
  check('installAddress.state', 'Installation state is required')
    .not()
    .isEmpty(),
  check('installAddress.zipCode', 'Installation ZIP code is required')
    .not()
    .isEmpty(),
  check(
    'financials.totalContractValue',
    'Total contract value is required'
  ).isNumeric(),
];

// Project statistics
router.get(
  '/stats',
  authController.restrictTo('admin', 'manager'),
  projectController.getProjectStats
);

// Project routes
router
  .route('/')
  .get(
    authController.restrictTo('admin', 'manager', 'sales', 'installer'),
    projectController.getAllProjects
  )
  .post(
    authController.restrictTo('admin', 'manager', 'sales'),
    validateProject,
    projectController.createProject
  );

router
  .route('/:id')
  .get(
    authController.restrictTo('admin', 'manager', 'sales', 'installer'),
    projectController.getProject
  )
  .patch(
    authController.restrictTo('admin', 'manager'),
    projectController.updateProject
  )
  .delete(
    authController.restrictTo('admin', 'manager'),
    projectController.deleteProject
  );

// Project status
router
  .route('/:id/status')
  .patch(
    check('status', 'Valid status is required').isIn([
      'active',
      'on_hold',
      'completed',
      'cancelled',
    ]),
    authController.restrictTo('admin', 'manager'),
    projectController.updateProjectStatus
  );

// Project stage
router
  .route('/:id/stage')
  .patch(
    check('stage', 'Valid stage is required').isIn([
      'planning',
      'permitting',
      'scheduled',
      'in_progress',
      'inspection',
      'completed',
    ]),
    authController.restrictTo('admin', 'manager'),
    projectController.updateProjectStage
  );

// Project notes
router
  .route('/:id/notes')
  .post(
    check('text', 'Note text is required').not().isEmpty(),
    authController.restrictTo('admin', 'manager', 'sales', 'installer'),
    projectController.addProjectNote
  );

// Project issues
router
  .route('/:id/issues')
  .post(
    [
      check('title', 'Issue title is required').not().isEmpty(),
      check('description', 'Issue description is required').not().isEmpty(),
      check('priority', 'Valid priority is required').isIn([
        'low',
        'medium',
        'high',
        'critical',
      ]),
    ],
    authController.restrictTo('admin', 'manager', 'sales', 'installer'),
    projectController.addProjectIssue
  );

router
  .route('/:id/issues/:issueId')
  .patch(
    authController.restrictTo('admin', 'manager', 'sales', 'installer'),
    projectController.updateProjectIssue
  );

// Project documents
router
  .route('/:id/documents')
  .post(
    [
      check('type', 'Document type is required').isIn([
        'permit',
        'contract',
        'design',
        'inspection',
        'utility',
        'warranty',
        'other',
      ]),
      check('name', 'Document name is required').not().isEmpty(),
      check('fileUrl', 'File URL is required').not().isEmpty(),
    ],
    authController.restrictTo('admin', 'manager', 'sales'),
    projectController.addProjectDocument
  );

// Project equipment
router
  .route('/:id/equipment')
  .post(
    [
      check('type', 'Equipment type is required').isIn([
        'panel',
        'inverter',
        'battery',
        'optimizers',
        'racking',
        'monitoring',
        'other',
      ]),
      check('manufacturer', 'Manufacturer is required').not().isEmpty(),
      check('model', 'Model is required').not().isEmpty(),
      check('quantity', 'Quantity is required').isNumeric(),
    ],
    authController.restrictTo('admin', 'manager', 'installer'),
    projectController.addProjectEquipment
  );

// Project team
router
  .route('/:id/team')
  .patch(
    authController.restrictTo('admin', 'manager'),
    projectController.updateProjectTeam
  );

// Project expenses
router
  .route('/:id/expenses')
  .post(
    [
      check('category', 'Valid expense category is required').isIn([
        'equipment',
        'labor',
        'permits',
        'subcontractor',
        'other',
      ]),
      check('description', 'Expense description is required').not().isEmpty(),
      check('amount', 'Expense amount is required').isNumeric(),
    ],
    authController.restrictTo('admin', 'manager', 'finance'),
    projectController.addProjectExpense
  );

// --- DEBUGGING LOGS for /:id/payments route ---
console.log('--- Debugging project.routes.js for /:id/payments ---');
console.log('Type of projectController:', typeof projectController);
if (projectController) {
  console.log(
    'Type of projectController.addProjectPayment:',
    typeof projectController.addProjectPayment
  );
}
console.log('Type of authController:', typeof authController);
if (authController) {
  console.log(
    'Type of authController.restrictTo:',
    typeof authController.restrictTo
  );
  if (typeof authController.restrictTo === 'function') {
    console.log(
      'Type of authController.restrictTo() result:',
      typeof authController.restrictTo('admin', 'manager', 'finance')
    );
  }
}
console.log('Type of express-validator check:', typeof check);
console.log('--- End Debugging project.routes.js for /:id/payments ---');
// --- END DEBUGGING LOGS ---

// Project payments
router
  .route('/:id/payments')
  .post(
    [
      check('name', 'Payment name is required').not().isEmpty(),
      check('amount', 'Payment amount is required').isNumeric(),
    ],
    authController.restrictTo('admin', 'manager', 'finance'),
    projectController.addProjectPayment
  );

// --- Project Tasks ---

// Validation middleware for tasks
const validateTask = [
  check('description', 'Task description must be a string if provided')
    .optional()
    .isString(), // Make optional for updates
  check('status', 'Invalid status')
    .optional()
    .isIn(['todo', 'in_progress', 'done', 'blocked']),
  check('assignedTo', 'Invalid user ID for assignee').optional().isMongoId(),
  check('dueDate', 'Invalid due date').optional().isISO8601().toDate(),
];

// Add a task to a project
router.route('/:id/tasks').post(
  authController.restrictTo('admin', 'manager', 'installer'),
  validateTask, // Apply validation for required fields on creation
  projectController.addTask // Controller function to be created
);

// Update or delete a specific task within a project
router
  .route('/:id/tasks/:taskId')
  .patch(
    authController.restrictTo('admin', 'manager', 'installer'),
    validateTask, // Apply validation for optional fields on update
    projectController.updateTask // Controller function to be created
  )
  .delete(
    authController.restrictTo('admin', 'manager', 'installer'),
    projectController.deleteTask // Controller function to be created
  );

module.exports = router;
