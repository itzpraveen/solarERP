const Customer = require('../models/customer.model');
const Lead = require('../models/lead.model');
const Proposal = require('../models/proposal.model');
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

// Get all customers with filtering, sorting, and pagination
exports.getAllCustomers = catchAsync(async (req, res, next) => {
  // 1) Build safe query with sanitization and soft delete filtering
  const sanitizedQuery = buildSafeQuery(req.query, ['page', 'sort', 'limit', 'fields'], true);
  const advancedQuery = buildAdvancedFilter(sanitizedQuery);
  
  let query = Customer.find(advancedQuery);
  
  // 2) Safe sorting with allowed fields
  const allowedSortFields = ['firstName', 'lastName', 'email', 'phone', 'customerSince', 'createdAt'];
  const sortBy = sanitizeSort(req.query.sort, allowedSortFields, '-customerSince');
  query = query.sort(sortBy);
  
  // 3) Safe field limiting
  const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'customerSince', 'originalLead', 'acceptedProposal', 'projects'];
  const fields = sanitizeFields(req.query.fields, allowedFields);
  query = query.select(fields);
  
  // 4) Safe pagination with limits
  const { page, limit, skip } = sanitizePagination(req.query);
  query = query.skip(skip).limit(limit);
  
  // EXECUTE QUERY
  const customers = await query;
  const total = await Customer.countDocuments(advancedQuery);
  
  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: customers.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      customers
    }
  });
});

// Get customer by ID
exports.getCustomer = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid customer ID format', 400));
  }
  
  const customer = await Customer.findOne({ _id: req.params.id, active: { $ne: false } })
    .populate({
      path: 'originalLead',
      select: 'status source category'
    })
    .populate({
      path: 'acceptedProposal',
      select: 'name systemSize panelCount panelType'
    })
    .populate({
      path: 'projects',
      select: 'name status stage',
      match: { active: { $ne: false } }
    })
    .populate({
      path: 'notes.createdBy',
      select: 'firstName lastName email'
    });
  
  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      customer
    }
  });
});

// Create new customer
exports.createCustomer = catchAsync(async (req, res, next) => {
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
  
  // Set the creator to the current user
  sanitizedBody.createdBy = req.user.id;
  
  // Verify that the lead exists if provided
  if (sanitizedBody.originalLead) {
    if (!isValidObjectId(sanitizedBody.originalLead)) {
      return next(new AppError('Invalid lead ID format', 400));
    }
    
    const lead = await Lead.findOne({ _id: sanitizedBody.originalLead, active: { $ne: false } });
    if (!lead) {
      return next(new AppError('Lead not found', 404));
    }
  }
  
  // Verify that the proposal exists if provided
  if (sanitizedBody.acceptedProposal) {
    if (!isValidObjectId(sanitizedBody.acceptedProposal)) {
      return next(new AppError('Invalid proposal ID format', 400));
    }
    
    const proposal = await Proposal.findOne({ _id: sanitizedBody.acceptedProposal, active: { $ne: false } });
    if (!proposal) {
      return next(new AppError('Proposal not found', 404));
    }
  }
  
  const newCustomer = await Customer.create(sanitizedBody);
  
  res.status(201).json({
    status: 'success',
    data: {
      customer: newCustomer
    }
  });
});

// Update customer
exports.updateCustomer = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid customer ID format', 400));
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
  
  // Validate referenced IDs if provided
  if (sanitizedBody.originalLead && !isValidObjectId(sanitizedBody.originalLead)) {
    return next(new AppError('Invalid lead ID format', 400));
  }
  
  if (sanitizedBody.acceptedProposal && !isValidObjectId(sanitizedBody.acceptedProposal)) {
    return next(new AppError('Invalid proposal ID format', 400));
  }
  
  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    sanitizedBody,
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      customer
    }
  });
});

// Delete customer (soft delete)
exports.deleteCustomer = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid customer ID format', 400));
  }
  
  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { active: false },
    { new: true }
  );
  
  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Add note to customer
exports.addCustomerNote = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid customer ID format', 400));
  }
  
  // Validate required fields
  if (!req.body.text || req.body.text.trim() === '') {
    return next(new AppError('Note text is required', 400));
  }
  
  // Sanitize note body
  const sanitizedNote = sanitizeBody(req.body);
  sanitizedNote.createdBy = req.user.id;
  
  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { $push: { notes: sanitizedNote } },
    { new: true, runValidators: true }
  );
  
  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      customer
    }
  });
});

// Convert lead to customer
exports.convertLeadToCustomer = catchAsync(async (req, res, next) => {
  // Validate lead ObjectId
  if (!isValidObjectId(req.params.leadId)) {
    return next(new AppError('Invalid lead ID format', 400));
  }
  
  // Check if lead exists and is active
  const lead = await Lead.findOne({ _id: req.params.leadId, active: { $ne: false } });
  if (!lead) {
    return next(new AppError('Lead not found', 404));
  }
  
  // Check if proposal exists if provided
  let proposal;
  if (req.body.proposalId) {
    if (!isValidObjectId(req.body.proposalId)) {
      return next(new AppError('Invalid proposal ID format', 400));
    }
    
    proposal = await Proposal.findOne({ _id: req.body.proposalId, active: { $ne: false } });
    if (!proposal) {
      return next(new AppError('Proposal not found', 404));
    }
    
    // Check if proposal belongs to the lead
    if (proposal.lead.toString() !== lead._id.toString()) {
      return next(new AppError('Proposal does not belong to this lead', 400));
    }
    
    // Update proposal status to accepted if not already
    if (proposal.status !== 'accepted') {
      await Proposal.findByIdAndUpdate(proposal._id, { status: 'accepted' });
    }
  }
  
  // Create new customer from lead data
  const customerData = {
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    address: lead.address,
    originalLead: lead._id,
    acceptedProposal: proposal ? proposal._id : undefined,
    createdBy: req.user.id
  };
  
  const newCustomer = await Customer.create(customerData);
  
  // Update lead status to won
  await Lead.findByIdAndUpdate(lead._id, { status: 'won' });
  
  res.status(201).json({
    status: 'success',
    data: {
      customer: newCustomer
    }
  });
});