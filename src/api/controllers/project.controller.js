const Project = require('../models/project.model');
const Customer = require('../models/customer.model');
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
  createErrorResponse
} = require('../../utils/validationHelper');

// Get all projects with filtering, sorting, and pagination
exports.getAllProjects = catchAsync(async (req, res, next) => {
  // 1) Build safe query with sanitization and soft delete filtering
  const sanitizedQuery = buildSafeQuery(req.query, ['page', 'sort', 'limit', 'fields'], true);
  const advancedQuery = buildAdvancedFilter(sanitizedQuery);
  
  let query = Project.find(advancedQuery);
  
  // 2) Safe sorting with allowed fields
  const allowedSortFields = ['name', 'status', 'stage', 'systemSize', 'createdAt', 'installDate'];
  const sortBy = sanitizeSort(req.query.sort, allowedSortFields, '-createdAt');
  query = query.sort(sortBy);
  
  // 3) Safe field limiting
  const allowedFields = ['name', 'customer', 'proposal', 'status', 'stage', 'systemSize', 'panelCount', 'installDate', 'createdAt'];
  const fields = sanitizeFields(req.query.fields, allowedFields);
  query = query.select(fields);
  
  // 4) Safe pagination with limits
  const { page, limit, skip } = sanitizePagination(req.query);
  query = query.skip(skip).limit(limit);
  
  // EXECUTE QUERY
  const projects = await query;
  const total = await Project.countDocuments(advancedQuery);
  
  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: projects.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      projects
    }
  });
});

// Get project by ID
exports.getProject = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  const project = await Project.findOne({ _id: req.params.id, active: { $ne: false } })
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
    return next(new AppError('Project not found', 404));
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
  // Validate required fields
  const requiredFields = ['name', 'customer'];
  const missingFields = validateRequiredFields(req.body, requiredFields);
  
  if (missingFields.length > 0) {
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // Sanitize input body
  const sanitizedBody = sanitizeBody(req.body);
  
  // Validate customer ObjectId
  if (!isValidObjectId(sanitizedBody.customer)) {
    return next(new AppError('Invalid customer ID format', 400));
  }
  
  // Set the creator to the current user
  sanitizedBody.createdBy = req.user.id;
  
  // Verify that the customer exists and is active
  const customer = await Customer.findOne({ _id: sanitizedBody.customer, active: { $ne: false } });
  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }
  
  // Verify that the proposal exists if provided
  if (sanitizedBody.proposal) {
    if (!isValidObjectId(sanitizedBody.proposal)) {
      return next(new AppError('Invalid proposal ID format', 400));
    }
    
    const proposal = await Proposal.findOne({ _id: sanitizedBody.proposal, active: { $ne: false } });
    if (!proposal) {
      return next(new AppError('Proposal not found', 404));
    }
    
    // Auto-populate project data from proposal if not provided
    if (!sanitizedBody.systemSize) sanitizedBody.systemSize = proposal.systemSize;
    if (!sanitizedBody.panelCount) sanitizedBody.panelCount = proposal.panelCount;
    if (!sanitizedBody.panelType) sanitizedBody.panelType = proposal.panelType;
    if (!sanitizedBody.inverterType) sanitizedBody.inverterType = proposal.inverterType;
    if (!sanitizedBody.includesBattery) sanitizedBody.includesBattery = proposal.includesBattery;
    if (proposal.includesBattery) {
      if (!sanitizedBody.batteryType) sanitizedBody.batteryType = proposal.batteryType;
      if (!sanitizedBody.batteryCount) sanitizedBody.batteryCount = proposal.batteryCount;
    }
    
    // Set financials if not provided
    if (!sanitizedBody.financials || !sanitizedBody.financials.totalContractValue) {
      if (!sanitizedBody.financials) sanitizedBody.financials = {};
      sanitizedBody.financials.totalContractValue = proposal.pricing.netCost;
    }
  }
  
  // Auto-populate install address from customer address if not provided
  if (!sanitizedBody.installAddress) {
    sanitizedBody.installAddress = customer.address;
  }
  
  const newProject = await Project.create(sanitizedBody);
  
  res.status(201).json({
    status: 'success',
    data: {
      project: newProject
    }
  });
});

// Update project
exports.updateProject = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  // Sanitize input body
  const sanitizedBody = sanitizeBody(req.body);
  
  // Remove fields that shouldn't be updated
  delete sanitizedBody.createdBy;
  delete sanitizedBody.createdAt;
  delete sanitizedBody._id;
  
  // Validate referenced IDs if provided
  if (sanitizedBody.customer && !isValidObjectId(sanitizedBody.customer)) {
    return next(new AppError('Invalid customer ID format', 400));
  }
  
  if (sanitizedBody.proposal && !isValidObjectId(sanitizedBody.proposal)) {
    return next(new AppError('Invalid proposal ID format', 400));
  }
  
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    sanitizedBody,
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!project) {
    return next(new AppError('Project not found', 404));
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
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { active: false },
    { new: true }
  );
  
  if (!project) {
    return next(new AppError('Project not found', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Update project status
exports.updateProjectStatus = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  // Validate status field
  if (!req.body.status || req.body.status.trim() === '') {
    return next(new AppError('Status is required', 400));
  }
  
  const validStatuses = ['planning', 'approved', 'in-progress', 'installed', 'completed', 'on-hold', 'cancelled'];
  if (!validStatuses.includes(req.body.status)) {
    return next(new AppError('Invalid status value', 400));
  }
  
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('Project not found', 404));
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
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  // Validate stage field
  if (!req.body.stage || req.body.stage.trim() === '') {
    return next(new AppError('Stage is required', 400));
  }
  
  const validStages = ['design', 'permits', 'procurement', 'installation', 'inspection', 'activation', 'completed'];
  if (!validStages.includes(req.body.stage)) {
    return next(new AppError('Invalid stage value', 400));
  }
  
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { stage: req.body.stage },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('Project not found', 404));
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
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  // Validate required fields
  if (!req.body.text || req.body.text.trim() === '') {
    return next(new AppError('Note text is required', 400));
  }
  
  // Sanitize note body
  const sanitizedNote = sanitizeBody(req.body);
  sanitizedNote.createdBy = req.user.id;
  
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { $push: { notes: sanitizedNote } },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('Project not found', 404));
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
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  // Validate required fields
  const requiredFields = ['title', 'description', 'priority'];
  const missingFields = validateRequiredFields(req.body, requiredFields);
  
  if (missingFields.length > 0) {
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // Sanitize issue body
  const sanitizedIssue = sanitizeBody(req.body);
  sanitizedIssue.reportedBy = req.user.id;
  
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { $push: { issues: sanitizedIssue } },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('Project not found', 404));
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
  // Validate ObjectIds
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  if (!isValidObjectId(req.params.issueId)) {
    return next(new AppError('Invalid issue ID format', 400));
  }
  
  const { issueId } = req.params;
  
  // Sanitize update body
  const sanitizedUpdate = sanitizeBody(req.body);
  
  // If status is being changed to resolved, add resolution date
  if (sanitizedUpdate.status === 'resolved' && !sanitizedUpdate.resolvedAt) {
    sanitizedUpdate.resolvedAt = Date.now();
  }
  
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, 'issues._id': issueId, active: { $ne: false } },
    { $set: { 'issues.$': { ...sanitizedUpdate, _id: issueId } } },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('Project or issue not found', 404));
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
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  // Validate required fields
  const requiredFields = ['name', 'type'];
  const missingFields = validateRequiredFields(req.body, requiredFields);
  
  if (missingFields.length > 0) {
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // Sanitize document body
  const sanitizedDocument = sanitizeBody(req.body);
  sanitizedDocument.uploadedBy = req.user.id;
  
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { $push: { documents: sanitizedDocument } },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('Project not found', 404));
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
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  // Validate required fields
  const requiredFields = ['manufacturer', 'model', 'quantity'];
  const missingFields = validateRequiredFields(req.body, requiredFields);
  
  if (missingFields.length > 0) {
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // Sanitize equipment body
  const sanitizedEquipment = sanitizeBody(req.body);
  
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { $push: { equipment: sanitizedEquipment } },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('Project not found', 404));
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
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  // Sanitize team data
  const sanitizedTeam = sanitizeBody(req.body);
  
  // Validate team member IDs if provided
  if (sanitizedTeam.installationTeam && Array.isArray(sanitizedTeam.installationTeam)) {
    for (const memberId of sanitizedTeam.installationTeam) {
      if (memberId && !isValidObjectId(memberId)) {
        return next(new AppError('Invalid team member ID format', 400));
      }
    }
  }
  
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { team: sanitizedTeam },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('Project not found', 404));
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
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  // Validate required fields
  const requiredFields = ['description', 'amount', 'category'];
  const missingFields = validateRequiredFields(req.body, requiredFields);
  
  if (missingFields.length > 0) {
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // Validate amount is positive number
  if (isNaN(req.body.amount) || req.body.amount <= 0) {
    return next(new AppError('Amount must be a positive number', 400));
  }
  
  // Sanitize expense body
  const sanitizedExpense = sanitizeBody(req.body);
  sanitizedExpense.recordedBy = req.user.id;
  
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { $push: { 'financials.expenses': sanitizedExpense } },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('Project not found', 404));
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
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  // Validate required fields
  const requiredFields = ['amount', 'dueDate'];
  const missingFields = validateRequiredFields(req.body, requiredFields);
  
  if (missingFields.length > 0) {
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // Validate amount is positive number
  if (isNaN(req.body.amount) || req.body.amount <= 0) {
    return next(new AppError('Amount must be a positive number', 400));
  }
  
  // Sanitize payment body
  const sanitizedPayment = sanitizeBody(req.body);
  
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, active: { $ne: false } },
    { $push: { 'financials.paymentSchedule': sanitizedPayment } },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    return next(new AppError('Project not found', 404));
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