const express = require('express');
const inventoryController = require('../controllers/inventory.controller');
// const authMiddleware = require('../../common/middleware/authorize'); // Assuming authorize middleware is needed for inventory management

const router = express.Router();

// Protect routes (assuming inventory management requires authentication and potentially specific roles)
// router.use(authMiddleware.protect);
// router.use(authMiddleware.restrictTo('admin', 'manager')); // Example: restrict to admin and manager roles

router
  .route('/')
  .get(inventoryController.getAllInventory)
  .post(inventoryController.createInventory);

router
  .route('/:id')
  .get(inventoryController.getInventoryItem) // Renamed from getInventory
  .patch(inventoryController.updateInventoryDetails) // Renamed from updateInventory
  .delete(inventoryController.deactivateInventory); // Renamed from deleteInventory, assuming soft delete is preferred

module.exports = router;
