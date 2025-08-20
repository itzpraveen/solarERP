'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const { ServiceRequest, ServiceRequestNote, Customer, Project, User } = db;

// List service requests with filtering and pagination
exports.getServiceRequests = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
  const offset = (page - 1) * limit;

  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.priority) where.priority = req.query.priority;
  if (req.query.requestType) where.requestType = req.query.requestType;
  if (req.query.customerId) where.customerId = req.query.customerId;
  if (req.query.projectId) where.projectId = req.query.projectId;
  if (req.query.assignedToId) where.assignedToId = req.query.assignedToId;
  if (req.query.search) {
    const like = `%${req.query.search.toLowerCase()}%`;
    where[Op.or] = [
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('title')), { [Op.like]: like }),
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('description')), { [Op.like]: like })
    ];
  }

  const order = [];
  if (req.query.sort) {
    const isDesc = req.query.sort.startsWith('-');
    const field = isDesc ? req.query.sort.slice(1) : req.query.sort;
    order.push([field, isDesc ? 'DESC' : 'ASC']);
  } else {
    order.push(['created_at', 'DESC']);
  }

  const { rows, count } = await ServiceRequest.findAndCountAll({
    where,
    include: [
      { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Project, as: 'project', attributes: ['id', 'name', 'status'] },
      { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName'] }
    ],
    order,
    limit,
    offset,
    distinct: true
  });

  res.status(200).json({ status: 'success', results: rows.length, total: count, page, pages: Math.ceil(count / limit), data: { serviceRequests: rows } });
});

// Create a new service request
exports.createServiceRequest = catchAsync(async (req, res, next) => {
  const { title, description, requestType, priority = 'medium', customerId, projectId, assignedToId, scheduledDate } = req.body;
  if (!title || !description || !requestType || !customerId) {
    return next(new AppError('Missing required fields', 400));
  }

  // Validate references
  const customer = await Customer.findByPk(customerId);
  if (!customer) return next(new AppError('Customer not found', 404));
  if (projectId) {
    const project = await Project.findByPk(projectId);
    if (!project) return next(new AppError('Project not found', 404));
  }

  const sr = await ServiceRequest.create({
    title,
    description,
    requestType,
    priority,
    status: 'new',
    customerId,
    projectId: projectId || null,
    assignedToId: assignedToId || null,
    scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
    createdById: req.user.id
  });

  res.status(201).json({ status: 'success', data: { serviceRequest: sr } });
});

// Get a single service request by ID
exports.getServiceRequest = catchAsync(async (req, res, next) => {
  const sr = await ServiceRequest.findByPk(req.params.id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: Project, as: 'project' },
      { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName'] },
      { model: ServiceRequestNote, as: 'notes', include: [{ model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] }] }
    ]
  });
  if (!sr) return next(new AppError('Service request not found', 404));
  res.status(200).json({ status: 'success', data: { serviceRequest: sr } });
});

// Update a service request
exports.updateServiceRequest = catchAsync(async (req, res, next) => {
  const sr = await ServiceRequest.findByPk(req.params.id);
  if (!sr) return next(new AppError('Service request not found', 404));
  const updatable = ['title','description','requestType','priority','status','customerId','projectId','assignedToId','scheduledDate','completionDate'];
  const updates = {};
  updatable.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  if (updates.scheduledDate) updates.scheduledDate = new Date(updates.scheduledDate);
  if (updates.completionDate) updates.completionDate = new Date(updates.completionDate);
  updates.updatedById = req.user.id;
  await sr.update(updates);
  res.status(200).json({ status: 'success', data: { serviceRequest: sr } });
});

// Delete a service request (hard delete)
exports.deleteServiceRequest = catchAsync(async (req, res, next) => {
  const sr = await ServiceRequest.findByPk(req.params.id);
  if (!sr) return next(new AppError('Service request not found', 404));
  await sr.destroy();
  res.status(204).json({ status: 'success', data: null });
});

// Add a note to a service request
exports.addNote = catchAsync(async (req, res, next) => {
  const sr = await ServiceRequest.findByPk(req.params.id);
  if (!sr) return next(new AppError('Service request not found', 404));
  const text = (req.body.text || '').trim();
  if (!text) return next(new AppError('Note text is required', 400));
  const note = await ServiceRequestNote.create({ serviceRequestId: sr.id, text, createdById: req.user.id });
  res.status(201).json({ status: 'success', data: { note } });
});

// Assign technician to a service request
exports.assignTechnician = catchAsync(async (req, res, next) => {
  const sr = await ServiceRequest.findByPk(req.params.id);
  if (!sr) return next(new AppError('Service request not found', 404));
  const assignedToId = req.body.assignedToId;
  if (!assignedToId) return next(new AppError('assignedToId is required', 400));
  await sr.update({ assignedToId, status: sr.status === 'new' ? 'assigned' : sr.status, updatedById: req.user.id });
  res.status(200).json({ status: 'success', data: { serviceRequest: sr } });
});

// Update status
exports.updateStatus = catchAsync(async (req, res, next) => {
  const sr = await ServiceRequest.findByPk(req.params.id);
  if (!sr) return next(new AppError('Service request not found', 404));
  const status = req.body.status;
  if (!status) return next(new AppError('Status is required', 400));
  await sr.update({ status, updatedById: req.user.id });
  res.status(200).json({ status: 'success', data: { serviceRequest: sr } });
});

// Schedule service
exports.scheduleService = catchAsync(async (req, res, next) => {
  const sr = await ServiceRequest.findByPk(req.params.id);
  if (!sr) return next(new AppError('Service request not found', 404));
  if (!req.body.scheduledDate) return next(new AppError('scheduledDate is required', 400));
  await sr.update({ scheduledDate: new Date(req.body.scheduledDate), updatedById: req.user.id });
  res.status(200).json({ status: 'success', data: { serviceRequest: sr } });
});

// Complete service
exports.completeService = catchAsync(async (req, res, next) => {
  const sr = await ServiceRequest.findByPk(req.params.id);
  if (!sr) return next(new AppError('Service request not found', 404));
  await sr.update({ status: 'completed', completionDate: new Date(), updatedById: req.user.id });
  res.status(200).json({ status: 'success', data: { serviceRequest: sr } });
});

// Get service requests for a customer
exports.getCustomerServiceRequests = catchAsync(async (req, res) => {
  const list = await ServiceRequest.findAll({ where: { customerId: req.params.customerId }, order: [['created_at', 'DESC']] });
  res.status(200).json({ status: 'success', results: list.length, data: { serviceRequests: list } });
});

// Get service requests for a project
exports.getProjectServiceRequests = catchAsync(async (req, res) => {
  const list = await ServiceRequest.findAll({ where: { projectId: req.params.projectId }, order: [['created_at', 'DESC']] });
  res.status(200).json({ status: 'success', results: list.length, data: { serviceRequests: list } });
});

