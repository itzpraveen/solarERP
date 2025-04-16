const express = require('express');
const { check } = require('express-validator');
const proposalController = require('../controllers/proposal.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();
const cacheMiddleware = require('../../common/middleware/cacheMiddleware');

// Public route for tracking proposal views
router.get('/view/:id/track', proposalController.trackProposalView);

// Protect all other routes
router.use(authController.protect);

// Input validation
const validateProposal = [
  check('lead', 'Lead ID is required').isMongoId(),
  check('name', 'Proposal name is required').not().isEmpty(),
  check('systemSize', 'System size is required').isNumeric(),
  check('panelCount', 'Panel count is required').isNumeric(),
  check('panelType', 'Panel type is required').not().isEmpty(),
  check('inverterType', 'Inverter type is required').not().isEmpty(),
  check(
    'yearlyProductionEstimate',
    'Yearly production estimate is required'
  ).isNumeric(),
  check(
    'estimatedSavings.firstYear',
    'First year savings estimate is required'
  ).isNumeric(),
  check(
    'estimatedSavings.twentyFiveYear',
    'Twenty-five year savings estimate is required'
  ).isNumeric(),
  check('pricing.grossCost', 'Gross cost is required').isNumeric(),
  check(
    'pricing.federalTaxCredit',
    'Federal tax credit amount is required'
  ).isNumeric(),
  check('pricing.netCost', 'Net cost is required').isNumeric(),
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

module.exports = router;
