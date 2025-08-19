const ServiceRequest = require('../models/ServiceRequest');
const mongoose = require('mongoose');
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

// Get all service requests with optional filtering
exports.getServiceRequests = catchAsync(async (req, res, next) => {
  // 1) Build safe query with sanitization and soft delete filtering
  const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'startDate', 'endDate'];
  const sanitizedQuery = buildSafeQuery(req.query, excludedFields, false);
  
  // Validate ObjectIds if provided
  if (sanitizedQuery.customer && !isValidObjectId(sanitizedQuery.customer)) {
    return next(new AppError('Invalid customer ID format', 400));
  }
  if (sanitizedQuery.project && !isValidObjectId(sanitizedQuery.project)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  if (sanitizedQuery.assignedTechnician && !isValidObjectId(sanitizedQuery.assignedTechnician)) {
    return next(new AppError('Invalid technician ID format', 400));
  }
  
  // Add date range filtering safely
  if (req.query.startDate || req.query.endDate) {
    sanitizedQuery.createdAt = {};
    if (req.query.startDate) {
      const startDate = new Date(req.query.startDate);
      if (isNaN(startDate.getTime())) {
        return next(new AppError('Invalid start date format', 400));
      }
      sanitizedQuery.createdAt.$gte = startDate;
    }
    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate);
      if (isNaN(endDate.getTime())) {
        return next(new AppError('Invalid end date format', 400));
      }
      sanitizedQuery.createdAt.$lte = endDate;
    }
  }
  
  // Add safe search functionality
  if (req.query.search && typeof req.query.search === 'string') {
    const searchTerm = req.query.search.trim();
    if (searchTerm.length > 0 && searchTerm.length <= 100) { // Limit search term length
      sanitizedQuery.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ];
    }
  }
  
  let query = ServiceRequest.find(sanitizedQuery);
  
  // 2) Safe sorting with allowed fields
  const allowedSortFields = ['title', 'status', 'priority', 'requestType', 'createdAt', 'scheduledDate'];
  const sortBy = sanitizeSort(req.query.sort, allowedSortFields, '-createdAt');
  query = query.sort(sortBy);
  
  // 3) Safe pagination with limits
  const { page, limit, skip } = sanitizePagination(req.query);
  
  // Execute query with population
  query = query
    .populate('customer', 'firstName lastName email phone')
    .populate('project', 'name projectNumber')
    .populate('assignedTechnician', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName')
    .skip(skip)
    .limit(limit);
    
  const serviceRequests = await query;
  const total = await ServiceRequest.countDocuments(sanitizedQuery);

  res.status(200).json({
    status: 'success',
    results: serviceRequests.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      serviceRequests
    }
  });
});

// Get a specific service request
exports.getServiceRequest = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid service request ID format', 400));
  }
  
  const serviceRequest = await ServiceRequest.findById(req.params.id)
    .populate('customer', 'firstName lastName email phone')
    .populate('project', 'name projectNumber')
    .populate('assignedTechnician', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName')
    .populate('notes.createdBy', 'firstName lastName');

  if (!serviceRequest) {
    return next(new AppError('Service request not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      serviceRequest
    }
  });
});

// Create a new service request
exports.createServiceRequest = catchAsync(async (req, res, next) => {
  // Validate required fields
  const requiredFields = ['title', 'description', 'requestType', 'priority'];
  const missingFields = validateRequiredFields(req.body, requiredFields);
  
  if (missingFields.length > 0) {
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // Sanitize input body
  const sanitizedBody = sanitizeBody(req.body);
  
  // Validate referenced ObjectIds if provided
  if (sanitizedBody.customer && !isValidObjectId(sanitizedBody.customer)) {
    return next(new AppError('Invalid customer ID format', 400));
  }
  
  if (sanitizedBody.project && !isValidObjectId(sanitizedBody.project)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  if (sanitizedBody.assignedTechnician && !isValidObjectId(sanitizedBody.assignedTechnician)) {
    return next(new AppError('Invalid technician ID format', 400));
  }
  
  // Validate enum values
  const validRequestTypes = ['maintenance', 'repair', 'inspection', 'installation', 'consultation', 'emergency'];
  if (!validRequestTypes.includes(sanitizedBody.requestType)) {
    return next(new AppError('Invalid request type', 400));
  }
  
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (!validPriorities.includes(sanitizedBody.priority)) {
    return next(new AppError('Invalid priority level', 400));
  }
  
  // Add the current user as createdBy
  sanitizedBody.createdBy = req.user.id;
  
  const serviceRequest = await ServiceRequest.create(sanitizedBody);
  
  const populatedServiceRequest = await ServiceRequest.findById(serviceRequest._id)
    .populate('customer', 'firstName lastName email phone')
    .populate('project', 'name projectNumber')
    .populate('assignedTechnician', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName');

  res.status(201).json({
    status: 'success',
    data: {
      serviceRequest: populatedServiceRequest
    }
  });
});

// Update a service request
exports.updateServiceRequest = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid service request ID format', 400));
  }
  
  // Sanitize input body
  const sanitizedBody = sanitizeBody(req.body);
  
  // Remove fields that shouldn't be updated
  delete sanitizedBody.createdBy;
  delete sanitizedBody.createdAt;
  delete sanitizedBody._id;
  
  // Validate referenced ObjectIds if provided
  if (sanitizedBody.customer && !isValidObjectId(sanitizedBody.customer)) {
    return next(new AppError('Invalid customer ID format', 400));
  }
  
  if (sanitizedBody.project && !isValidObjectId(sanitizedBody.project)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  if (sanitizedBody.assignedTechnician && !isValidObjectId(sanitizedBody.assignedTechnician)) {
    return next(new AppError('Invalid technician ID format', 400));
  }
  
  // Validate enum values if provided
  if (sanitizedBody.requestType) {
    const validRequestTypes = ['maintenance', 'repair', 'inspection', 'installation', 'consultation', 'emergency'];
    if (!validRequestTypes.includes(sanitizedBody.requestType)) {
      return next(new AppError('Invalid request type', 400));
    }
  }
  
  if (sanitizedBody.priority) {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(sanitizedBody.priority)) {
      return next(new AppError('Invalid priority level', 400));
    }
  }
  
  if (sanitizedBody.status) {
    const validStatuses = ['open', 'assigned', 'in-progress', 'completed', 'cancelled', 'on-hold'];
    if (!validStatuses.includes(sanitizedBody.status)) {
      return next(new AppError('Invalid status', 400));
    }
  }
  
  // Add updatedBy field
  sanitizedBody.updatedBy = req.user.id;
  
  const serviceRequest = await ServiceRequest.findByIdAndUpdate(
    req.params.id,
    sanitizedBody,
    {
      new: true,
      runValidators: true
    }
  )
    .populate('customer', 'firstName lastName email phone')
    .populate('project', 'name projectNumber')
    .populate('assignedTechnician', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName')
    .populate('notes.createdBy', 'firstName lastName');

  if (!serviceRequest) {
    return next(new AppError('Service request not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      serviceRequest
    }
  });
});

// Delete a service request
exports.deleteServiceRequest = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid service request ID format', 400));
  }
  
  const serviceRequest = await ServiceRequest.findByIdAndDelete(req.params.id);

  if (!serviceRequest) {
    return next(new AppError('Service request not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Add a note to a service request
exports.addNote = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid service request ID format', 400));
  }
  
  if (!req.body.text || req.body.text.trim() === '') {
    return next(new AppError('Note text is required', 400));
  }

  // Sanitize note text
  const sanitizedNote = {
    text: sanitizeBody({ text: req.body.text }).text,
    createdBy: req.user.id
  };

  const serviceRequest = await ServiceRequest.findByIdAndUpdate(
    req.params.id,
    {
      $push: { notes: sanitizedNote },
      updatedBy: req.user.id
    },
    {
      new: true,
      runValidators: true
    }
  )
    .populate('customer', 'firstName lastName email phone')
    .populate('project', 'name projectNumber')
    .populate('assignedTechnician', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName')
    .populate('notes.createdBy', 'firstName lastName');

  if (!serviceRequest) {
    return next(new AppError('Service request not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      notes: serviceRequest.notes
    }
  });
});

// Assign technician to service request
exports.assignTechnician = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid service request ID format', 400));
  }
  
  if (!req.body.technicianId || !isValidObjectId(req.body.technicianId)) {
    return next(new AppError('Valid technician ID is required', 400));
  }

  const serviceRequest = await ServiceRequest.findByIdAndUpdate(
    req.params.id,
    {
      assignedTechnician: req.body.technicianId,
      status: 'assigned',
      updatedBy: req.user.id
    },
    {
      new: true,
      runValidators: true
    }
  )
    .populate('customer', 'firstName lastName email phone')
    .populate('project', 'name projectNumber')
    .populate('assignedTechnician', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName');

  if (!serviceRequest) {
    return next(new AppError('Service request not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      serviceRequest
    }
  });
});

// Update service request status
exports.updateStatus = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid service request ID format', 400));
  }
  
  if (!req.body.status || req.body.status.trim() === '') {
    return next(new AppError('Status is required', 400));
  }
  
  // Validate status value
  const validStatuses = ['open', 'assigned', 'in-progress', 'completed', 'cancelled', 'on-hold'];
  if (!validStatuses.includes(req.body.status)) {
    return next(new AppError('Invalid status value', 400));
  }

  // Add note about status change if provided
  const update = {
    status: req.body.status,
    updatedBy: req.user.id
  };

  if (req.body.note && req.body.note.trim() !== '') {
    const sanitizedNote = sanitizeBody({ text: req.body.note });
    update.$push = {
      notes: {
        text: sanitizedNote.text,
        createdBy: req.user.id
      }
    };
  }

  // If status is completed, set completionDate
  if (req.body.status === 'completed') {
    update.completionDate = new Date();
  }

  const serviceRequest = await ServiceRequest.findByIdAndUpdate(
    req.params.id,
    update,
    {
      new: true,
      runValidators: true
    }
  )
    .populate('customer', 'firstName lastName email phone')
    .populate('project', 'name projectNumber')
    .populate('assignedTechnician', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName');

  if (!serviceRequest) {
    return next(new AppError('Service request not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      serviceRequest
    }
  });
});

// Schedule service
exports.scheduleService = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid service request ID format', 400));
  }
  
  if (!req.body.scheduledDate) {
    return next(new AppError('Scheduled date is required', 400));
  }
  
  // Validate date
  const scheduledDate = new Date(req.body.scheduledDate);
  if (isNaN(scheduledDate.getTime())) {
    return next(new AppError('Invalid scheduled date format', 400));
  }
  
  // Check if date is in the future
  if (scheduledDate < new Date()) {
    return next(new AppError('Scheduled date must be in the future', 400));
  }

  const update = {
    scheduledDate: scheduledDate,
    updatedBy: req.user.id
  };

  // Add note about scheduling if provided
  if (req.body.note && req.body.note.trim() !== '') {
    const sanitizedNote = sanitizeBody({ text: req.body.note });
    update.$push = {
      notes: {
        text: sanitizedNote.text,
        createdBy: req.user.id
      }
    };
  }

  const serviceRequest = await ServiceRequest.findByIdAndUpdate(
    req.params.id,
    update,
    {
      new: true,
      runValidators: true
    }
  )
    .populate('customer', 'firstName lastName email phone')
    .populate('project', 'name projectNumber')
    .populate('assignedTechnician', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName');

  if (!serviceRequest) {
    return next(new AppError('Service request not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      serviceRequest
    }
  });
});

// Complete service
exports.completeService = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid service request ID format', 400));
  }
  
  if (!req.body.completionDate) {
    return next(new AppError('Completion date is required', 400));
  }
  
  // Validate completion date
  const completionDate = new Date(req.body.completionDate);
  if (isNaN(completionDate.getTime())) {
    return next(new AppError('Invalid completion date format', 400));
  }
  
  // Check if completion date is not in the future
  if (completionDate > new Date()) {
    return next(new AppError('Completion date cannot be in the future', 400));
  }

  const update = {
    status: 'completed',
    completionDate: completionDate,
    updatedBy: req.user.id
  };

  // Add completion note if provided
  if (req.body.notes && req.body.notes.trim() !== '') {
    const sanitizedNote = sanitizeBody({ text: req.body.notes });
    update.$push = {
      notes: {
        text: sanitizedNote.text,
        createdBy: req.user.id
      }
    };
  }

  const serviceRequest = await ServiceRequest.findByIdAndUpdate(
    req.params.id,
    update,
    {
      new: true,
      runValidators: true
    }
  )
    .populate('customer', 'firstName lastName email phone')
    .populate('project', 'name projectNumber')
    .populate('assignedTechnician', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName')
    .populate('notes.createdBy', 'firstName lastName');

  if (!serviceRequest) {
    return next(new AppError('Service request not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      serviceRequest,
      notes: serviceRequest.notes
    }
  });
});

// Get service requests for a customer
exports.getCustomerServiceRequests = catchAsync(async (req, res, next) => {
  // Validate customer ObjectId
  if (!isValidObjectId(req.params.customerId)) {
    return next(new AppError('Invalid customer ID format', 400));
  }
  
  // Safe pagination
  const { page, limit, skip } = sanitizePagination(req.query);
  
  const serviceRequests = await ServiceRequest.find({ customer: req.params.customerId })
    .populate('project', 'name projectNumber')
    .populate('assignedTechnician', 'firstName lastName email')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);
    
  const total = await ServiceRequest.countDocuments({ customer: req.params.customerId });

  res.status(200).json({
    status: 'success',
    results: serviceRequests.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      serviceRequests
    }
  });
});

// Get service requests for a project
exports.getProjectServiceRequests = catchAsync(async (req, res, next) => {
  // Validate project ObjectId
  if (!isValidObjectId(req.params.projectId)) {
    return next(new AppError('Invalid project ID format', 400));
  }
  
  // Safe pagination
  const { page, limit, skip } = sanitizePagination(req.query);
  
  const serviceRequests = await ServiceRequest.find({ project: req.params.projectId })
    .populate('customer', 'firstName lastName email phone')
    .populate('assignedTechnician', 'firstName lastName email')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);
    
  const total = await ServiceRequest.countDocuments({ project: req.params.projectId });

  res.status(200).json({
    status: 'success',
    results: serviceRequests.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      serviceRequests
    }
  });
});