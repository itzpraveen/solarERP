const express = require('express');
const customerController = require('../controllers/customer.controller');
const authController = require('../controllers/auth.controller');
const { check } = require('express-validator');
const router = express.Router();

// Protect all routes
router.use(authController.protect);

// Input validation
const validateCustomer = [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('phone', 'Phone number is required').not().isEmpty(),
  check('address.street', 'Street address is required').not().isEmpty(),
  check('address.city', 'City is required').not().isEmpty(),
  check('address.state', 'State is required').not().isEmpty(),
  check('address.zipCode', 'ZIP code is required').not().isEmpty(),
  check('originalLead', 'Original lead ID is required').isMongoId()
];

// Customer routes
router.route('/')
  .get(customerController.getAllCustomers)
  .post(validateCustomer, customerController.createCustomer);

router.route('/:id')
  .get(customerController.getCustomer)
  .patch(customerController.updateCustomer)
  .delete(authController.restrictTo('admin', 'manager'), customerController.deleteCustomer);

// Convert lead to customer
router.route('/convert-lead/:leadId')
  .post(
    check('proposalId', 'If provided, proposal ID must be valid').optional().isMongoId(),
    customerController.convertLeadToCustomer
  );

// Customer notes
router.route('/:id/notes')
  .post(
    check('text', 'Note text is required').not().isEmpty(),
    customerController.addCustomerNote
  );

module.exports = router;