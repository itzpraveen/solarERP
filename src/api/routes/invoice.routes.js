const express = require('express');
const invoiceController = require('../controllers/invoice.controller');
const authController = require('../controllers/auth.controller'); // Assuming you have auth middleware

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect); // Ensures user is logged in

// TODO: Add role-based authorization if needed (e.g., only finance users can manage invoices)
// router.use(authController.restrictTo('admin', 'finance-manager'));

router
  .route('/')
  .get(invoiceController.getAllInvoices)
  .post(invoiceController.createInvoice);

router
  .route('/:id')
  .get(invoiceController.getInvoice)
  .patch(invoiceController.updateInvoice) // For updating draft invoices primarily
  .delete(invoiceController.deleteInvoice); // For deleting draft invoices

router.post('/:id/payments', invoiceController.recordPayment);
router.patch('/:id/status', invoiceController.updateInvoiceStatus); // For sending, voiding, cancelling

// Example of a route to get invoices for a specific customer (can also be done via query params on GET /)
// router.get('/customer/:customerId', invoiceController.getCustomerInvoices);

// Example of a route to get invoices for a specific project
// router.get('/project/:projectId', invoiceController.getProjectInvoices);

module.exports = router;
