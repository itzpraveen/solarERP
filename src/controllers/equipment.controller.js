'use strict';

const db = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const { Equipment, EquipmentSupplier, ProjectEquipment, Project } = db;

// Get all equipment with filtering and pagination
exports.getAllEquipment = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
  const offset = (page - 1) * limit;

  // Build where clause
  const where = {};
  
  // Filter by type
  if (req.query.type) {
    where.type = req.query.type;
  }
  
  // Filter by manufacturer
  if (req.query.manufacturer) {
    where.manufacturer = req.query.manufacturer;
  }
  
  // Filter by in stock status
  if (req.query.inStock !== undefined) {
    if (req.query.inStock === 'true') {
      where.inStock = { [Op.gt]: 0 };
    } else {
      where.inStock = 0;
    }
  }
  
  // Search functionality
  if (req.query.search) {
    const searchTerm = `%${req.query.search.toLowerCase()}%`;
    where[Op.or] = [
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('name')), { [Op.like]: searchTerm }),
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('model')), { [Op.like]: searchTerm }),
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('manufacturer')), { [Op.like]: searchTerm })
    ];
  }

  // Sort configuration
  const order = [];
  if (req.query.sort) {
    const sortField = req.query.sort.startsWith('-') ? req.query.sort.slice(1) : req.query.sort;
    const sortOrder = req.query.sort.startsWith('-') ? 'DESC' : 'ASC';
    order.push([sortField, sortOrder]);
  } else {
    order.push(['name', 'ASC']);
  }

  const { rows: equipment, count } = await Equipment.findAndCountAll({
    where,
    include: [
      { model: EquipmentSupplier, as: 'suppliers', attributes: ['id', 'name', 'contactPerson', 'phone', 'email', 'preferredSupplier'] }
    ],
    order,
    limit,
    offset,
    distinct: true
  });

  res.status(200).json({
    status: 'success',
    results: equipment.length,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      totalResults: count
    },
    data: { equipment }
  });
});

// Get single equipment by ID
exports.getEquipment = catchAsync(async (req, res, next) => {
  const equipment = await Equipment.findByPk(req.params.id, {
    include: [
      { model: EquipmentSupplier, as: 'suppliers' },
      { association: 'compatibleProducts', through: { attributes: [] } }
    ]
  });

  if (!equipment) {
    return next(new AppError('Equipment not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { equipment }
  });
});

// Create new equipment
exports.createEquipment = catchAsync(async (req, res, next) => {
  // Validate required fields
  const requiredFields = ['name', 'type', 'manufacturer', 'model', 'purchaseCost'];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return next(new AppError(`${field} is required`, 400));
    }
  }

  // Create equipment
  const equipment = await Equipment.create({ ...req.body, createdById: req.user.id });

  res.status(201).json({
    status: 'success',
    data: { equipment }
  });
});

// Update equipment
exports.updateEquipment = catchAsync(async (req, res, next) => {
  const equipment = await Equipment.findByPk(req.params.id);
  
  if (!equipment) {
    return next(new AppError('Equipment not found', 404));
  }

  // Update equipment
  await equipment.update({ ...req.body });

  // Fetch updated equipment with associations
  const updatedEquipment = await Equipment.findByPk(equipment.id, {
    include: [
      {
        model: EquipmentSupplier,
        as: 'suppliers'
      }
    ]
  });

  res.status(200).json({
    status: 'success',
    data: { equipment: updatedEquipment }
  });
});

// Delete equipment
exports.deleteEquipment = catchAsync(async (req, res, next) => {
  const equipment = await Equipment.findByPk(req.params.id);
  
  if (!equipment) {
    return next(new AppError('Equipment not found', 404));
  }

  // Check if equipment is used in any projects
  const usageCount = await ProjectEquipment.count({ where: { manufacturer: equipment.manufacturer, model: equipment.model } });

  if (usageCount > 0) {
    return next(new AppError('Cannot delete equipment that is used in projects', 400));
  }

  // Hard delete equipment
  await equipment.destroy();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Update equipment stock
exports.updateEquipmentStock = catchAsync(async (req, res, next) => {
  const { quantity, operation, notes } = req.body;
  
  if (!quantity || !operation) {
    return next(new AppError('Quantity and operation are required', 400));
  }

  if (!['add', 'remove', 'set'].includes(operation)) {
    return next(new AppError('Invalid operation. Must be add, remove, or set', 400));
  }

  const equipment = await Equipment.findByPk(req.params.id);
  
  if (!equipment) {
    return next(new AppError('Equipment not found', 404));
  }

  let newStock;
  switch (operation) {
    case 'add':
      newStock = equipment.inStock + quantity;
      break;
    case 'remove':
      newStock = equipment.inStock - quantity;
      if (newStock < 0) {
        return next(new AppError('Insufficient stock', 400));
      }
      break;
    case 'set':
      newStock = quantity;
      break;
  }

  // Update stock
  await equipment.update({ inStock: newStock });

  res.status(200).json({
    status: 'success',
    data: { 
      equipment: {
        id: equipment.id,
        name: equipment.name,
        previousStock: equipment.inStock,
        newStock,
        operation,
        notes
      }
    }
  });
});

// Low stock equipment
exports.getLowStockEquipment = catchAsync(async (req, res) => {
  const list = await Equipment.scope('needsReorder').findAll({ order: [['name', 'ASC']] });
  res.status(200).json({ status: 'success', results: list.length, data: { equipment: list } });
});

// Add supplier
exports.addSupplier = catchAsync(async (req, res, next) => {
  const { name, contactPerson, email, phone, preferredSupplier, leadTimeInDays, notes } = req.body;
  const item = await Equipment.findByPk(req.params.id);
  if (!item) return next(new AppError('Equipment not found', 404));
  const supplier = await EquipmentSupplier.create({ equipmentId: item.id, name, contactPerson, email, phone, preferredSupplier: !!preferredSupplier, leadTimeInDays, notes });
  res.status(201).json({ status: 'success', data: { supplier } });
});

// Update supplier
exports.updateSupplier = catchAsync(async (req, res, next) => {
  const supplier = await EquipmentSupplier.findOne({ where: { id: req.params.supplierId, equipmentId: req.params.id } });
  if (!supplier) return next(new AppError('Supplier not found', 404));
  await supplier.update(req.body || {});
  res.status(200).json({ status: 'success', data: { supplier } });
});

// Add compatible product
exports.addCompatibleProduct = catchAsync(async (req, res, next) => {
  const equipment = await Equipment.findByPk(req.params.id);
  const compatible = await Equipment.findByPk(req.body.compatibleProductId);
  if (!equipment || !compatible) return next(new AppError('Equipment not found', 404));
  await equipment.addCompatibleProducts(compatible);
  res.status(201).json({ status: 'success' });
});

// Discontinue equipment
exports.discontinueEquipment = catchAsync(async (req, res, next) => {
  const equipment = await Equipment.findByPk(req.params.id);
  if (!equipment) return next(new AppError('Equipment not found', 404));
  await equipment.update({ discontinued: true });
  res.status(200).json({ status: 'success', data: { equipment } });
});

// Equipment usage overview
exports.getEquipmentUsage = catchAsync(async (req, res, next) => {
  const equipment = await Equipment.findByPk(req.params.id);
  if (!equipment) return next(new AppError('Equipment not found', 404));
  const usage = await ProjectEquipment.findAll({
    where: { manufacturer: equipment.manufacturer, model: equipment.model },
    include: [{ model: Project, as: 'project', attributes: ['id', 'name', 'status'] }],
    order: [['created_at', 'DESC']]
  });
  res.status(200).json({ status: 'success', results: usage.length, data: { usage } });
});

// Add supplier to equipment
exports.addEquipmentSupplier = catchAsync(async (req, res, next) => {
  const equipment = await Equipment.findByPk(req.params.id);
  
  if (!equipment) {
    return next(new AppError('Equipment not found', 404));
  }

  const supplier = await EquipmentSupplier.create({
    equipment_id: equipment.id,
    ...req.body,
    created_by_id: req.user.id
  });

  res.status(201).json({
    status: 'success',
    data: { supplier }
  });
});

// Remove supplier from equipment
exports.removeEquipmentSupplier = catchAsync(async (req, res, next) => {
  const supplier = await EquipmentSupplier.findOne({
    where: {
      equipment_id: req.params.id,
      id: req.params.supplierId
    }
  });
  
  if (!supplier) {
    return next(new AppError('Supplier not found for this equipment', 404));
  }

  await supplier.destroy();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get equipment statistics
exports.getEquipmentStats = catchAsync(async (req, res) => {
  // Get equipment by type
  const byType = await Equipment.findAll({
    attributes: [
      'type',
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      [db.sequelize.fn('SUM', db.sequelize.col('in_stock')), 'totalStock'],
      [db.sequelize.fn('SUM', db.sequelize.literal('in_stock * unit_cost')), 'totalValue']
    ],
    group: ['type']
  });

  // Get low stock items (less than 10 in stock)
  const lowStock = await Equipment.findAll({
    where: {
      in_stock: { [Op.lt]: 10 }
    },
    attributes: ['id', 'name', 'type', 'in_stock', 'min_stock_level'],
    order: [['in_stock', 'ASC']],
    limit: 10
  });

  // Get total counts
  const totalItems = await Equipment.count();
  const totalInStock = await Equipment.sum('in_stock') || 0;
  const totalValue = await Equipment.sum(db.sequelize.literal('in_stock * unit_cost')) || 0;
  const outOfStock = await Equipment.count({ where: { in_stock: 0 } });

  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        totalItems,
        totalInStock,
        totalValue,
        outOfStock,
        lowStockCount: lowStock.length
      },
      byType,
      lowStock
    }
  });
});

// Get equipment compatibility list
exports.getEquipmentCompatibility = catchAsync(async (req, res, next) => {
  const equipment = await Equipment.findByPk(req.params.id);
  
  if (!equipment) {
    return next(new AppError('Equipment not found', 404));
  }

  const compatibilities = await EquipmentCompatibility.findAll({
    where: {
      [Op.or]: [
        { equipment_id_1: equipment.id },
        { equipment_id_2: equipment.id }
      ]
    },
    include: [
      {
        model: Equipment,
        as: 'equipment1',
        attributes: ['id', 'name', 'type', 'manufacturer', 'model_number']
      },
      {
        model: Equipment,
        as: 'equipment2',
        attributes: ['id', 'name', 'type', 'manufacturer', 'model_number']
      }
    ]
  });

  // Format the response to show compatible equipment
  const compatibleEquipment = compatibilities.map(comp => {
    if (comp.equipment_id_1 === equipment.id) {
      return comp.equipment2;
    } else {
      return comp.equipment1;
    }
  });

  res.status(200).json({
    status: 'success',
    data: { 
      equipment: {
        id: equipment.id,
        name: equipment.name,
        type: equipment.type
      },
      compatibleEquipment 
    }
  });
});

// Add equipment compatibility
exports.addEquipmentCompatibility = catchAsync(async (req, res, next) => {
  const equipment1 = await Equipment.findByPk(req.params.id);
  const equipment2 = await Equipment.findByPk(req.body.compatible_equipment_id);
  
  if (!equipment1 || !equipment2) {
    return next(new AppError('Equipment not found', 404));
  }

  // Check if compatibility already exists
  const existing = await EquipmentCompatibility.findOne({
    where: {
      [Op.or]: [
        {
          equipment_id_1: equipment1.id,
          equipment_id_2: equipment2.id
        },
        {
          equipment_id_1: equipment2.id,
          equipment_id_2: equipment1.id
        }
      ]
    }
  });

  if (existing) {
    return next(new AppError('Compatibility already exists', 400));
  }

  const compatibility = await EquipmentCompatibility.create({
    equipment_id_1: equipment1.id,
    equipment_id_2: equipment2.id,
    compatibility_notes: req.body.notes
  });

  res.status(201).json({
    status: 'success',
    data: { compatibility }
  });
});
