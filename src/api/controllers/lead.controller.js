const Lead = require('../models/lead.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

// Get all leads with filtering, sorting, and pagination
exports.getAllLeads = catchAsync(async (req, res, next) => {
  // BUILD QUERY
  // 1) Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);
  
  // 2) Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  
  let query = Lead.find(JSON.parse(queryStr));
  
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
  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
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