const express = require('express');
const leadController = require('../../controllers/lead.controller');
const authController = require('../../controllers/auth.controller');
const { check } = require('express-validator');
const { cacheMiddleware, invalidateCache } = require('../../services/cache.service');
const router = express.Router();

// Protect all routes
router.use(authController.protect);

// Input validation
const validateLead = [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('phone', 'Phone number is required').not().isEmpty(),
  check('street', 'Street address is required').not().isEmpty(),
  check('city', 'City is required').not().isEmpty(),
  check('state', 'State is required').not().isEmpty(),
  check('zipCode', 'ZIP code is required').not().isEmpty(),
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

// Lead statistics (cached for 5 minutes)
router.get('/stats', 
  authController.restrictTo('admin', 'manager'), 
  cacheMiddleware('lead:stats', 300),
  leadController.getLeadStats
);

// Lead routes
router.route('/')
  .get(cacheMiddleware('leads:list', 60), leadController.getAllLeads) // Cache for 1 minute
  .post(validateLead, async (req, res, next) => {
    // Invalidate cache when creating new lead
    await invalidateCache(['leads:*', 'lead:stats:*']);
    next();
  }, leadController.createLead);

router.route('/:id')
  .get(cacheMiddleware('lead:detail', 300), leadController.getLead) // Cache for 5 minutes
  .patch(async (req, res, next) => {
    // Invalidate cache when updating lead
    await invalidateCache([`lead:detail:id:${req.params.id}:*`, 'leads:*', 'lead:stats:*']);
    next();
  }, leadController.updateLead)
  .delete(authController.restrictTo('admin', 'manager'), async (req, res, next) => {
    // Invalidate cache when deleting lead
    await invalidateCache([`lead:detail:id:${req.params.id}:*`, 'leads:*', 'lead:stats:*']);
    next();
  }, leadController.deleteLead);

// Lead notes
router.route('/:id/notes')
  .post(check('text', 'Note text is required').not().isEmpty(), leadController.addLeadNote);

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
    leadController.addLeadInteraction
  );

// Lead assignment
router.route('/:id/assign')
  .patch(
    check('userId', 'User ID is required').isUUID(),
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
    leadController.updateLeadStatus
  );

module.exports = router;
