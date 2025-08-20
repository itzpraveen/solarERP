'use strict';

const db = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const { 
  Proposal, 
  Lead, 
  User, 
  ProposalFinancingOption,
  Project,
  Customer
} = db;

// Get all proposals with filtering and pagination
exports.getAllProposals = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
  const offset = (page - 1) * limit;

  // Build where clause
  const where = {};
  
  if (req.query.status) where.status = req.query.status;
  if (req.query.leadId) where.leadId = req.query.leadId;
  if (req.query.createdById) where.createdById = req.query.createdById;
  
  // Date range filtering
  if (req.query.startDate || req.query.endDate) {
    where.createdAt = {};
    if (req.query.startDate) {
      where.createdAt[Op.gte] = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      where.createdAt[Op.lte] = new Date(req.query.endDate);
    }
  }
  
  // Search functionality
  if (req.query.search) {
    const searchTerm = `%${req.query.search.toLowerCase()}%`;
    where[Op.or] = [
      db.sequelize.where(db.sequelize.fn('lower', db.sequelize.col('name')), { [Op.like]: searchTerm })
    ];
  }

  // Sort configuration
  const order = [];
  if (req.query.sort) {
    const sortField = req.query.sort.startsWith('-') ? req.query.sort.slice(1) : req.query.sort;
    const sortOrder = req.query.sort.startsWith('-') ? 'DESC' : 'ASC';
    order.push([sortField, sortOrder]);
  } else {
    order.push(['created_at', 'DESC']);
  }

  const { rows: proposals, count } = await Proposal.findAndCountAll({
    where,
    include: [
      { model: Lead, as: 'lead', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'status'] },
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ],
    order,
    limit,
    offset,
    distinct: true
  });

  res.status(200).json({
    status: 'success',
    results: proposals.length,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      totalResults: count
    },
    data: { proposals }
  });
});

// Get single proposal by ID
exports.getProposal = catchAsync(async (req, res, next) => {
  const proposal = await Proposal.findByPk(req.params.id, {
    include: [
      {
        model: Lead,
        as: 'lead'
      },
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: ProposalFinancingOption,
        as: 'financingOptions',
        separate: true,
        order: [['monthlyPayment', 'ASC']]
      }
    ]
  });

  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { proposal }
  });
});

// Create new proposal
exports.createProposal = catchAsync(async (req, res, next) => {
  // Validate lead exists
  const lead = await Lead.findByPk(req.body.leadId);
  if (!lead) {
    return next(new AppError('Lead not found', 404));
  }

  // Check if lead already has an active proposal
  const existingProposal = await Proposal.findOne({
    where: {
      leadId: req.body.leadId,
      status: ['draft', 'sent', 'viewed']
    }
  });

  if (existingProposal) {
    return next(new AppError('Lead already has an active proposal', 400));
  }

  // Create proposal (model hooks/validation enforce constraints)
  const proposal = await Proposal.create({
    ...req.body,
    createdById: req.user.id,
    status: 'draft'
  });

  // Create financing options if provided
  if (req.body.financingOptions && Array.isArray(req.body.financingOptions)) {
    for (const option of req.body.financingOptions) {
      await ProposalFinancingOption.create({ proposalId: proposal.id, ...option });
    }
  }

  // Update lead status
  await lead.update({ status: 'proposal' });

  // Fetch created proposal with associations
  const createdProposal = await Proposal.findByPk(proposal.id, {
    include: [
      { model: Lead, as: 'lead', attributes: ['id', 'firstName', 'lastName', 'email'] },
      {
        model: ProposalFinancingOption,
        as: 'financingOptions'
      }
    ]
  });

  res.status(201).json({
    status: 'success',
    data: { proposal: createdProposal }
  });
});

// Update proposal
exports.updateProposal = catchAsync(async (req, res, next) => {
  const proposal = await Proposal.findByPk(req.params.id);
  
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }

  // Don't allow updates to accepted or rejected proposals
  if (['accepted', 'rejected'].includes(proposal.status)) {
    return next(new AppError('Cannot update accepted or rejected proposals', 400));
  }

  // Update proposal
  await proposal.update({
    ...req.body,
    updatedById: req.user.id
  });

  // Fetch updated proposal with associations
  const updatedProposal = await Proposal.findByPk(proposal.id, {
    include: [
      { model: Lead, as: 'lead', attributes: ['id', 'firstName', 'lastName', 'email'] },
      {
        model: ProposalFinancingOption,
        as: 'financingOptions'
      }
    ]
  });

  res.status(200).json({
    status: 'success',
    data: { proposal: updatedProposal }
  });
});

// Delete proposal
exports.deleteProposal = catchAsync(async (req, res, next) => {
  const proposal = await Proposal.findByPk(req.params.id);
  
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }

  // Don't allow deletion of accepted proposals
  if (proposal.status === 'accepted') {
    return next(new AppError('Cannot delete accepted proposals', 400));
  }

  // Delete financing options first
  await ProposalFinancingOption.destroy({ where: { proposalId: proposal.id } });

  // Delete proposal
  await proposal.destroy();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Update proposal status
exports.updateProposalStatus = catchAsync(async (req, res, next) => {
  const { status, notes } = req.body;
  
  if (!status) {
    return next(new AppError('Status is required', 400));
  }

  const validStatuses = ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const proposal = await Proposal.findByPk(req.params.id, {
    include: [{ model: Lead, as: 'lead' }]
  });
  
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }

  // Update proposal status
  await proposal.update({ status, updatedById: req.user.id });

  // Update lead status based on proposal status
  if (status === 'accepted') {
    await proposal.lead.update({ status: 'won' });
    
    // Create customer from lead
    const lead = proposal.lead;
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
      createdById: req.user.id
    });

    // Create project from accepted proposal
    await Project.create({
      name: `Solar Installation - ${customer.firstName} ${customer.lastName}`,
      customerId: customer.id,
      proposalId: proposal.id,
      status: 'active',
      stage: 'planning',
      installStreet: lead.street,
      installCity: lead.city,
      installState: lead.state,
      installZipCode: lead.zipCode,
      installCountry: lead.country,
      systemSize: proposal.systemSize,
      panelCount: proposal.panelCount,
      panelType: proposal.panelType,
      inverterType: proposal.inverterType,
      includesBattery: proposal.includesBattery,
      batteryType: proposal.batteryType,
      batteryCount: proposal.batteryCount,
      totalContractValue: proposal.netCost || proposal.grossCost,
      totalExpenses: 0,
      createdById: req.user.id
    });
  } else if (status === 'rejected') {
    await proposal.lead.update({ status: 'lost' });
  }

  res.status(200).json({
    status: 'success',
    data: { proposal }
  });
});

// Send proposal to lead
exports.sendProposal = catchAsync(async (req, res, next) => {
  const proposal = await Proposal.findByPk(req.params.id, {
    include: [{ model: Lead, as: 'lead' }]
  });
  
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }

  if (proposal.status !== 'draft') {
    return next(new AppError('Only draft proposals can be sent', 400));
  }

  // Update proposal status
  await proposal.update({ status: 'sent', sentDate: new Date(), validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), updatedById: req.user.id });

  // TODO: Send email to lead with proposal PDF

  res.status(200).json({
    status: 'success',
    message: 'Proposal sent successfully',
    data: { proposal }
  });
});

// Duplicate proposal
exports.duplicateProposal = catchAsync(async (req, res, next) => {
  const originalProposal = await Proposal.findByPk(req.params.id, {
    include: [{ model: ProposalFinancingOption, as: 'financingOptions' }]
  });
  
  if (!originalProposal) {
    return next(new AppError('Proposal not found', 404));
  }

  // Generate new proposal number
  // Create duplicate proposal
  const newProposal = await Proposal.create({
    leadId: req.body.leadId || originalProposal.leadId,
    name: `${originalProposal.name} (Copy)`,
    systemSize: originalProposal.systemSize,
    panelCount: originalProposal.panelCount,
    panelType: originalProposal.panelType,
    inverterType: originalProposal.inverterType,
    includesBattery: originalProposal.includesBattery,
    batteryType: originalProposal.batteryType,
    batteryCount: originalProposal.batteryCount,
    yearlyProductionEstimate: originalProposal.yearlyProductionEstimate,
    firstYearSavings: originalProposal.firstYearSavings,
    twentyFiveYearSavings: originalProposal.twentyFiveYearSavings,
    grossCost: originalProposal.grossCost,
    federalTaxCredit: originalProposal.federalTaxCredit,
    stateTaxCredit: originalProposal.stateTaxCredit,
    utilityRebate: originalProposal.utilityRebate,
    otherIncentives: originalProposal.otherIncentives,
    netCost: originalProposal.netCost,
    designImages: originalProposal.designImages,
    notes: originalProposal.notes,
    status: 'draft',
    createdById: req.user.id,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  // Duplicate financing options
  if (originalProposal.financingOptions && originalProposal.financingOptions.length > 0) {
    for (const option of originalProposal.financingOptions) {
      await ProposalFinancingOption.create({
        proposalId: newProposal.id,
        type: option.type,
        termYears: option.termYears,
        downPayment: option.downPayment,
        apr: option.apr,
        monthlyPayment: option.monthlyPayment,
        totalCost: option.totalCost,
        selected: false
      });
    }
  }

  // Fetch new proposal with associations
  const duplicatedProposal = await Proposal.findByPk(newProposal.id, {
    include: [
      { model: Lead, as: 'lead', attributes: ['id', 'firstName', 'lastName', 'email'] },
      {
        model: ProposalFinancingOption,
        as: 'financingOptions'
      }
    ]
  });

  res.status(201).json({
    status: 'success',
    data: { proposal: duplicatedProposal }
  });
});

// Get proposal statistics
exports.getProposalStats = catchAsync(async (req, res) => {
  // Get proposals by status
  const byStatus = await Proposal.findAll({
    attributes: [
      'status',
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      [db.sequelize.fn('SUM', db.sequelize.col('gross_cost')), 'totalValue'],
      [db.sequelize.fn('AVG', db.sequelize.col('gross_cost')), 'avgValue']
    ],
    group: ['status']
  });

  // Get conversion rates
  const totalProposals = await Proposal.count();
  const acceptedProposals = await Proposal.count({ where: { status: 'accepted' } });
  const rejectedProposals = await Proposal.count({ where: { status: 'rejected' } });
  const conversionRate = totalProposals > 0 ? (acceptedProposals / totalProposals * 100).toFixed(2) : 0;

  // Get monthly trends
  const monthlyTrends = await Proposal.findAll({
    attributes: [
      [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at')), 'month'],
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      [db.sequelize.fn('SUM', db.sequelize.col('gross_cost')), 'totalValue']
    ],
    where: {
      created_at: {
        [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 6))
      }
    },
    group: [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at'))],
    order: [[db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at')), 'ASC']]
  });

  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        totalProposals,
        acceptedProposals,
        rejectedProposals,
        conversionRate: `${conversionRate}%`,
        totalPipelineValue: await Proposal.sum('grossCost', {
          where: { status: ['draft', 'sent', 'viewed'] }
        }) || 0
      },
      byStatus,
      monthlyTrends
    }
  });
});
