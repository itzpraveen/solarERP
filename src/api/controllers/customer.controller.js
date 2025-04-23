const Customer = require('../models/customer.model');
const Lead = require('../models/lead.model');
const Proposal = require('../models/proposal.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

// Get all customers with filtering, sorting, and pagination
exports.getAllCustomers = catchAsync(async (req, res, _next) => {
  // BUILD FILTER CONDITIONS
  const filterConditions = {};

  // 1) Add standard filters from req.query
  const standardFilters = { ...req.query };
  // Exclude fields handled separately (pagination, sorting, etc.)
  const excludedFields = ['page', 'sort', 'limit', 'fields', '_cb']; // Added _cb just in case
  excludedFields.forEach((el) => delete standardFilters[el]);

  Object.keys(standardFilters).forEach((key) => {
    if (
      standardFilters[key] !== '' &&
      standardFilters[key] !== undefined &&
      standardFilters[key] !== null
    ) {
      // Basic equality check for most fields
      filterConditions[key] = standardFilters[key];
      // Add logic here if range filters (gte, lte) or search are needed
    }
  });
  console.log(
    'getAllCustomers - Standard filters applied:',
    JSON.stringify(filterConditions)
  );

  // Note: Unlike leads, there's no 'includeConverted' concept here.
  // The 'active' filter is handled by the pre-find middleware in the model.

  console.log(
    'getAllCustomers - Final filter conditions before find:',
    JSON.stringify(filterConditions)
  );

  // BUILD QUERY (Find + Sort + Paginate)
  // Apply all calculated filters at once. The 'active' filter is added by pre-find middleware.
  let query = Customer.find(filterConditions);

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
      customers,
    },
  });
  // No return needed here as it's the main function body
});

// Get customer by ID
exports.getCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id)
    .populate({
      path: 'originalLead',
      select: 'status source category',
    })
    .populate({
      path: 'acceptedProposal',
      select: 'name systemSize panelCount panelType',
    })
    .populate({
      path: 'projects',
      select: 'name status stage',
    })
    .populate({
      path: 'notes.createdBy',
      select: 'firstName lastName email',
    });

  if (!customer) {
    next(new AppError('No customer found with that ID', 404));
    return; // Add explicit return after calling next()
  }

  res.status(200).json({
    status: 'success',
    data: {
      customer,
    },
  });
  // No return needed here as it's the main function body
});

// Create new proposal
exports.createCustomer = catchAsync(async (req, res, next) => {
  // Set the creator to the current user
  req.body.createdBy = req.user.id;

  // Verify that the lead exists if provided
  if (req.body.originalLead) {
    const lead = await Lead.findById(req.body.originalLead);
    if (!lead) {
      next(new AppError('No lead found with that ID', 404));
      return; // Add explicit return after calling next()
    }
  }

  // Verify that the proposal exists if provided
  if (req.body.acceptedProposal) {
    const proposal = await Proposal.findById(req.body.acceptedProposal);
    if (!proposal) {
      next(new AppError('No proposal found with that ID', 404));
      return; // Add explicit return after calling next()
    }
  }

  const newCustomer = await Customer.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      customer: newCustomer,
    },
  });
  // No return needed here as it's the main function body
});

// Update proposal
exports.updateCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!customer) {
    next(new AppError('No customer found with that ID', 404));
    return; // Add explicit return after calling next()
  }

  res.status(200).json({
    status: 'success',
    data: {
      customer,
    },
  });
  // No return needed here as it's the main function body
});

// Delete proposal (soft delete)
exports.deleteCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, {
    active: false,
  });

  if (!customer) {
    next(new AppError('No customer found with that ID', 404));
    return; // Add explicit return after calling next()
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
  // No return needed for 204 status
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
    next(new AppError('No customer found with that ID', 404));
    return; // Add explicit return after calling next()
  }

  res.status(200).json({
    status: 'success',
    data: {
      customer,
    },
  });
  // No return needed here as it's the main function body
});

// Convert lead to customer
exports.convertLeadToCustomer = catchAsync(async (req, res, next) => {
  // Check if lead exists
  const lead = await Lead.findById(req.params.leadId);
  if (!lead) {
    next(new AppError('No lead found with that ID', 404));
    return; // Add explicit return after calling next()
  }

  // Check if proposal exists if provided
  let proposal;
  if (req.body.proposalId) {
    proposal = await Proposal.findById(req.body.proposalId);
    if (!proposal) {
      next(new AppError('No proposal found with that ID', 404));
      return; // Add explicit return after calling next()
    }

    // Check if proposal belongs to the lead
    if (proposal.lead.toString() !== lead._id.toString()) {
      next(new AppError('Proposal does not belong to this lead', 400));
      return; // Add explicit return after calling next()
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
    createdBy: req.user.id,
  };

  const newCustomer = await Customer.create(customerData);

  // Update lead status to won and mark as converted
  await Lead.findByIdAndUpdate(lead._id, {
    status: 'won',
    converted: true,
  });

  res.status(201).json({
    status: 'success',
    data: {
      customer: newCustomer,
    },
  });
  // No return needed here as it's the main function body
});
