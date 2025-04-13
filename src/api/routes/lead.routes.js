const express = require('express');
const leadController = require('../controllers/lead.controller');
const authController = require('../controllers/auth.controller');
const { check } = require('express-validator');
const router = express.Router();

// Protect all routes
router.use(authController.protect);

// Input validation
const validateLead = [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('phone', 'Phone number is required').not().isEmpty(),
  check('address.street', 'Street address is required').not().isEmpty(),
  check('address.city', 'City is required').not().isEmpty(),
  check('address.state', 'State is required').not().isEmpty(),
  check('address.zipCode', 'ZIP code is required').not().isEmpty(),
  check('source', 'Lead source is required').isIn([
    'website',
    'referral',
    'partner',
    'cold_call',
    'event',
    'social_media',
    'other'
  ])
];

// Lead statistics
router.get('/stats', authController.restrictTo('admin', 'manager'), leadController.getLeadStats);

// Lead routes
router.route('/')
  .get(authController.restrictTo('admin', 'manager', 'sales'), leadController.getAllLeads)
  .post(authController.restrictTo('admin', 'manager', 'sales'), validateLead, leadController.createLead);

router.route('/:id')
  .get(authController.restrictTo('admin', 'manager', 'sales'), leadController.getLead)
  .patch(authController.restrictTo('admin', 'manager', 'sales'), leadController.updateLead)
  .delete(authController.restrictTo('admin', 'manager'), leadController.deleteLead);

// Lead notes
router.route('/:id/notes')
  .post(authController.restrictTo('admin', 'manager', 'sales'), check('text', 'Note text is required').not().isEmpty(), leadController.addLeadNote);

// Lead interactions
router.route('/:id/interactions')
  .post(
    [
      check('type', 'Interaction type is required').isIn([
        'email',
        'phone',
        'meeting',
        'site_visit',
        'proposal',
        'follow_up',
        'other'
      ]),
      check('summary', 'Interaction summary is required').not().isEmpty()
    ],
    authController.restrictTo('admin', 'manager', 'sales'),
    leadController.addLeadInteraction
  );

// Lead assignment
router.route('/:id/assign')
  .patch(
    check('userId', 'User ID is required').isMongoId(),
    authController.restrictTo('admin', 'manager'),
    leadController.assignLead
  );

// Lead status update
router.route('/:id/status')
  .patch(
    check('status', 'Valid status is required').isIn([
      'new',
      'contacted',
      'qualified',
      'proposal',
      'won',
      'lost',
      'inactive'
    ]),
    authController.restrictTo('admin', 'manager', 'sales'),
    leadController.updateLeadStatus
  );

module.exports = router;