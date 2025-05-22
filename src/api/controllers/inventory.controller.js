const Inventory = require('../models/inventory.model');
const catchAsync = require('../../common/utils/catchAsync'); // Adjusted path
const AppError = require('../../utils/appError');

// Helper function to add stock log
const addStockLogEntry = async (
  inventoryId,
  type,
  quantityChange,
  userId,
  notes = '',
  referenceDocument = ''
) => {
  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) {
    throw new AppError('Inventory item not found for stock log.', 404);
  }
  inventory.stockLog.push({
    type,
    quantityChange,
    createdBy: userId,
    notes,
    referenceDocument,
    createdAt: new Date(),
  });
  // Note: The actual saving of the inventory document (and thus the log)
  // will happen in the calling function after all quantity updates are done.
};

// Create a new inventory item
exports.createInventory = catchAsync(async (req, res, _next) => {
  // const createdBy = req.user ? req.user.id : undefined; // Assuming req.user is populated - Model likely handles this
  const inventoryData = { ...req.body };

  const newInventory = new Inventory(inventoryData);
  // The pre-save hook in inventory.model.js will add the 'initial' stock log if quantity > 0

  await newInventory.save();

  return res.status(201).json({
    status: 'success',
    data: {
      inventory: newInventory,
    },
  });
});

// Get all inventory items
exports.getAllInventory = catchAsync(async (req, res, _next) => {
  // Basic filtering (can be expanded)
  const filter =
    req.query.active === 'false'
      ? { active: false }
      : { active: { $ne: false } };
  if (req.query.category) {
    filter.category = req.query.category;
  }
  // Add search by name or SKU
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    filter.$or = [
      { name: searchRegex },
      { sku: searchRegex },
      { modelNumber: searchRegex },
    ];
  }

  const inventory = await Inventory.find(filter).sort(req.query.sort || 'name');
  return res.status(200).json({
    status: 'success',
    results: inventory.length,
    data: {
      inventory,
    },
  });
});

// Get a single inventory item by ID
exports.getInventoryItem = catchAsync(async (req, res, next) => {
  // Renamed from getInventory
  const inventory = await Inventory.findById(req.params.id);

  if (!inventory || !inventory.active) {
    // Also check if active
    return next(
      new AppError('No active inventory item found with that ID', 404)
    );
  }

  return res.status(200).json({
    status: 'success',
    data: {
      inventory,
    },
  });
});

// Update an inventory item by ID (general details, not stock quantities)
exports.updateInventoryDetails = catchAsync(async (req, res, next) => {
  // Renamed
  // Exclude quantity fields, as they should be managed by specific stock operations
  // eslint-disable-next-line no-unused-vars
  const { quantity, reservedQuantity, stockLog, ...updateData } = req.body;

  const inventory = await Inventory.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!inventory) {
    return next(new AppError('No inventory item found with that ID', 404));
  }

  return res.status(200).json({
    status: 'success',
    data: {
      inventory,
    },
  });
});

// Deactivate an inventory item (soft delete)
exports.deactivateInventory = catchAsync(async (req, res, next) => {
  // Renamed
  const inventory = await Inventory.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true }
  );

  if (!inventory) {
    return next(new AppError('No inventory item found with that ID', 404));
  }

  return res.status(200).json({
    // Changed from 204 to return the updated item
    status: 'success',
    message: 'Inventory item deactivated successfully.',
    data: {
      inventory,
    },
  });
});

// --- Stock Management Functions ---

// Receive new stock
exports.receiveStock = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;
  const { quantityReceived, notes, referenceDocument } = req.body;
  const userId = req.user ? req.user.id : undefined;

  if (!quantityReceived || quantityReceived <= 0) {
    return next(
      new AppError('Quantity received must be a positive number.', 400)
    );
  }

  const inventory = await Inventory.findById(itemId);
  if (!inventory) {
    return next(new AppError('Inventory item not found.', 404));
  }

  inventory.quantity += quantityReceived;
  await addStockLogEntry(
    itemId,
    'received',
    quantityReceived,
    userId,
    notes,
    referenceDocument
  );
  await inventory.save();

  return res.status(200).json({
    status: 'success',
    message: `${quantityReceived} unit(s) received for ${inventory.name}.`,
    data: { inventory },
  });
});

// Allocate stock for a project/order
exports.allocateStock = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;
  const { quantityToAllocate, notes, referenceDocument } = req.body;
  const userId = req.user ? req.user.id : undefined;

  if (!quantityToAllocate || quantityToAllocate <= 0) {
    return next(
      new AppError('Quantity to allocate must be a positive number.', 400)
    );
  }

  const inventory = await Inventory.findById(itemId);
  if (!inventory) {
    return next(new AppError('Inventory item not found.', 404));
  }

  if (inventory.availableQuantity < quantityToAllocate) {
    return next(
      new AppError(
        `Not enough available stock for ${inventory.name}. Available: ${inventory.availableQuantity}`,
        400
      )
    );
  }

  inventory.reservedQuantity += quantityToAllocate;
  await addStockLogEntry(
    itemId,
    'allocated',
    quantityToAllocate,
    userId,
    notes,
    referenceDocument
  );
  await inventory.save();

  return res.status(200).json({
    status: 'success',
    message: `${quantityToAllocate} unit(s) of ${inventory.name} allocated.`,
    data: { inventory },
  });
});

// Commit (consume) allocated stock
exports.commitAllocatedStock = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;
  const { quantityToCommit, notes, referenceDocument } = req.body;
  const userId = req.user ? req.user.id : undefined;

  if (!quantityToCommit || quantityToCommit <= 0) {
    return next(
      new AppError('Quantity to commit must be a positive number.', 400)
    );
  }

  const inventory = await Inventory.findById(itemId);
  if (!inventory) {
    return next(new AppError('Inventory item not found.', 404));
  }

  if (inventory.reservedQuantity < quantityToCommit) {
    return next(
      new AppError(
        `Not enough reserved stock for ${inventory.name} to commit. Reserved: ${inventory.reservedQuantity}`,
        400
      )
    );
  }
  if (inventory.quantity < quantityToCommit) {
    // Should not happen if reserved is correct
    return next(
      new AppError(
        `Overall stock for ${inventory.name} is less than quantity to commit. This indicates a data inconsistency.`,
        500
      )
    );
  }

  inventory.quantity -= quantityToCommit;
  inventory.reservedQuantity -= quantityToCommit;
  await addStockLogEntry(
    itemId,
    'committed',
    -quantityToCommit,
    userId,
    notes,
    referenceDocument
  ); // quantityChange is negative
  await inventory.save();

  return res.status(200).json({
    status: 'success',
    message: `${quantityToCommit} unit(s) of ${inventory.name} committed.`,
    data: { inventory },
  });
});

// Release (de-allocate) reserved stock
exports.releaseAllocatedStock = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;
  const { quantityToRelease, notes, referenceDocument } = req.body;
  const userId = req.user ? req.user.id : undefined;

  if (!quantityToRelease || quantityToRelease <= 0) {
    return next(
      new AppError('Quantity to release must be a positive number.', 400)
    );
  }

  const inventory = await Inventory.findById(itemId);
  if (!inventory) {
    return next(new AppError('Inventory item not found.', 404));
  }

  if (inventory.reservedQuantity < quantityToRelease) {
    return next(
      new AppError(
        `Cannot release ${quantityToRelease} unit(s), only ${inventory.reservedQuantity} are reserved for ${inventory.name}.`,
        400
      )
    );
  }

  inventory.reservedQuantity -= quantityToRelease;
  await addStockLogEntry(
    itemId,
    'released',
    -quantityToRelease,
    userId,
    notes,
    referenceDocument
  ); // Log change in reservation
  await inventory.save();

  return res.status(200).json({
    status: 'success',
    message: `${quantityToRelease} unit(s) of ${inventory.name} released from allocation.`,
    data: { inventory },
  });
});

// Adjust stock quantity (for discrepancies, damages, etc.)
exports.adjustStockQuantity = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;
  const { newPhysicalQuantity, notes, referenceDocument } = req.body;
  const userId = req.user ? req.user.id : undefined;

  if (newPhysicalQuantity === undefined || newPhysicalQuantity < 0) {
    return next(
      new AppError('New physical quantity must be a non-negative number.', 400)
    );
  }

  const inventory = await Inventory.findById(itemId);
  if (!inventory) {
    return next(new AppError('Inventory item not found.', 404));
  }

  const quantityChange = newPhysicalQuantity - inventory.quantity;

  if (inventory.reservedQuantity > newPhysicalQuantity) {
    return next(
      new AppError(
        `New quantity ${newPhysicalQuantity} is less than reserved quantity ${inventory.reservedQuantity}. Release some reservations first.`,
        400
      )
    );
  }

  inventory.quantity = newPhysicalQuantity;
  await addStockLogEntry(
    itemId,
    'adjusted',
    quantityChange,
    userId,
    notes || 'Stock adjustment',
    referenceDocument
  );
  await inventory.save();

  return res.status(200).json({
    status: 'success',
    message: `Stock quantity for ${inventory.name} adjusted to ${newPhysicalQuantity}. Change: ${quantityChange}.`,
    data: { inventory },
  });
});

// Get stock log for an item
exports.getInventoryStockLog = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;
  const inventory = await Inventory.findById(itemId).populate(
    'stockLog.createdBy',
    'firstName lastName email'
  );

  if (!inventory) {
    return next(new AppError('Inventory item not found.', 404));
  }

  return res.status(200).json({
    status: 'success',
    results: inventory.stockLog.length,
    data: {
      stockLog: inventory.stockLog,
    },
  });
});

// Delete an inventory item by ID (Hard delete - use with caution, consider deactivation first)
// This is the original deleteInventory. Kept for completeness but deactivation is preferred.
exports.deleteInventoryItemPermanently = catchAsync(async (req, res, next) => {
  // Renamed
  const inventory = await Inventory.findByIdAndDelete(req.params.id);

  if (!inventory) {
    return next(new AppError('No inventory item found with that ID', 404));
  }

  return res.status(204).json({
    // 204 No Content for successful deletion
    status: 'success',
    data: null,
  });
});
