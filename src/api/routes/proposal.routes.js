const express = require('express');
const { check } = require('express-validator');
const proposalController = require('../controllers/proposal.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();
const cacheMiddleware = require('../../common/middleware/cacheMiddleware');
const {
  handleValidationErrors,
} = require('../../common/middleware/errorHandler'); // Assuming you have a handler for validation errors

// Public route for tracking proposal views
router.get('/view/:id/track', proposalController.trackProposalView);

// Protect all other routes
router.use(authController.protect);

// Input validation for Proposal Creation (Updated)
const validateProposal = [
  check('lead', 'Lead ID is required and must be a valid Mongo ID').isMongoId(),
  check('name', 'Proposal name is required').not().isEmpty().trim(),
  check('systemSize', 'System size (kW) is required and must be a number')
    .isNumeric()
    .toFloat(),
  check('panelCount', 'Panel count is required and must be a number')
    .isNumeric()
    .toInt(),
  check(
    'projectCostExcludingStructure',
    'Project cost (excluding structure) is required and must be a number'
  )
    .isNumeric()
    .toFloat(),
  check('subsidyAmount', 'Subsidy amount is required and must be a number')
    .isNumeric()
    .toFloat(),
  check('currency', 'Currency code is required')
    .optional()
    .not()
    .isEmpty()
    .trim(),
  check('structureCost', 'Structure cost must be a non-negative number')
    .optional({ checkFalsy: true }) // Treat '', 0, false, null, undefined as absent
    .isNumeric()
    .withMessage('Structure cost must be numeric if provided')
    .toFloat({ min: 0.0 })
    .withMessage('Structure cost cannot be negative'),
  check('additionalCosts', 'Additional costs must be a non-negative number')
    .optional({ checkFalsy: true }) // Treat '', 0, false, null, undefined as absent
    .isNumeric()
    .withMessage('Additional costs must be numeric if provided')
    .toFloat({ min: 0.0 })
    .withMessage('Additional costs cannot be negative'),
  check('notes', 'Notes must be a string').optional().isString().trim(),
  check('equipment', 'Equipment list cannot be empty') // Changed message slightly
    .isArray({ min: 1 })
    .withMessage('At least one equipment item is required.'),
  // Validate each item within the equipment array
  check(
    'equipment.*.item',
    'Each equipment item must have a valid Item ID selected.'
  )
    .notEmpty() // Ensure it's not an empty string before checking if it's a MongoId
    .isMongoId()
    .withMessage('Invalid Item ID format for equipment.'),
  check(
    'equipment.*.quantity',
    'Quantity for each equipment item must be a positive whole number.'
  )
    .isInt({ min: 1 }) // Use isInt directly for positive integers
    .toInt(), // Convert to integer
  check(
    'equipment.*.unitPrice',
    'Unit price for equipment must be a non-negative number.'
  )
    .optional({ checkFalsy: true }) // Allow 0, null, undefined, ''
    .isNumeric()
    .withMessage('Equipment unit price must be numeric if provided.')
    .toFloat({ min: 0.0 })
    .withMessage('Equipment unit price cannot be negative.'),
  // Optional validation for financing options array
  check('financingOptions', 'Financing options must be an array')
    .optional()
    .isArray(),
  check('financingOptions.*.type', 'Financing option type is required')
    .optional() // Only validate if financingOptions array exists
    .isIn(['cash', 'loan', 'lease', 'ppa'])
    .withMessage('Invalid financing option type'),
  check('financingOptions.*.provider', 'Financing provider must be a string')
    .optional({ checkFalsy: true })
    .isString(),
  check('financingOptions.*.termYears', 'Financing term must be a number')
    .optional({ checkFalsy: true })
    .isNumeric(),
  check(
    'financingOptions.*.interestRate',
    'Financing interest rate must be a number'
  )
    .optional({ checkFalsy: true })
    .isNumeric(),
  check(
    'financingOptions.*.downPayment',
    'Financing down payment must be a number'
  )
    .optional({ checkFalsy: true })
    .isNumeric(),
  check(
    'financingOptions.*.monthlyPayment',
    'Financing monthly payment must be a number'
  )
    .optional({ checkFalsy: true })
    .isNumeric(),
  check('financingOptions.*.notes', 'Financing notes must be a string')
    .optional({ checkFalsy: true })
    .isString(),
  // Optional validation for energy meter
  check('energyMeter', 'Energy meter details must be a string')
    .optional({ checkFalsy: true })
    .isString()
    .trim(),
  // Add handleValidationErrors middleware after the checks
  handleValidationErrors, // Make sure this middleware exists and handles errors properly
];

// Proposal routes
router
  .route('/')
  .get(
    cacheMiddleware,
    authController.restrictTo('admin', 'manager', 'sales'),
    proposalController.getAllProposals
  )
  .post(
    authController.restrictTo('admin', 'manager', 'sales'),
    validateProposal,
    proposalController.createProposal
  );

router
  .route('/:id')
  .get(
    authController.restrictTo('admin', 'manager', 'sales'),
    proposalController.getProposal
  )
  .put(
    authController.restrictTo('admin', 'manager', 'sales'),
    proposalController.updateProposal
  ) // Changed from PATCH to PUT
  .delete(
    authController.restrictTo('admin', 'manager', 'sales'),
    proposalController.deleteProposal
  );

// Update proposal status
router
  .route('/:id/status')
  .patch(
    check('status', 'Valid status is required').isIn([
      'draft',
      'sent',
      'viewed',
      'accepted',
      'rejected',
      'expired',
    ]),
    authController.restrictTo('admin', 'manager', 'sales'),
    proposalController.updateProposalStatus
  );

// Send proposal
router
  .route('/:id/send')
  .post(
    authController.restrictTo('admin', 'manager', 'sales'),
    proposalController.sendProposal
  );

// Download proposal PDF
router.route('/:id/download').get(
  authController.restrictTo('admin', 'manager', 'sales'), // Or adjust permissions as needed
  proposalController.downloadProposalPdf
);

module.exports = router;
