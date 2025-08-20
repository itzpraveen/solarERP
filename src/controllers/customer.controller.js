'use strict';

const db = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const { Customer, Lead, Proposal, User, CustomerNote, Project } = db;

// List customers with basic pagination
exports.getAllCustomers = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
  const offset = (page - 1) * limit;

  const where = {};
  if (req.query.search) {
    const q = `%${req.query.search.toLowerCase()}%`;
    where[db.Sequelize.Op.or] = [
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('first_name')), { [db.Sequelize.Op.like]: q }),
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('last_name')), { [db.Sequelize.Op.like]: q }),
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('email')), { [db.Sequelize.Op.like]: q }),
    ];
  }

  const { rows: customers, count } = await Customer.findAndCountAll({ 
    where, 
    order: [['created_at', 'DESC']], 
    limit, 
    offset,
    distinct: true 
  });
  
  res.status(200).json({ 
    status: 'success', 
    results: customers.length, 
    total: count, 
    page, 
    pages: Math.ceil(count / limit), 
    data: { customers } 
  });
});

// Get customer by id
exports.getCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findByPk(req.params.id, {
    include: [
      { model: Lead, as: 'originalLead', attributes: ['id', 'status', 'source', 'category'] },
      { model: Proposal, as: 'acceptedProposal', attributes: ['id', 'name', 'systemSize', 'panelCount', 'panelType'] },
      { model: Project, as: 'projects', attributes: ['id', 'name', 'status', 'stage'], where: {}, required: false },
      { model: CustomerNote, as: 'notes', include: [{ model: User, as: 'createdBy', attributes: ['id','firstName','lastName'] }] },
    ]
  });
  if (!customer) return next(new AppError('Customer not found', 404));
  res.status(200).json({ status: 'success', data: { customer } });
});

// Create new customer
exports.createCustomer = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, phone, street, city, state, zipCode, country, originalLeadId, acceptedProposalId, communicationPreference } = req.body;
  if (!firstName || !lastName || !email || !phone || !street || !city || !state || !zipCode || !originalLeadId) {
    return next(new AppError('Missing required fields', 400));
  }
  const lead = await Lead.findByPk(originalLeadId);
  if (!lead) return next(new AppError('Lead not found', 404));
  let proposal = null;
  if (acceptedProposalId) {
    proposal = await Proposal.findByPk(acceptedProposalId);
    if (!proposal) return next(new AppError('Proposal not found', 404));
  }

  const customer = await Customer.create({
    firstName, lastName, email, phone,
    street, city, state, zipCode, country,
    originalLeadId,
    acceptedProposalId: proposal ? proposal.id : null,
    communicationPreference: communicationPreference || 'email',
    createdById: req.user.id
  });

  res.status(201).json({ status: 'success', data: { customer } });
});

// Update customer
exports.updateCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) return next(new AppError('Customer not found', 404));
  const updatable = ['firstName','lastName','email','phone','street','city','state','zipCode','country','acceptedProposalId','communicationPreference'];
  const updates = {};
  updatable.forEach(k => { if (k in req.body) updates[k] = req.body[k]; });
  if (updates.acceptedProposalId) {
    const p = await Proposal.findByPk(updates.acceptedProposalId);
    if (!p) return next(new AppError('Proposal not found', 404));
  }
  await customer.update(updates);
  res.status(200).json({ status: 'success', data: { customer } });
});

// Soft delete customer
exports.deleteCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) return next(new AppError('Customer not found', 404));
  await customer.update({ active: false });
  res.status(204).json({ status: 'success', data: null });
});

// Add customer note
exports.addCustomerNote = catchAsync(async (req, res, next) => {
  if (!req.body.text || !req.body.text.trim()) return next(new AppError('Note text is required', 400));
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) return next(new AppError('Customer not found', 404));
  const note = await CustomerNote.create({ customerId: customer.id, text: req.body.text, createdById: req.user.id });
  res.status(201).json({ status: 'success', data: { note } });
});

// Convert lead to customer
exports.convertLeadToCustomer = catchAsync(async (req, res, next) => {
  const { leadId } = req.params;
  const { proposalId } = req.body || {};
  const lead = await Lead.findByPk(leadId);
  if (!lead) return next(new AppError('Lead not found', 404));
  let proposal = null;
  if (proposalId) {
    proposal = await Proposal.findByPk(proposalId);
    if (!proposal) return next(new AppError('Proposal not found', 404));
  }

  const customer = await Customer.create({
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    street: lead.street,
    city: lead.city,
    state: lead.state,
    zipCode: lead.zipCode,
    country: lead.country,
    originalLeadId: lead.id,
    acceptedProposalId: proposal ? proposal.id : null,
    createdById: req.user.id
  });

  res.status(201).json({ status: 'success', data: { customer } });
});
