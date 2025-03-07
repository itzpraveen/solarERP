const Equipment = require('../models/equipment.model');
const Project = require('../models/project.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

// Get all equipment with filtering, sorting, and pagination
exports.getAllEquipment = catchAsync(async (req, res, next) => {
  // BUILD QUERY
  // 1) Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);
  
  // 2) Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  
  let query = Equipment.find(JSON.parse(queryStr));
  
  // 3) Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // 4) Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }
  
  // 5) Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;
  
  query = query.skip(skip).limit(limit);
  
  // EXECUTE QUERY
  const equipment = await query;
  
  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: equipment.length,
    data: {
      equipment
    }
  });
});

// Get equipment by ID
exports.getEquipment = catchAsync(async (req, res, next) => {
  const equipment = await Equipment.findById(req.params.id)
    .populate({
      path: 'compatibleProducts',
      select: 'name manufacturer model type'
    })
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email'
    });
  
  if (!equipment) {
    return next(new AppError('No equipment found with that ID', 404));
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
  // Set the creator to the current user
  req.body.createdBy = req.user.id;
  
  const newEquipment = await Equipment.create(req.body);
  
  res.status(201).json({
    status: 'success',
    data: {
      equipment: newEquipment
    }
  });
});

// Update equipment
exports.updateEquipment = catchAsync(async (req, res, next) => {
  const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  if (!equipment) {
    return next(new AppError('No equipment found with that ID', 404));
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
  const equipment = await Equipment.findByIdAndUpdate(req.params.id, { active: false });
  
  if (!equipment) {
    return next(new AppError('No equipment found with that ID', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Update inventory levels
exports.updateInventory = catchAsync(async (req, res, next) => {
  const equipment = await Equipment.findById(req.params.id);
  
  if (!equipment) {
    return next(new AppError('No equipment found with that ID', 404));
  }
  
  // Update inventory values
  if (req.body.inStock !== undefined) equipment.inventory.inStock = req.body.inStock;
  if (req.body.allocated !== undefined) equipment.inventory.allocated = req.body.allocated;
  if (req.body.onOrder !== undefined) equipment.inventory.onOrder = req.body.onOrder;
  if (req.body.minimumStock !== undefined) equipment.inventory.minimumStock = req.body.minimumStock;
  if (req.body.location !== undefined) equipment.inventory.location = req.body.location;
  
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
  const equipment = await Equipment.findByIdAndUpdate(
    req.params.id,
    { $push: { suppliers: req.body } },
    { new: true, runValidators: true }
  );
  
  if (!equipment) {
    return next(new AppError('No equipment found with that ID', 404));
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
  const equipment = await Equipment.findOneAndUpdate(
    { _id: req.params.id, 'suppliers._id': req.params.supplierId },
    { $set: { 'suppliers.$': req.body } },
    { new: true, runValidators: true }
  );
  
  if (!equipment) {
    return next(new AppError('No equipment or supplier found with that ID', 404));
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
  const { compatibleProductId } = req.body;
  
  // Check if the compatible product exists
  const compatibleProduct = await Equipment.findById(compatibleProductId);
  if (!compatibleProduct) {
    return next(new AppError('No compatible product found with that ID', 404));
  }
  
  const equipment = await Equipment.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { compatibleProducts: compatibleProductId } },
    { new: true, runValidators: true }
  );
  
  if (!equipment) {
    return next(new AppError('No equipment found with that ID', 404));
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
  const equipment = await Equipment.find({
    $expr: {
      $lte: [
        { $subtract: ['$inventory.inStock', '$inventory.allocated'] },
        '$inventory.minimumStock'
      ]
    },
    discontinued: false
  }).sort('inventory.inStock');
  
  res.status(200).json({
    status: 'success',
    results: equipment.length,
    data: {
      equipment
    }
  });
});

// Set equipment as discontinued
exports.discontinueEquipment = catchAsync(async (req, res, next) => {
  const equipment = await Equipment.findByIdAndUpdate(
    req.params.id,
    { discontinued: true },
    { new: true }
  );
  
  if (!equipment) {
    return next(new AppError('No equipment found with that ID', 404));
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
  const equipment = await Equipment.findById(req.params.id);
  
  if (!equipment) {
    return next(new AppError('No equipment found with that ID', 404));
  }
  
  // Find projects that use this equipment
  const projects = await Project.find({
    'equipment.manufacturer': equipment.manufacturer,
    'equipment.model': equipment.model
  }).select('name customer stage');
  
  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects
    }
  });
});