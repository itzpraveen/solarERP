const Project = require('../models/project.model');
const Customer = require('../models/customer.model');
const Proposal = require('../models/proposal.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

// Get all projects with filtering, sorting, and pagination
exports.getAllProjects = catchAsync(async (req, res, next) => {
  // BUILD QUERY
  // 1) Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);
  
  // 2) Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  
  let query = Project.find(JSON.parse(queryStr));
  
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
  const projects = await query;
  
  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects
    }
  });
});

// Get project by ID
exports.getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate({
      path: 'proposal',
      select: 'name systemSize pricing'
    })
    .populate({
      path: 'notes.createdBy',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'issues.reportedBy issues.assignedTo',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'team.installationTeam',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'documents.uploadedBy',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'financials.expenses.recordedBy',
      select: 'firstName lastName email'
    });
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

// Create new project
exports.createProject = catchAsync(async (req, res, next) => {
  // Set the creator to the current user
  req.body.createdBy = req.user.id;
  
  // Verify that the customer exists
  const customer = await Customer.findById(req.body.customer);
  if (!customer) {
    return next(new AppError('No customer found with that ID', 404));
  }
  
  // Verify that the proposal exists if provided
  if (req.body.proposal) {
    const proposal = await Proposal.findById(req.body.proposal);
    if (!proposal) {
      return next(new AppError('No proposal found with that ID', 404));
    }
    
    // Auto-populate project data from proposal if not provided
    if (!req.body.systemSize) req.body.systemSize = proposal.systemSize;
    if (!req.body.panelCount) req.body.panelCount = proposal.panelCount;
    if (!req.body.panelType) req.body.panelType = proposal.panelType;
    if (!req.body.inverterType) req.body.inverterType = proposal.inverterType;
    if (!req.body.includesBattery) req.body.includesBattery = proposal.includesBattery;
    if (proposal.includesBattery) {
      if (!req.body.batteryType) req.body.batteryType = proposal.batteryType;
      if (!req.body.batteryCount) req.body.batteryCount = proposal.batteryCount;
    }
    
    // Set financials if not provided
    if (!req.body.financials || !req.body.financials.totalContractValue) {
      if (!req.body.financials) req.body.financials = {};
      req.body.financials.totalContractValue = proposal.pricing.netCost;
    }
  }
  
  // Auto-populate install address from customer address if not provided
  if (!req.body.installAddress) {
    req.body.installAddress = customer.address;
  }
  
  const newProject = await Project.create(req.body);
  
  res.status(201).json({
    status: 'success',
    data: {
      project: newProject
    }
  });
});

// Update project
exports.updateProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

// Delete project (soft delete)
exports.deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(req.params.id, { active: false });
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Update project status
exports.updateProjectStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

// Update project stage
exports.updateProjectStage = catchAsync(async (req, res, next) => {
  const { stage } = req.body;
  
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { stage },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

// Add note to project
exports.addProjectNote = catchAsync(async (req, res, next) => {
  // Set the creator to the current user
  req.body.createdBy = req.user.id;
  
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $push: { notes: req.body } },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

// Add issue to project
exports.addProjectIssue = catchAsync(async (req, res, next) => {
  // Set the reporter to the current user
  req.body.reportedBy = req.user.id;
  
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $push: { issues: req.body } },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

// Update project issue
exports.updateProjectIssue = catchAsync(async (req, res, next) => {
  const { issueId } = req.params;
  
  // If status is being changed to resolved, add resolution date
  if (req.body.status === 'resolved' && !req.body.resolvedAt) {
    req.body.resolvedAt = Date.now();
  }
  
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, 'issues._id': issueId },
    { $set: { 'issues.$': { ...req.body, _id: issueId } } },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('No project or issue found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

// Add document to project
exports.addProjectDocument = catchAsync(async (req, res, next) => {
  // Set the uploader to the current user
  req.body.uploadedBy = req.user.id;
  
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $push: { documents: req.body } },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

// Add equipment to project
exports.addProjectEquipment = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $push: { equipment: req.body } },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

// Update project team
exports.updateProjectTeam = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { team: req.body },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

// Add expense to project
exports.addProjectExpense = catchAsync(async (req, res, next) => {
  // Set the recorder to the current user
  req.body.recordedBy = req.user.id;
  
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $push: { 'financials.expenses': req.body } },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

// Add payment to project
exports.addProjectPayment = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $push: { 'financials.paymentSchedule': req.body } },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});

// Get project statistics
exports.getProjectStats = catchAsync(async (req, res, next) => {
  const stats = await Project.aggregate([
    {
      $match: { active: true }
    },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        avgContractValue: { $avg: '$financials.totalContractValue' }
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