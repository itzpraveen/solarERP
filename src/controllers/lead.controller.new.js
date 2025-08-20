'use strict';

const leadService = require('../services/lead.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Get all leads
exports.getAllLeads = catchAsync(async (req, res) => {
  const result = await leadService.getAllLeads(req.query, req.user?.id);
  
  res.status(200).json({
    status: 'success',
    ...result
  });
});

// Get single lead
exports.getLead = catchAsync(async (req, res) => {
  const lead = await leadService.getLeadById(req.params.id);
  
  res.status(200).json({
    status: 'success',
    data: { lead }
  });
});

// Create lead
exports.createLead = catchAsync(async (req, res) => {
  const lead = await leadService.createLead(req.body, req.user.id);
  
  res.status(201).json({
    status: 'success',
    data: { lead }
  });
});

// Update lead
exports.updateLead = catchAsync(async (req, res) => {
  const lead = await leadService.updateLead(
    req.params.id,
    req.body,
    req.user.id
  );
  
  res.status(200).json({
    status: 'success',
    data: { lead }
  });
});

// Delete lead
exports.deleteLead = catchAsync(async (req, res) => {
  await leadService.delete(req.params.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Convert lead to customer
exports.convertToCustomer = catchAsync(async (req, res) => {
  const { proposalId } = req.body;
  
  if (!proposalId) {
    throw new AppError('Proposal ID is required', 400);
  }
  
  const result = await leadService.convertToCustomer(
    req.params.id,
    proposalId,
    req.user.id
  );
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});

// Add lead note (accepts body.text)
exports.addLeadNote = catchAsync(async (req, res) => {
  const content = req.body.text || req.body.content;

  if (!content) {
    throw new AppError('Note text is required', 400);
  }

  const note = await leadService.addNote(
    req.params.id,
    content,
    req.user.id
  );

  res.status(201).json({
    status: 'success',
    data: { note }
  });
});

// Add lead interaction
exports.addLeadInteraction = catchAsync(async (req, res) => {
  const interaction = await leadService.addInteraction(
    req.params.id,
    req.body,
    req.user.id
  );
  
  res.status(201).json({
    status: 'success',
    data: { interaction }
  });
});

// Assign lead to a user
exports.assignLead = catchAsync(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    throw new AppError('User ID is required', 400);
  }

  const lead = await leadService.updateLead(
    req.params.id,
    { assignedToId: userId },
    req.user.id
  );

  res.status(200).json({
    status: 'success',
    data: { lead }
  });
});

// Update lead status
exports.updateLeadStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!status) {
    throw new AppError('Status is required', 400);
  }

  const lead = await leadService.updateLead(
    req.params.id,
    { status },
    req.user.id
  );

  res.status(200).json({
    status: 'success',
    data: { lead }
  });
});

// Get lead statistics
exports.getLeadStats = catchAsync(async (req, res) => {
  const stats = await leadService.getStatistics(req.query);
  
  res.status(200).json({
    status: 'success',
    data: { stats }
  });
});

// Bulk assign leads
exports.bulkAssignLeads = catchAsync(async (req, res) => {
  const { leadIds, assignToUserId } = req.body;
  
  if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
    throw new AppError('Lead IDs array is required', 400);
  }
  
  if (!assignToUserId) {
    throw new AppError('Assign to user ID is required', 400);
  }
  
  const result = await leadService.bulkAssign(
    leadIds,
    assignToUserId,
    req.user.id
  );
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});
