const Inventory = require('../models/inventory.model');
const catchAsync = require('../../common/utils/catchAsync');
const AppError = require('../../utils/appError');

// Create a new inventory item
exports.createInventory = catchAsync(async (req, res, _next) => {
  // Rename next to _next
  const inventory = await Inventory.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      inventory,
    },
  });
  // No return needed here as it's the main function body
});

// Get all inventory items
exports.getAllInventory = catchAsync(async (req, res, _next) => {
  // Rename next to _next
  const inventory = await Inventory.find();
  res.status(200).json({
    status: 'success',
    results: inventory.length,
    data: {
      inventory,
    },
  });
  // No return needed here as it's the main function body
});

// Get a single inventory item by ID
exports.getInventory = catchAsync(async (req, res, next) => {
  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return next(new AppError('No inventory found with that ID', 404)); // Added return
  }

  return res.status(200).json({
    status: 'success',
    data: {
      inventory,
    },
  });
  // No return needed here as it's the main function body
});

// Update an inventory item by ID
exports.updateInventory = catchAsync(async (req, res, next) => {
  const inventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!inventory) {
    return next(new AppError('No inventory found with that ID', 404)); // Added return
  }

  return res.status(200).json({
    status: 'success',
    data: {
      inventory,
    },
  });
  // No return needed here as it's the main function body
});

// Delete an inventory item by ID
exports.deleteInventory = catchAsync(async (req, res, next) => {
  const inventory = await Inventory.findByIdAndDelete(req.params.id);

  if (!inventory) {
    return next(new AppError('No inventory found with that ID', 404)); // Added return
  }

  return res.status(204).json({
    status: 'success',
    data: null,
  });
  // No return needed for 204 status
});
