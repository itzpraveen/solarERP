const express = require('express');
const proposalController = require('../controllers/proposal.controller');
const authController = require('../controllers/auth.controller');
const { check } = require('express-validator');
const router = express.Router();

// Public route for tracking proposal views
router.get('/view/:id/track', proposalController.trackProposalView);

// Protect all other routes
router.use(authController.protect);

// Input validation
const validateProposal = [
  check('lead', 'Lead ID is required').isUUID(),
  check('name', 'Proposal name is required').not().isEmpty(),
  check('systemSize', 'System size is required').isNumeric(),
  check('panelCount', 'Panel count is required').isNumeric(),
  check('panelType', 'Panel type is required').not().isEmpty(),
  check('inverterType', 'Inverter type is required').not().isEmpty(),
  check('yearlyProductionEstimate', 'Yearly production estimate is required').isNumeric(),
  check('estimatedSavings.firstYear', 'First year savings estimate is required').isNumeric(),
  check('estimatedSavings.twentyFiveYear', 'Twenty-five year savings estimate is required').isNumeric(),
  check('pricing.grossCost', 'Gross cost is required').isNumeric(),
  check('pricing.federalTaxCredit', 'Federal tax credit amount is required').isNumeric(),
  check('pricing.netCost', 'Net cost is required').isNumeric()
];

// Proposal routes
router.route('/')
  .get(proposalController.getAllProposals)
  .post(validateProposal, proposalController.createProposal);

router.route('/:id')
  .get(proposalController.getProposal)
  .patch(proposalController.updateProposal)
  .delete(authController.restrictTo('admin', 'manager', 'sales'), proposalController.deleteProposal);

// Update proposal status
router.route('/:id/status')
  .patch(
    check('status', 'Valid status is required').isIn([
      'draft',
      'sent',
      'viewed',
      'accepted',
      'rejected',
      'expired'
    ]),
    proposalController.updateProposalStatus
  );

// Send proposal
router.route('/:id/send')
  .post(proposalController.sendProposal);

module.exports = router;
