const express = require('express');
const equipmentController = require('../../controllers/equipment.controller');
const authController = require('../../controllers/auth.controller');
const { check } = require('express-validator');
const router = express.Router();

// Protect all routes
router.use(authController.protect);

// Input validation
// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  next();
};

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
  check('model', 'Model is required').not().isEmpty(),
  check('purchaseCost', 'Purchase cost is required').isNumeric()
];

// Special routes
router.get('/low-stock', equipmentController.getLowStockEquipment);

// Main routes
router.route('/')
  .get(equipmentController.getAllEquipment)
  .post(validateEquipment, handleValidationErrors, equipmentController.createEquipment);

router.route('/:id')
  .get(equipmentController.getEquipment)
  .patch(equipmentController.updateEquipment)
  .delete(authController.restrictTo('admin', 'manager'), equipmentController.deleteEquipment);

// Equipment inventory
router.route('/:id/inventory')
  .patch([
    check('quantity', 'Quantity must be a positive integer').isInt({ min: 0 }),
    check('operation', 'Operation must be one of add/remove/set').isIn(['add', 'remove', 'set'])
  ], handleValidationErrors, equipmentController.updateEquipmentStock);

// Equipment suppliers
router.route('/:id/suppliers')
  .post([
    check('name', 'Supplier name is required').not().isEmpty()
  ], handleValidationErrors, equipmentController.addSupplier);

router.route('/:id/suppliers/:supplierId')
  .patch(equipmentController.updateSupplier);

// Compatible products
router.route('/:id/compatible-products')
  .post([
    check('compatibleProductId', 'Compatible product ID is required').isUUID()
  ], handleValidationErrors, equipmentController.addCompatibleProduct);

// Discontinue equipment
router.route('/:id/discontinue')
  .patch(equipmentController.discontinueEquipment);

// Equipment usage
router.route('/:id/usage')
  .get(equipmentController.getEquipmentUsage);

module.exports = router;
