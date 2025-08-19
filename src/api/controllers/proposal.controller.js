const Proposal = require('../models/proposal.model');
const Lead = require('../models/lead.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const sendEmail = require('../../utils/email');
const {
  sanitizePagination,
  sanitizeSort,
  sanitizeFields,
  buildSafeQuery,
  buildAdvancedFilter,
  validateRequiredFields,
  sanitizeBody,
  isValidObjectId,
  isValidEmail,
  createErrorResponse
} = require('../../utils/validationHelper');

// Get all proposals with filtering, sorting, and pagination
exports.getAllProposals = catchAsync(async (req, res, next) => {
  // 1) Build safe query with sanitization and soft delete filtering
  const sanitizedQuery = buildSafeQuery(req.query, ['page', 'sort', 'limit', 'fields'], true);
  const advancedQuery = buildAdvancedFilter(sanitizedQuery);
  
  let query = Proposal.find(advancedQuery);
  
  // 2) Safe sorting with allowed fields
  const allowedSortFields = ['name', 'status', 'systemSize', 'createdAt', 'sentDate', 'validUntil'];
  const sortBy = sanitizeSort(req.query.sort, allowedSortFields, '-createdAt');
  query = query.sort(sortBy);
  
  // 3) Safe field limiting
  const allowedFields = ['name', 'lead', 'status', 'systemSize', 'panelCount', 'panelType', 'pricing', 'createdAt', 'sentDate', 'validUntil'];
  const fields = sanitizeFields(req.query.fields, allowedFields);
  query = query.select(fields);
  
  // 4) Safe pagination with limits
  const { page, limit, skip } = sanitizePagination(req.query);
  query = query.skip(skip).limit(limit);
  
  // EXECUTE QUERY
  const proposals = await query;
  const total = await Proposal.countDocuments(advancedQuery);
  
  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: proposals.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      proposals
    }
  });
});

// Get proposal by ID
exports.getProposal = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid proposal ID format', 400));
  }
  
  const proposal = await Proposal.findOne({ _id: req.params.id, active: { $ne: false } });
  
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      proposal
    }
  });
});

// Create new proposal
exports.createProposal = catchAsync(async (req, res, next) => {
  // Validate required fields
  const requiredFields = ['name', 'lead', 'systemSize', 'panelCount'];
  const missingFields = validateRequiredFields(req.body, requiredFields);
  
  if (missingFields.length > 0) {
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // Sanitize input body
  const sanitizedBody = sanitizeBody(req.body);
  
  // Validate lead ObjectId
  if (!isValidObjectId(sanitizedBody.lead)) {
    return next(new AppError('Invalid lead ID format', 400));
  }
  
  // Set the creator to the current user
  sanitizedBody.createdBy = req.user.id;
  
  // Verify that the lead exists and is active
  const lead = await Lead.findOne({ _id: sanitizedBody.lead, active: { $ne: false } });
  if (!lead) {
    return next(new AppError('Lead not found', 404));
  }
  
  // Validate system size and panel count are positive numbers
  if (isNaN(sanitizedBody.systemSize) || sanitizedBody.systemSize <= 0) {
    return next(new AppError('System size must be a positive number', 400));
  }
  
  if (isNaN(sanitizedBody.panelCount) || sanitizedBody.panelCount <= 0) {
    return next(new AppError('Panel count must be a positive number', 400));
  }
  
  const newProposal = await Proposal.create(sanitizedBody);
  
  // Update lead status to proposal if it's not already in a later stage
  if (['new', 'contacted', 'qualified'].includes(lead.status)) {
    await Lead.findByIdAndUpdate(lead._id, { status: 'proposal' });
  }
  
  res.status(201).json({
    status: 'success',
    data: {
      proposal: newProposal
    }
  });
});

// Update proposal
exports.updateProposal = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid proposal ID format', 400));
  }
  
  // Sanitize input body
  const sanitizedBody = sanitizeBody(req.body);
  
  // Remove fields that shouldn't be updated
  delete sanitizedBody.createdBy;
  delete sanitizedBody.createdAt;
  delete sanitizedBody._id;
  
  // Validate numeric fields if provided
  if (sanitizedBody.systemSize && (isNaN(sanitizedBody.systemSize) || sanitizedBody.systemSize <= 0)) {
    return next(new AppError('System size must be a positive number', 400));
  }
  
  if (sanitizedBody.panelCount && (isNaN(sanitizedBody.panelCount) || sanitizedBody.panelCount <= 0)) {
    return next(new AppError('Panel count must be a positive number', 400));
  }
  
  // Validate referenced IDs if provided
  if (sanitizedBody.lead && !isValidObjectId(sanitizedBody.lead)) {
    return next(new AppError('Invalid lead ID format', 400));
  }
  
  const proposal = await Proposal.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    sanitizedBody,
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      proposal
    }
  });
});

// Delete proposal (soft delete)
exports.deleteProposal = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid proposal ID format', 400));
  }
  
  const proposal = await Proposal.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { active: false },
    { new: true }
  );
  
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Update proposal status
exports.updateProposalStatus = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid proposal ID format', 400));
  }
  
  // Validate status field
  if (!req.body.status || req.body.status.trim() === '') {
    return next(new AppError('Status is required', 400));
  }
  
  const validStatuses = ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'];
  if (!validStatuses.includes(req.body.status)) {
    return next(new AppError('Invalid status value', 400));
  }
  
  const proposal = await Proposal.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }
  
  // If proposal is accepted or rejected, update lead status
  if (req.body.status === 'accepted') {
    await Lead.findByIdAndUpdate(proposal.lead._id, { status: 'won' });
  } else if (req.body.status === 'rejected') {
    await Lead.findByIdAndUpdate(proposal.lead._id, { status: 'lost' });
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      proposal
    }
  });
});

// Send proposal via email
exports.sendProposal = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid proposal ID format', 400));
  }
  
  const proposal = await Proposal.findOne({ _id: req.params.id, active: { $ne: false } });
  
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }
  
  // Check if proposal is in a state where it can be sent
  if (!['draft', 'viewed'].includes(proposal.status)) {
    return next(new AppError('Proposal cannot be sent in its current status', 400));
  }
  
  // Update status to sent
  proposal.status = 'sent';
  proposal.sentDate = Date.now();
  await proposal.save();
  
  // Get full lead information
  const lead = await Lead.findOne({ _id: proposal.lead._id, active: { $ne: false } });
  
  if (!lead) {
    return next(new AppError('Associated lead not found', 404));
  }
  
  // Validate lead email
  if (!lead.email || !isValidEmail(lead.email)) {
    return next(new AppError('Lead does not have a valid email address', 400));
  }
  
  // Create view link with tracking capability
  const viewLink = `${req.protocol}://${req.get('host')}/proposals/view/${proposal._id}`;
  
  try {
    // Send email to customer
    await sendEmail({
      email: lead.email,
      subject: `Your Solar Proposal: ${proposal.name}`,
      message: `Dear ${lead.firstName} ${lead.lastName},\n\nThank you for your interest in our solar solutions. We're excited to share your custom proposal with you.\n\nYou can view your proposal at: ${viewLink}\n\nThis proposal is valid until ${new Date(proposal.validUntil).toLocaleDateString()}.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nYour Solar Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Solar Proposal is Ready</h2>
          <p>Dear ${lead.firstName} ${lead.lastName},</p>
          <p>Thank you for your interest in our solar solutions. We're excited to share your custom proposal with you.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${viewLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Proposal</a>
          </div>
          <p>This proposal includes:</p>
          <ul>
            <li>${proposal.systemSize}kW solar system with ${proposal.panelCount} ${proposal.panelType} panels</li>
            <li>Estimated annual production of ${proposal.yearlyProductionEstimate ? proposal.yearlyProductionEstimate.toLocaleString() : 'TBD'} kWh</li>
            <li>Potential 25-year savings of $${proposal.estimatedSavings && proposal.estimatedSavings.twentyFiveYear ? proposal.estimatedSavings.twentyFiveYear.toLocaleString() : 'TBD'}</li>
          </ul>
          <p>This proposal is valid until <strong>${new Date(proposal.validUntil).toLocaleDateString()}</strong>.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>Your Solar Team</p>
        </div>
      `
    });
  } catch (error) {
    // Revert proposal status if email fails
    proposal.status = 'draft';
    proposal.sentDate = undefined;
    await proposal.save();
    
    return next(new AppError('Failed to send email', 500));
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Proposal sent successfully',
    data: {
      proposal
    }
  });
});

// Track proposal view
exports.trackProposalView = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid proposal ID format', 400));
  }
  
  const proposal = await Proposal.findOne({ _id: req.params.id, active: { $ne: false } });
  
  if (!proposal) {
    return next(new AppError('Proposal not found', 404));
  }
  
  // Only update to viewed if it's in sent status
  if (proposal.status === 'sent') {
    proposal.status = 'viewed';
    proposal.viewedDate = Date.now();
    await proposal.save();
  }
  
  // Don't send proposal data, just success status
  res.status(200).json({
    status: 'success'
  });
});