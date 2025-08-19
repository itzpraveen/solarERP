const Lead = require('../models/lead.model');
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
  isValidEmail,
  isValidPhone,
  createErrorResponse
} = require('../../utils/validationHelper');

// Get all leads with filtering, sorting, and pagination
exports.getAllLeads = catchAsync(async (req, res, next) => {
  // 1) Build safe query with sanitization and soft delete filtering
  const sanitizedQuery = buildSafeQuery(req.query, ['page', 'sort', 'limit', 'fields'], true);
  const advancedQuery = buildAdvancedFilter(sanitizedQuery);
  
  let query = Lead.find(advancedQuery);
  
  // 2) Safe sorting with allowed fields
  const allowedSortFields = ['firstName', 'lastName', 'email', 'phone', 'status', 'source', 'createdAt', 'score'];
  const sortBy = sanitizeSort(req.query.sort, allowedSortFields, '-createdAt');
  query = query.sort(sortBy);
  
  // 3) Safe field limiting
  const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'status', 'source', 'category', 'score', 'assignedTo', 'createdAt'];
  const fields = sanitizeFields(req.query.fields, allowedFields);
  query = query.select(fields);
  
  // 4) Safe pagination with limits
  const { page, limit, skip } = sanitizePagination(req.query);
  query = query.skip(skip).limit(limit);
  
  // EXECUTE QUERY
  const leads = await query;
  const total = await Lead.countDocuments(advancedQuery);
  
  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: leads.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      leads
    }
  });
});

// Get lead by ID
exports.getLead = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid lead ID format', 400));
  }
  
  const lead = await Lead.findOne({ _id: req.params.id, active: { $ne: false } })
    .populate({
      path: 'notes.createdBy interactions.conductedBy',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'proposals',
      match: { active: { $ne: false } }
    });
  
  if (!lead) {
    return next(new AppError('Lead not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      lead
    }
  });
});

// Create new lead
exports.createLead = catchAsync(async (req, res, next) => {
  // Validate required fields
  const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
  const missingFields = validateRequiredFields(req.body, requiredFields);
  
  if (missingFields.length > 0) {
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // Sanitize input body
  const sanitizedBody = sanitizeBody(req.body);
  
  // Validate email format
  if (!isValidEmail(sanitizedBody.email)) {
    return next(new AppError('Invalid email format', 400));
  }
  
  // Validate phone format
  if (!isValidPhone(sanitizedBody.phone)) {
    return next(new AppError('Invalid phone format', 400));
  }
  
  // Validate score if provided
  if (sanitizedBody.score && (isNaN(sanitizedBody.score) || sanitizedBody.score < 0 || sanitizedBody.score > 100)) {
    return next(new AppError('Score must be a number between 0 and 100', 400));
  }
  
  // Set the creator to the current user
  sanitizedBody.createdBy = req.user.id;
  
  const newLead = await Lead.create(sanitizedBody);
  
  res.status(201).json({
    status: 'success',
    data: {
      lead: newLead
    }
  });
});

// Update lead
exports.updateLead = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid lead ID format', 400));
  }
  
  // Sanitize input body
  const sanitizedBody = sanitizeBody(req.body);
  
  // Remove fields that shouldn't be updated
  delete sanitizedBody.createdBy;
  delete sanitizedBody.createdAt;
  delete sanitizedBody._id;
  
  // Validate email if provided
  if (sanitizedBody.email && !isValidEmail(sanitizedBody.email)) {
    return next(new AppError('Invalid email format', 400));
  }
  
  // Validate phone if provided
  if (sanitizedBody.phone && !isValidPhone(sanitizedBody.phone)) {
    return next(new AppError('Invalid phone format', 400));
  }
  
  // Validate score if provided
  if (sanitizedBody.score && (isNaN(sanitizedBody.score) || sanitizedBody.score < 0 || sanitizedBody.score > 100)) {
    return next(new AppError('Score must be a number between 0 and 100', 400));
  }
  
  // Validate referenced IDs if provided
  if (sanitizedBody.assignedTo && !isValidObjectId(sanitizedBody.assignedTo)) {
    return next(new AppError('Invalid assigned user ID format', 400));
  }
  
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    sanitizedBody,
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!lead) {
    return next(new AppError('Lead not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      lead
    }
  });
});

// Delete lead (soft delete)
exports.deleteLead = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid lead ID format', 400));
  }
  
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { active: false },
    { new: true }
  );
  
  if (!lead) {
    return next(new AppError('Lead not found', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Add note to lead
exports.addLeadNote = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid lead ID format', 400));
  }
  
  // Validate required fields
  if (!req.body.text || req.body.text.trim() === '') {
    return next(new AppError('Note text is required', 400));
  }
  
  // Sanitize note body
  const sanitizedNote = sanitizeBody(req.body);
  sanitizedNote.createdBy = req.user.id;
  
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { $push: { notes: sanitizedNote } },
    { new: true, runValidators: true }
  );
  
  if (!lead) {
    return next(new AppError('Lead not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      lead
    }
  });
});

// Add interaction to lead
exports.addLeadInteraction = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid lead ID format', 400));
  }
  
  // Validate required fields
  const requiredFields = ['type', 'description'];
  const missingFields = validateRequiredFields(req.body, requiredFields);
  
  if (missingFields.length > 0) {
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // Sanitize interaction body
  const sanitizedInteraction = sanitizeBody(req.body);
  sanitizedInteraction.conductedBy = req.user.id;
  
  // Validate interaction type
  const validTypes = ['call', 'email', 'meeting', 'site-visit', 'proposal', 'follow-up'];
  if (!validTypes.includes(sanitizedInteraction.type)) {
    return next(new AppError('Invalid interaction type', 400));
  }
  
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { $push: { interactions: sanitizedInteraction } },
    { new: true, runValidators: true }
  );
  
  if (!lead) {
    return next(new AppError('Lead not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      lead
    }
  });
});

// Assign lead to user
exports.assignLead = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid lead ID format', 400));
  }
  
  // Validate user ID
  if (!req.body.userId || !isValidObjectId(req.body.userId)) {
    return next(new AppError('Valid user ID is required', 400));
  }
  
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { assignedTo: req.body.userId },
    { new: true, runValidators: true }
  );
  
  if (!lead) {
    return next(new AppError('Lead not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      lead
    }
  });
});

// Update lead status
exports.updateLeadStatus = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid lead ID format', 400));
  }
  
  // Validate status field
  if (!req.body.status || req.body.status.trim() === '') {
    return next(new AppError('Status is required', 400));
  }
  
  const validStatuses = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'nurturing'];
  if (!validStatuses.includes(req.body.status)) {
    return next(new AppError('Invalid status value', 400));
  }
  
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  
  if (!lead) {
    return next(new AppError('Lead not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      lead
    }
  });
});

// Get lead stats
exports.getLeadStats = catchAsync(async (req, res, next) => {
  const stats = await Lead.aggregate([
    {
      $match: { active: true }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgElectricBill: { $avg: '$monthlyElectricBill' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});