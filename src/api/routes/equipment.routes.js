const express = require('express');
const equipmentController = require('../controllers/equipment.controller');
const authController = require('../controllers/auth.controller');
const { check } = require('express-validator');
const router = express.Router();

// Protect all routes
router.use(authController.protect);

// Input validation
const validateEquipment = [
  check('type', 'Valid equipment type is required').isIn([
    'panel',
    'inverter',
    'battery',
    'optimizer',
    'racking',
    'monitoring',
    'disconnect',
    'breaker',
    'wiring',
    'conduit',
    'other'
  ]),
  check('name', 'Equipment name is required').not().isEmpty(),
  check('manufacturer', 'Manufacturer is required').not().isEmpty(),
  check('model', 'Model number is required').not().isEmpty(),
  check('cost.purchase', 'Purchase cost is required').isNumeric()
];

// Special routes
router.get('/low-stock', authController.restrictTo('admin', 'manager', 'installer', 'finance'), equipmentController.getLowStockEquipment);

// Main routes
router.route('/')
  .get(authController.restrictTo('admin', 'manager', 'installer', 'sales', 'finance'), equipmentController.getAllEquipment)
  .post(authController.restrictTo('admin', 'manager'), validateEquipment, equipmentController.createEquipment);

router.route('/:id')
  .get(authController.restrictTo('admin', 'manager', 'installer', 'sales', 'finance'), equipmentController.getEquipment)
  .patch(authController.restrictTo('admin', 'manager'), equipmentController.updateEquipment)
  .delete(authController.restrictTo('admin', 'manager'), equipmentController.deleteEquipment);

// Equipment inventory
router.route('/:id/inventory')
  .patch(authController.restrictTo('admin', 'manager', 'installer'), equipmentController.updateInventory);

// Equipment suppliers
router.route('/:id/suppliers')
  .post([
    check('name', 'Supplier name is required').not().isEmpty()
  ], authController.restrictTo('admin', 'manager'), equipmentController.addSupplier);

router.route('/:id/suppliers/:supplierId')
  .patch(authController.restrictTo('admin', 'manager'), equipmentController.updateSupplier);

// Compatible products
router.route('/:id/compatible-products')
  .post([
    check('compatibleProductId', 'Compatible product ID is required').isMongoId()
  ], authController.restrictTo('admin', 'manager'), equipmentController.addCompatibleProduct);

// Discontinue equipment
router.route('/:id/discontinue')
  .patch(authController.restrictTo('admin', 'manager'), equipmentController.discontinueEquipment);

// Equipment usage
router.route('/:id/usage')
  .get(authController.restrictTo('admin', 'manager', 'installer', 'sales', 'finance'), equipmentController.getEquipmentUsage);

module.exports = router;