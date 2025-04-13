const Lead = require('../models/lead.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

// Get all leads with filtering, sorting, and pagination
exports.getAllLeads = catchAsync(async (req, res, next) => {
  // BUILD QUERY
  // BUILD FILTER CONDITIONS
  const filterConditions = {};

  // 1) Add standard filters (status, category, etc.) from req.query
  const standardFilters = { ...req.query };
  // Exclude fields handled separately (pagination, sorting, etc.) or specific controls
  const excludedFields = ['page', 'sort', 'limit', 'fields', '_cb', 'includeConverted'];
  excludedFields.forEach(el => delete standardFilters[el]);

  Object.keys(standardFilters).forEach(key => {
    if (standardFilters[key] !== '' && standardFilters[key] !== undefined && standardFilters[key] !== null) {
      // Basic equality check for most fields
      filterConditions[key] = standardFilters[key];
      // Add logic here if range filters (gte, lte) are needed for specific fields
    }
  });
  console.log('getAllLeads - Standard filters applied:', JSON.stringify(filterConditions));

  // 2) Add 'converted' filter based on includeConverted param
  const includeConverted = req.query.includeConverted;
  console.log('getAllLeads - includeConverted parameter:', includeConverted);
  if (includeConverted === 'true') {
    // If true, don't add any 'converted' filter (show both converted and non-converted)
    console.log('getAllLeads - Not filtering by converted status (showing all)');
  } else {
    // Default behavior (false or undefined): only show non-converted leads
    filterConditions.converted = { $ne: true };
    console.log('getAllLeads - Applying filter: converted != true');
  }

  console.log('getAllLeads - Final filter conditions before find:', JSON.stringify(filterConditions));

  // BUILD QUERY (Find + Sort + Paginate)
  // Apply all calculated filters at once. The 'active' filter is added by pre-find middleware.
  let query = Lead.find(filterConditions);
  
  // 3) Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
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
  const leads = await query;
  
  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: leads.length,
    data: {
      leads
    }
  });
});

// Get lead by ID
exports.getLead = catchAsync(async (req, res, next) => {
  const lead = await Lead.findById(req.params.id)
    .populate({
      path: 'notes.createdBy interactions.conductedBy',
      select: 'firstName lastName email'
    })
    .populate('proposals');
  
  if (!lead) {
    return next(new AppError('No lead found with that ID', 404));
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
  // Set the creator to the current user
  req.body.createdBy = req.user.id;
  
  const newLead = await Lead.create(req.body);
  
  res.status(201).json({
    status: 'success',
    data: {
      lead: newLead
    }
  });
});

// Update lead
exports.updateLead = catchAsync(async (req, res, next) => {
  // Exclude fields that shouldn't be updated via this generic route
  const excludedFields = ['createdBy', 'assignedTo', 'status', 'converted', 'active', 'notes', 'interactions', 'proposals'];
  const filteredBody = { ...req.body };
  excludedFields.forEach(el => delete filteredBody[el]);

  const lead = await Lead.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  
  if (!lead) {
    return next(new AppError('No lead found with that ID', 404));
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
  const lead = await Lead.findByIdAndUpdate(req.params.id, { active: false });
  
  if (!lead) {
    return next(new AppError('No lead found with that ID', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Add note to lead
exports.addLeadNote = catchAsync(async (req, res, next) => {
  // Set the creator to the current user
  req.body.createdBy = req.user.id;
  
  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { $push: { notes: req.body } },
    { new: true, runValidators: true }
  );
  
  if (!lead) {
    return next(new AppError('No lead found with that ID', 404));
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
  // Set the conductor to the current user
  req.body.conductedBy = req.user.id;
  
  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { $push: { interactions: req.body } },
    { new: true, runValidators: true }
  );
  
  if (!lead) {
    return next(new AppError('No lead found with that ID', 404));
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
  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { assignedTo: req.body.userId },
    { new: true, runValidators: true }
  );
  
  if (!lead) {
    return next(new AppError('No lead found with that ID', 404));
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
  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  
  if (!lead) {
    return next(new AppError('No lead found with that ID', 404));
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