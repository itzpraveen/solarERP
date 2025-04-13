const express = require('express');
const reportController = require('../controllers/report.controller');
const authController = require('../controllers/auth.controller');
const router = express.Router();

// All report routes require authentication
router.use(authController.protect);

// Restrict most reports to admin, manager, and finance roles
router.use(authController.restrictTo('admin', 'manager', 'finance'));

// Sales pipeline report
router.get('/sales-pipeline', reportController.getSalesPipeline);

// Project status report
router.get('/project-status', reportController.getProjectStatus);

// Financial report
router.get('/financial', reportController.getFinancialReport);

// Customer report
router.get('/customer', reportController.getCustomerReport);

// User performance report - admin only
router.get(
  '/user-performance',
  authController.restrictTo('admin'),
  reportController.getUserPerformance
);

module.exports = router;