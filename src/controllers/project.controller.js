'use strict';

const db = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const { 
  Project, 
  Customer, 
  User, 
  ProjectNote, 
  ProjectDocument, 
  ProjectEquipment,
  ProjectPayment,
  ProjectExpense,
  Equipment,
  ProjectIssue 
} = db;

// Get all projects with filtering, sorting, and pagination
exports.getAllProjects = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
  const offset = (page - 1) * limit;

  // Build where clause
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.stage) where.stage = req.query.stage;
  if (req.query.customerId) where.customerId = req.query.customerId;
  if (req.query.projectManagerId) where.projectManagerId = req.query.projectManagerId;
  
  // Search functionality
  if (req.query.search) {
    const searchTerm = `%${req.query.search.toLowerCase()}%`;
    where[Op.or] = [
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('name')), { [Op.like]: searchTerm })
    ];
  }

  // Date range filtering
  if (req.query.startDate || req.query.endDate) {
    where.scheduledInstallationDate = {};
    if (req.query.startDate) {
      where.scheduledInstallationDate[Op.gte] = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      where.scheduledInstallationDate[Op.lte] = new Date(req.query.endDate);
    }
  }

  // Sort configuration
  const order = [];
  if (req.query.sort) {
    const sortField = req.query.sort.startsWith('-') ? req.query.sort.slice(1) : req.query.sort;
    const sortOrder = req.query.sort.startsWith('-') ? 'DESC' : 'ASC';
    order.push([sortField, sortOrder]);
  } else {
    order.push(['createdAt', 'DESC']);
  }

  const { rows: projects, count } = await Project.findAndCountAll({
    where,
    include: [
      { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
      { model: User, as: 'projectManager', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ],
    order,
    limit,
    offset,
    distinct: true
  });

  res.status(200).json({
    status: 'success',
    results: projects.length,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      totalResults: count
    },
    data: { projects }
  });
});

// Get single project by ID
exports.getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByPk(req.params.id, {
    include: [
      {
        model: Customer,
        as: 'customer'
      },
      { model: User, as: 'projectManager', attributes: ['id', 'firstName', 'lastName', 'email'] },
      {
        model: ProjectNote,
        as: 'notes',
        include: [
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        order: [['created_at', 'DESC']]
      },
      {
        model: ProjectDocument,
        as: 'documents',
        order: [['created_at', 'DESC']]
      },
      {
        model: ProjectEquipment,
        as: 'equipment',
        include: [
          {
            model: Equipment,
            as: 'equipmentDetails'
          }
        ]
      },
      {
        model: ProjectPayment,
        as: 'payments',
        order: [['payment_date', 'DESC']]
      },
      {
        model: ProjectExpense,
        as: 'expenses',
        order: [['expense_date', 'DESC']]
      }
    ]
  });

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { project }
  });
});

// Create new project
exports.createProject = catchAsync(async (req, res, next) => {
  // Validate customer exists
  const customer = await Customer.findByPk(req.body.customerId);
  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }

  // Validate project manager if provided
  if (req.body.projectManagerId) {
    const projectManager = await User.findByPk(req.body.projectManagerId);
    if (!projectManager) {
      return next(new AppError('Project manager not found', 404));
    }
  }

  // Create project
  const project = await Project.create({ ...req.body, createdById: req.user.id });

  // Fetch the created project with associations
  const createdProject = await Project.findByPk(project.id, {
    include: [
      { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'projectManager', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ]
  });

  res.status(201).json({
    status: 'success',
    data: { project: createdProject }
  });
});

// Update project
exports.updateProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByPk(req.params.id);
  
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Validate customer if being updated
  if (req.body.customerId && req.body.customerId !== project.customerId) {
    const customer = await Customer.findByPk(req.body.customerId);
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }
  }

  // Validate project manager if being updated
  if (req.body.projectManagerId && req.body.projectManagerId !== project.projectManagerId) {
    const projectManager = await User.findByPk(req.body.projectManagerId);
    if (!projectManager) {
      return next(new AppError('Project manager not found', 404));
    }
  }

  // Update project
  await project.update({ ...req.body, updatedById: req.user.id });

  // Fetch updated project with associations
  const updatedProject = await Project.findByPk(project.id, {
    include: [
      { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'projectManager', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ]
  });

  res.status(200).json({
    status: 'success',
    data: { project: updatedProject }
  });
});

// Delete project (soft delete)
exports.deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByPk(req.params.id);
  
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Soft delete by updating status
  await project.update({ status: 'cancelled', updatedById: req.user.id });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Update project status
exports.updateProjectStatus = catchAsync(async (req, res, next) => {
  const { status, notes } = req.body;
  
  if (!status) {
    return next(new AppError('Status is required', 400));
  }

  const project = await Project.findByPk(req.params.id);
  
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Update status
  await project.update({ status, updatedById: req.user.id });

  // Add note if provided
  if (notes) {
    await ProjectNote.create({ projectId: project.id, text: notes, createdById: req.user.id });
  }

  // Fetch updated project
  const updatedProject = await Project.findByPk(project.id, {
    include: [
      { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ]
  });

  res.status(200).json({
    status: 'success',
    data: { project: updatedProject }
  });
});

// Update project team assignments
exports.updateProjectTeam = catchAsync(async (req, res, next) => {
  const { projectManagerId, salesRepId, designerId } = req.body;
  const project = await Project.findByPk(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));

  const updates = {};
  if (projectManagerId !== undefined) updates.projectManagerId = projectManagerId;
  if (salesRepId !== undefined) updates.salesRepId = salesRepId;
  if (designerId !== undefined) updates.designerId = designerId;

  await project.update(updates);
  const updated = await Project.findByPk(project.id, {
    include: [
      { model: User, as: 'projectManager', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'salesRep', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'designer', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ]
  });
  res.status(200).json({ status: 'success', data: { project: updated } });
});

// Add a project note
exports.addProjectNote = catchAsync(async (req, res, next) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));
  const text = (req.body.text || '').trim();
  if (!text) return next(new AppError('Note text is required', 400));
  const note = await ProjectNote.create({ projectId: project.id, text, createdById: req.user.id });
  res.status(201).json({ status: 'success', data: { note } });
});

// Add a project issue
exports.addProjectIssue = catchAsync(async (req, res, next) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));
  const { title, description, priority = 'medium', assignedToId } = req.body;
  if (!title || !description) return next(new AppError('Title and description are required', 400));
  const issue = await ProjectIssue.create({ projectId: project.id, title, description, priority, assignedToId: assignedToId || null, reportedById: req.user.id });
  res.status(201).json({ status: 'success', data: { issue } });
});

// Update a project issue
exports.updateProjectIssue = catchAsync(async (req, res, next) => {
  const issue = await ProjectIssue.findOne({ where: { id: req.params.issueId, projectId: req.params.id } });
  if (!issue) return next(new AppError('Issue not found', 404));
  const updates = {};
  ['title','description','priority','status','assignedToId','resolutionNotes'].forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  await issue.update(updates);
  res.status(200).json({ status: 'success', data: { issue } });
});

// Add a project document (metadata only; file managed elsewhere)
exports.addProjectDocument = catchAsync(async (req, res, next) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));
  const { type, name, fileUrl, notes } = req.body;
  if (!type || !name || !fileUrl) return next(new AppError('type, name and fileUrl are required', 400));
  const doc = await ProjectDocument.create({ projectId: project.id, type, name, fileUrl, notes: notes || null, uploadedById: req.user.id });
  res.status(201).json({ status: 'success', data: { document: doc } });
});

// Update project stage
exports.updateProjectStage = catchAsync(async (req, res, next) => {
  const { stage, notes } = req.body;
  if (!stage) return next(new AppError('Stage is required', 400));

  const validStages = ['planning', 'permitting', 'scheduled', 'in_progress', 'inspection', 'completed'];
  if (!validStages.includes(stage)) return next(new AppError('Invalid stage', 400));

  const project = await Project.findByPk(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));

  await project.update({ stage, updatedById: req.user.id });

  if (notes) {
    await ProjectNote.create({ projectId: project.id, text: notes, createdById: req.user.id });
  }

  const updated = await Project.findByPk(project.id, {
    include: [{ model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email'] }]
  });
  res.status(200).json({ status: 'success', data: { project: updated } });
});

// Add equipment to project
exports.addProjectEquipment = catchAsync(async (req, res, next) => {
  const project = await Project.findByPk(req.params.id);
  
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Optionally check inventory by manufacturer/model
  if (req.body.manufacturer && req.body.model) {
    const inv = await Equipment.findOne({ where: { manufacturer: req.body.manufacturer, model: req.body.model } });
    if (inv && inv.inStock < req.body.quantity) {
      return next(new AppError('Insufficient equipment in stock', 400));
    }
    if (inv) {
      await inv.update({ inStock: inv.inStock - req.body.quantity });
    }
  }

  // Add equipment to project (denormalized fields)
  const projectEquipment = await ProjectEquipment.create({
    projectId: project.id,
    type: req.body.type,
    manufacturer: req.body.manufacturer,
    model: req.body.model,
    serialNumber: req.body.serialNumber || null,
    quantity: req.body.quantity,
    notes: req.body.notes || null
  });

  res.status(201).json({
    status: 'success',
    data: { projectEquipment }
  });
});

// Add payment to project
exports.addProjectPayment = catchAsync(async (req, res, next) => {
  const project = await Project.findByPk(req.params.id);
  
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  const payment = await ProjectPayment.create({ projectId: project.id, ...req.body });

  // Update project paid amount
  // No direct paid_amount field on Project; totals are computed in reports

  res.status(201).json({
    status: 'success',
    data: { payment }
  });
});

// Add expense to project
exports.addProjectExpense = catchAsync(async (req, res, next) => {
  const project = await Project.findByPk(req.params.id);
  
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  const expense = await ProjectExpense.create({ projectId: project.id, ...req.body, recordedById: req.user.id });

  // Update project total cost
  const totalExpenses = await ProjectExpense.sum('amount', { where: { projectId: project.id } });
  await project.update({ totalExpenses });

  res.status(201).json({
    status: 'success',
    data: { expense }
  });
});

// Get project statistics
exports.getProjectStats = catchAsync(async (req, res) => {
  const stats = await Project.findAll({
    attributes: [
      'status',
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      [db.sequelize.fn('SUM', db.sequelize.col('system_size')), 'totalSystemSize'],
      [db.sequelize.fn('AVG', db.sequelize.col('system_size')), 'avgSystemSize']
    ],
    group: ['status']
  });

  const totalProjects = await Project.count();
  const totalRevenue = await Project.sum('total_contract_value') || 0;
  const totalPaid = await ProjectPayment.sum('amount') || 0;

  res.status(200).json({
    status: 'success',
    data: {
      stats,
      summary: {
        totalProjects,
        totalRevenue,
        totalPaid,
        totalOutstanding: totalRevenue - totalPaid
      }
    }
  });
});

// Get projects by customer
exports.getProjectsByCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findByPk(req.params.customerId);
  
  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }

  const projects = await Project.findAll({
    where: { customerId: req.params.customerId },
    include: [
      { model: User, as: 'projectManager', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: { projects }
  });
});
