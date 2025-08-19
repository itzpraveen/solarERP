const Equipment = require('../models/equipment.model');
const Project = require('../models/project.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const {
  sanitizePagination,
  sanitizeSort,
  sanitizeFields,
  buildSafeQuery,
  buildAdvancedFilter,
  validateRequiredFields,
  sanitizeBody,
  isValidObjectId,
  createErrorResponse
} = require('../../utils/validationHelper');

// Get all equipment with filtering, sorting, and pagination
exports.getAllEquipment = catchAsync(async (req, res, next) => {
  // 1) Build safe query with sanitization and soft delete filtering
  const sanitizedQuery = buildSafeQuery(req.query, ['page', 'sort', 'limit', 'fields'], true);
  const advancedQuery = buildAdvancedFilter(sanitizedQuery);
  
  let query = Equipment.find(advancedQuery);
  
  // 2) Safe sorting with allowed fields
  const allowedSortFields = ['name', 'manufacturer', 'model', 'type', 'price', 'createdAt', 'inventory.inStock'];
  const sortBy = sanitizeSort(req.query.sort, allowedSortFields, '-createdAt');
  query = query.sort(sortBy);
  
  // 3) Safe field limiting
  const allowedFields = ['name', 'manufacturer', 'model', 'type', 'price', 'specifications', 'inventory', 'discontinued', 'createdAt'];
  const fields = sanitizeFields(req.query.fields, allowedFields);
  query = query.select(fields);
  
  // 4) Safe pagination with limits
  const { page, limit, skip } = sanitizePagination(req.query);
  query = query.skip(skip).limit(limit);
  
  // EXECUTE QUERY
  const equipment = await query;
  const total = await Equipment.countDocuments(advancedQuery);
  
  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: equipment.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      equipment
    }
  });
});

// Get equipment by ID
exports.getEquipment = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid equipment ID format', 400));
  }
  
  const equipment = await Equipment.findOne({ _id: req.params.id, active: { $ne: false } })
    .populate({
      path: 'compatibleProducts',
      select: 'name manufacturer model type'
    })
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email'
    });
  
  if (!equipment) {
    return next(new AppError('Equipment not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      equipment
    }
  });
});

// Create new equipment
exports.createEquipment = catchAsync(async (req, res, next) => {
  // Validate required fields
  const requiredFields = ['name', 'manufacturer', 'model', 'type'];
  const missingFields = validateRequiredFields(req.body, requiredFields);
  
  if (missingFields.length > 0) {
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // Sanitize input body
  const sanitizedBody = sanitizeBody(req.body);
  
  // Validate numeric fields if provided
  if (sanitizedBody.price && (isNaN(sanitizedBody.price) || sanitizedBody.price < 0)) {
    return next(new AppError('Price must be a non-negative number', 400));
  }
  
  // Validate inventory fields if provided
  if (sanitizedBody.inventory) {
    const inventoryFields = ['inStock', 'allocated', 'onOrder', 'minimumStock'];
    for (const field of inventoryFields) {
      if (sanitizedBody.inventory[field] !== undefined && 
          (isNaN(sanitizedBody.inventory[field]) || sanitizedBody.inventory[field] < 0)) {
        return next(new AppError(`${field} must be a non-negative number`, 400));
      }
    }
  }
  
  // Set the creator to the current user
  sanitizedBody.createdBy = req.user.id;
  
  const newEquipment = await Equipment.create(sanitizedBody);
  
  res.status(201).json({
    status: 'success',
    data: {
      equipment: newEquipment
    }
  });
});

// Update equipment
exports.updateEquipment = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid equipment ID format', 400));
  }
  
  // Sanitize input body
  const sanitizedBody = sanitizeBody(req.body);
  
  // Remove fields that shouldn't be updated
  delete sanitizedBody.createdBy;
  delete sanitizedBody.createdAt;
  delete sanitizedBody._id;
  
  // Validate numeric fields if provided
  if (sanitizedBody.price && (isNaN(sanitizedBody.price) || sanitizedBody.price < 0)) {
    return next(new AppError('Price must be a non-negative number', 400));
  }
  
  // Validate inventory fields if provided
  if (sanitizedBody.inventory) {
    const inventoryFields = ['inStock', 'allocated', 'onOrder', 'minimumStock'];
    for (const field of inventoryFields) {
      if (sanitizedBody.inventory[field] !== undefined && 
          (isNaN(sanitizedBody.inventory[field]) || sanitizedBody.inventory[field] < 0)) {
        return next(new AppError(`${field} must be a non-negative number`, 400));
      }
    }
  }
  
  const equipment = await Equipment.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    sanitizedBody,
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!equipment) {
    return next(new AppError('Equipment not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      equipment
    }
  });
});

// Delete equipment (soft delete)
exports.deleteEquipment = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid equipment ID format', 400));
  }
  
  const equipment = await Equipment.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { active: false },
    { new: true }
  );
  
  if (!equipment) {
    return next(new AppError('Equipment not found', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Update inventory levels
exports.updateInventory = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid equipment ID format', 400));
  }
  
  const equipment = await Equipment.findOne({ _id: req.params.id, active: { $ne: false } });
  
  if (!equipment) {
    return next(new AppError('Equipment not found', 404));
  }
  
  // Sanitize inventory update body
  const sanitizedBody = sanitizeBody(req.body);
  
  // Validate inventory fields
  const inventoryFields = ['inStock', 'allocated', 'onOrder', 'minimumStock'];
  for (const field of inventoryFields) {
    if (sanitizedBody[field] !== undefined && 
        (isNaN(sanitizedBody[field]) || sanitizedBody[field] < 0)) {
      return next(new AppError(`${field} must be a non-negative number`, 400));
    }
  }
  
  // Update inventory values
  if (sanitizedBody.inStock !== undefined) equipment.inventory.inStock = sanitizedBody.inStock;
  if (sanitizedBody.allocated !== undefined) equipment.inventory.allocated = sanitizedBody.allocated;
  if (sanitizedBody.onOrder !== undefined) equipment.inventory.onOrder = sanitizedBody.onOrder;
  if (sanitizedBody.minimumStock !== undefined) equipment.inventory.minimumStock = sanitizedBody.minimumStock;
  if (sanitizedBody.location !== undefined) equipment.inventory.location = sanitizedBody.location;
  
  await equipment.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      equipment
    }
  });
});

// Add supplier to equipment
exports.addSupplier = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid equipment ID format', 400));
  }
  
  // Validate required fields
  const requiredFields = ['name', 'contactInfo'];
  const missingFields = validateRequiredFields(req.body, requiredFields);
  
  if (missingFields.length > 0) {
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // Sanitize supplier body
  const sanitizedSupplier = sanitizeBody(req.body);
  
  // Validate price if provided
  if (sanitizedSupplier.price && (isNaN(sanitizedSupplier.price) || sanitizedSupplier.price < 0)) {
    return next(new AppError('Price must be a non-negative number', 400));
  }
  
  const equipment = await Equipment.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { $push: { suppliers: sanitizedSupplier } },
    { new: true, runValidators: true }
  );
  
  if (!equipment) {
    return next(new AppError('Equipment not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      equipment
    }
  });
});

// Update supplier for equipment
exports.updateSupplier = catchAsync(async (req, res, next) => {
  // Validate ObjectIds
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid equipment ID format', 400));
  }
  
  if (!isValidObjectId(req.params.supplierId)) {
    return next(new AppError('Invalid supplier ID format', 400));
  }
  
  // Sanitize supplier update body
  const sanitizedSupplier = sanitizeBody(req.body);
  
  // Validate price if provided
  if (sanitizedSupplier.price && (isNaN(sanitizedSupplier.price) || sanitizedSupplier.price < 0)) {
    return next(new AppError('Price must be a non-negative number', 400));
  }
  
  // Preserve the supplier ID
  sanitizedSupplier._id = req.params.supplierId;
  
  const equipment = await Equipment.findOneAndUpdate(
    { _id: req.params.id, 'suppliers._id': req.params.supplierId, active: { $ne: false } },
    { $set: { 'suppliers.$': sanitizedSupplier } },
    { new: true, runValidators: true }
  );
  
  if (!equipment) {
    return next(new AppError('Equipment or supplier not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      equipment
    }
  });
});

// Add compatible product
exports.addCompatibleProduct = catchAsync(async (req, res, next) => {
  // Validate ObjectIds
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid equipment ID format', 400));
  }
  
  const { compatibleProductId } = req.body;
  
  if (!compatibleProductId || !isValidObjectId(compatibleProductId)) {
    return next(new AppError('Valid compatible product ID is required', 400));
  }
  
  // Prevent self-compatibility
  if (compatibleProductId === req.params.id) {
    return next(new AppError('Equipment cannot be compatible with itself', 400));
  }
  
  // Check if the compatible product exists and is active
  const compatibleProduct = await Equipment.findOne({ _id: compatibleProductId, active: { $ne: false } });
  if (!compatibleProduct) {
    return next(new AppError('Compatible product not found', 404));
  }
  
  const equipment = await Equipment.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { $addToSet: { compatibleProducts: compatibleProductId } },
    { new: true, runValidators: true }
  );
  
  if (!equipment) {
    return next(new AppError('Equipment not found', 404));
  }
  
  // Add reciprocal compatibility
  await Equipment.findByIdAndUpdate(
    compatibleProductId,
    { $addToSet: { compatibleProducts: req.params.id } }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      equipment
    }
  });
});

// Get low stock equipment
exports.getLowStockEquipment = catchAsync(async (req, res, next) => {
  // Safe pagination even for this endpoint
  const { page, limit, skip } = sanitizePagination(req.query);
  
  const equipment = await Equipment.find({
    $expr: {
      $lte: [
        { $subtract: ['$inventory.inStock', '$inventory.allocated'] },
        '$inventory.minimumStock'
      ]
    },
    discontinued: false,
    active: { $ne: false }
  })
  .sort('inventory.inStock')
  .skip(skip)
  .limit(limit);
  
  const total = await Equipment.countDocuments({
    $expr: {
      $lte: [
        { $subtract: ['$inventory.inStock', '$inventory.allocated'] },
        '$inventory.minimumStock'
      ]
    },
    discontinued: false,
    active: { $ne: false }
  });
  
  res.status(200).json({
    status: 'success',
    results: equipment.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      equipment
    }
  });
});

// Set equipment as discontinued
exports.discontinueEquipment = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid equipment ID format', 400));
  }
  
  const equipment = await Equipment.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { discontinued: true },
    { new: true }
  );
  
  if (!equipment) {
    return next(new AppError('Equipment not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      equipment
    }
  });
});

// Get equipment usage in projects
exports.getEquipmentUsage = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid equipment ID format', 400));
  }
  
  const equipment = await Equipment.findOne({ _id: req.params.id, active: { $ne: false } });
  
  if (!equipment) {
    return next(new AppError('Equipment not found', 404));
  }
  
  // Safe pagination for project results
  const { page, limit, skip } = sanitizePagination(req.query);
  
  // Find projects that use this equipment
  const projects = await Project.find({
    'equipment.manufacturer': equipment.manufacturer,
    'equipment.model': equipment.model,
    active: { $ne: false }
  })
  .select('name customer stage')
  .skip(skip)
  .limit(limit);
  
  const total = await Project.countDocuments({
    'equipment.manufacturer': equipment.manufacturer,
    'equipment.model': equipment.model,
    active: { $ne: false }
  });
  
  res.status(200).json({
    status: 'success',
    results: projects.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      projects
    }
  });
});