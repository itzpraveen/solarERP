const Lead = require('../models/lead.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

// Get all leads with filtering, sorting, and pagination
exports.getAllLeads = catchAsync(async (req, res, _next) => {
  // Rename next to _next
  // BUILD QUERY
  // BUILD FILTER CONDITIONS
  const filterConditions = {};

  // 1) Add standard filters (status, category, etc.) from req.query
  const standardFilters = { ...req.query };
  // Exclude fields handled separately (pagination, sorting, etc.) or specific controls
  const excludedFields = [
    'page',
    'sort',
    'limit',
    'fields',
    '_cb',
    'includeConverted',
  ];
  excludedFields.forEach((el) => delete standardFilters[el]);

  Object.keys(standardFilters).forEach((key) => {
    const value = standardFilters[key];
    if (value !== '' && value !== undefined && value !== null) {
      if (
        key === 'status' &&
        typeof value === 'string' &&
        value.includes(',')
      ) {
        // Handle comma-separated status values using $in
        filterConditions[key] = {
          $in: value
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s),
        }; // Trim whitespace and filter empty strings
      } else {
        // Basic equality check for other fields or single status
        filterConditions[key] = value;
      }
      // Add logic here if range filters (gte, lte) are needed for specific fields
    }
  });
  console.log(
    'getAllLeads - Standard filters applied:',
    JSON.stringify(filterConditions)
  );

  // 2) Add 'converted' filter based on includeConverted param
  const { includeConverted } = req.query;
  console.log('getAllLeads - includeConverted parameter:', includeConverted);
  if (includeConverted === 'true') {
    // If true, don't add any 'converted' filter (show both converted and non-converted)
    console.log(
      'getAllLeads - Not filtering by converted status (showing all)'
    );
  } else {
    // Default behavior (false or undefined): only show non-converted leads
    filterConditions.converted = { $ne: true };
    console.log('getAllLeads - Applying filter: converted != true');
  }

  console.log(
    'getAllLeads - Final filter conditions before find:',
    JSON.stringify(filterConditions)
  );

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
      leads,
    },
  });
  // No return needed here as it's the main function body
});

// Get lead by ID
exports.getLead = catchAsync(async (req, res, next) => {
  const lead = await Lead.findById(req.params.id)
    .populate({
      path: 'notes.createdBy interactions.conductedBy',
      select: 'firstName lastName email',
    })
    .populate('proposals');

  if (!lead) {
    return next(new AppError('No lead found with that ID', 404)); // Added return
  }

  return res.status(200).json({
    status: 'success',
    data: {
      lead,
    },
  });
  // No return needed here as it's the main function body
});

// Create new lead
exports.createLead = catchAsync(async (req, res, _next) => {
  // Rename next to _next
  // Set the creator to the current user
  req.body.createdBy = req.user.id;
  // assignedTo is already part of req.body if provided, no need for self-assignment

  // --- Handle Referral Fields ---
  const { source } = req.body; // Only need source for the logic

  // Clear irrelevant referral fields based on source
  if (source === 'dealer_referral') {
    req.body.referringCustomer = undefined;
    req.body.referringUser = undefined;
  } else if (source === 'customer_referral') {
    req.body.referringDealer = undefined;
    req.body.referringUser = undefined;
  } else if (source === 'staff_referral') {
    req.body.referringDealer = undefined;
    req.body.referringCustomer = undefined;
  } else {
    // If source is not a specific referral type, clear all referral fields
    req.body.referringDealer = undefined;
    req.body.referringCustomer = undefined;
    req.body.referringUser = undefined;
  }
  // --- End Handle Referral Fields ---

  const newLead = await Lead.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      lead: newLead,
    },
  });
  // No return needed here as it's the main function body
});

// Update lead
exports.updateLead = catchAsync(async (req, res, next) => {
  // Exclude fields that shouldn't be updated via this generic route
  // Allow 'source', 'assignedTo', and referral fields to be updated here, but handle them carefully
  const excludedFields = [
    'createdBy',
    'status',
    'converted',
    'active',
    'notes',
    'interactions',
    'proposals',
  ]; // Keep basic exclusions
  // assignedTo is already part of req.body if provided
  const updateData = { ...req.body };
  excludedFields.forEach((el) => delete updateData[el]);

  // --- Handle Referral Fields on Update ---
  if (updateData.source) {
    // Only apply logic if source is being updated
    const { source } = updateData; // Only need source for the logic

    // Clear irrelevant referral fields based on the NEW source
    if (source === 'dealer_referral') {
      updateData.referringCustomer = undefined;
      updateData.referringUser = undefined;
    } else if (source === 'customer_referral') {
      updateData.referringDealer = undefined;
      updateData.referringUser = undefined;
    } else if (source === 'staff_referral') {
      updateData.referringDealer = undefined;
      updateData.referringCustomer = undefined;
    } else {
      // If source is not a specific referral type, clear all referral fields
      updateData.referringDealer = undefined;
      updateData.referringCustomer = undefined;
      updateData.referringUser = undefined;
    }
  } else {
    // If source is NOT being updated, remove referral fields from the update payload
    // to prevent accidental clearing if they weren't included in the request.
    delete updateData.referringDealer;
    delete updateData.referringCustomer;
    delete updateData.referringUser;
  }
  // --- End Handle Referral Fields on Update ---

  console.log(`[updateLead] Attempting to update Lead ID: ${req.params.id}`);
  console.log(
    `[updateLead] Data being passed to findByIdAndUpdate:`,
    JSON.stringify(updateData, null, 2)
  ); // Log the exact data

  const lead = await Lead.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!lead) {
    return next(new AppError('No lead found with that ID', 404)); // Added return
  }

  console.log(
    `[updateLead] Update result for Lead ID ${req.params.id}:`,
    lead ? 'Success' : 'Failed or Not Found'
  ); // Log success/failure

  return res.status(200).json({
    status: 'success',
    data: {
      lead,
    },
  });
  // No return needed here as it's the main function body
});

// Delete lead (soft delete)
exports.deleteLead = catchAsync(async (req, res, next) => {
  const lead = await Lead.findByIdAndUpdate(req.params.id, { active: false });

  if (!lead) {
    return next(new AppError('No lead found with that ID', 404)); // Added return
  }

  return res.status(204).json({
    status: 'success',
    data: null,
  });
  // No return needed for 204 status
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
    return next(new AppError('No lead found with that ID', 404)); // Added return
  }

  return res.status(200).json({
    status: 'success',
    data: {
      lead,
    },
  });
  // No return needed here as it's the main function body
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
    return next(new AppError('No lead found with that ID', 404)); // Added return
  }

  return res.status(200).json({
    status: 'success',
    data: {
      lead,
    },
  });
  // No return needed here as it's the main function body
});

// Assign lead to user
exports.assignLead = catchAsync(async (req, res, next) => {
  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { assignedTo: req.body.userId },
    { new: true, runValidators: true }
  );

  if (!lead) {
    return next(new AppError('No lead found with that ID', 404)); // Added return
  }

  return res.status(200).json({
    status: 'success',
    data: {
      lead,
    },
  });
  // No return needed here as it's the main function body
});

// Update lead status
exports.updateLeadStatus = catchAsync(async (req, res, next) => {
  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  if (!lead) {
    return next(new AppError('No lead found with that ID', 404)); // Added return
  }

  return res.status(200).json({
    status: 'success',
    data: {
      lead,
    },
  });
  // No return needed here as it's the main function body
});

// Get lead stats
exports.getLeadStats = catchAsync(async (req, res, _next) => {
  // Rename next to _next
  const stats = await Lead.aggregate([
    {
      $match: { active: true },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgElectricBill: { $avg: '$monthlyElectricBill' },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
  // No return needed here as it's the main function body
});
