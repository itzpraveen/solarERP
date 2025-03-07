const Customer = require('../models/customer.model');
const Lead = require('../models/lead.model');
const Proposal = require('../models/proposal.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

// Get all customers with filtering, sorting, and pagination
exports.getAllCustomers = catchAsync(async (req, res, next) => {
  // BUILD QUERY
  // 1) Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);
  
  // 2) Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  
  let query = Customer.find(JSON.parse(queryStr));
  
  // 3) Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-customerSince');
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
  const customers = await query;
  
  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: customers.length,
    data: {
      customers
    }
  });
});

// Get customer by ID
exports.getCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id)
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
      select: 'name status stage'
    })
    .populate({
      path: 'notes.createdBy',
      select: 'firstName lastName email'
    });
  
  if (!customer) {
    return next(new AppError('No customer found with that ID', 404));
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
  // Set the creator to the current user
  req.body.createdBy = req.user.id;
  
  // Verify that the lead exists if provided
  if (req.body.originalLead) {
    const lead = await Lead.findById(req.body.originalLead);
    if (!lead) {
      return next(new AppError('No lead found with that ID', 404));
    }
  }
  
  // Verify that the proposal exists if provided
  if (req.body.acceptedProposal) {
    const proposal = await Proposal.findById(req.body.acceptedProposal);
    if (!proposal) {
      return next(new AppError('No proposal found with that ID', 404));
    }
  }
  
  const newCustomer = await Customer.create(req.body);
  
  res.status(201).json({
    status: 'success',
    data: {
      customer: newCustomer
    }
  });
});

// Update customer
exports.updateCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  if (!customer) {
    return next(new AppError('No customer found with that ID', 404));
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
  const customer = await Customer.findByIdAndUpdate(req.params.id, { active: false });
  
  if (!customer) {
    return next(new AppError('No customer found with that ID', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Add note to customer
exports.addCustomerNote = catchAsync(async (req, res, next) => {
  // Set the creator to the current user
  req.body.createdBy = req.user.id;
  
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    { $push: { notes: req.body } },
    { new: true, runValidators: true }
  );
  
  if (!customer) {
    return next(new AppError('No customer found with that ID', 404));
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
  // Check if lead exists
  const lead = await Lead.findById(req.params.leadId);
  if (!lead) {
    return next(new AppError('No lead found with that ID', 404));
  }
  
  // Check if proposal exists if provided
  let proposal;
  if (req.body.proposalId) {
    proposal = await Proposal.findById(req.body.proposalId);
    if (!proposal) {
      return next(new AppError('No proposal found with that ID', 404));
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