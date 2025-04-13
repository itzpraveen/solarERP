const ServiceRequest = require('../models/ServiceRequest');
const mongoose = require('mongoose');

// Get all service requests with optional filtering
exports.getServiceRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', search, startDate, endDate, ...filters } = req.query;

    // BUILD FILTER CONDITIONS
    const filterConditions = {};

    // 1) Add standard filters from req.query (customer, project, status, etc.)
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== undefined && filters[key] !== null) {
        filterConditions[key] = filters[key];
      }
    });

    // 2) Add date range filter
    if (startDate || endDate) {
      filterConditions.createdAt = {};
      if (startDate) filterConditions.createdAt.$gte = new Date(startDate);
      if (endDate) filterConditions.createdAt.$lte = new Date(endDate);
    }

    // 3) Add search filter
    if (search) {
      filterConditions.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
        // Add other fields to search if needed (e.g., customer name after population?)
      ];
    }

    console.log('getServiceRequests - Final filter conditions before find:', JSON.stringify(filterConditions)); // Keep this log

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const serviceRequests = await ServiceRequest.find(filterConditions)
      .populate('customer', 'firstName lastName email phone')
      .populate('project', 'name projectNumber')
      .populate('assignedTechnician', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await ServiceRequest.countDocuments(filterConditions);

    res.status(200).json({
      status: 'success',
      results: serviceRequests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      serviceRequests
    });
  } catch (error) {
    console.error('Error in getServiceRequests:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch service requests',
      error: error.message
    });
  }
};

// Get a specific service request
exports.getServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone')
      .populate('project', 'name projectNumber')
      .populate('assignedTechnician', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('notes.createdBy', 'firstName lastName');

    if (!serviceRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service request not found'
      });
    }

    res.status(200).json({
      status: 'success',
      serviceRequest
    });
  } catch (error) {
    console.error('Error in getServiceRequest:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch service request',
      error: error.message
    });
  }
};

// Create a new service request
exports.createServiceRequest = async (req, res) => {
  try {
    // Add the current user as createdBy
    req.body.createdBy = req.user.id;
    
    const serviceRequest = await ServiceRequest.create(req.body);
    
    const populatedServiceRequest = await ServiceRequest.findById(serviceRequest._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('project', 'name projectNumber')
      .populate('assignedTechnician', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      status: 'success',
      serviceRequest: populatedServiceRequest
    });
  } catch (error) {
    console.error('Error in createServiceRequest:', error);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create service request',
      error: error.message
    });
  }
};

// Update a service request
exports.updateServiceRequest = async (req, res) => {
  try {
    // Exclude fields managed by other routes or immutable fields
    const excludedFields = [
      'customer',
      'project',
      'createdBy',
      'assignedTechnician',
      'status',
      'scheduledDate',
      'completionDate',
      'notes',
      'updatedBy' // This should be set internally, not via request body
    ];
    const filteredBody = { ...req.body };
    excludedFields.forEach(el => delete filteredBody[el]);

    // Add updatedBy field internally
    filteredBody.updatedBy = req.user.id;

    const serviceRequest = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      filteredBody, // Use the filtered body
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('customer', 'firstName lastName email phone')
      .populate('project', 'name projectNumber')
      .populate('assignedTechnician', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('notes.createdBy', 'firstName lastName');

    if (!serviceRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service request not found'
      });
    }

    res.status(200).json({
      status: 'success',
      serviceRequest
    });
  } catch (error) {
    console.error('Error in updateServiceRequest:', error);
    res.status(400).json({
      status: 'error',
      message: 'Failed to update service request',
      error: error.message
    });
  }
};

// Delete a service request
exports.deleteServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findByIdAndDelete(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service request not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Service request deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteServiceRequest:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete service request',
      error: error.message
    });
  }
};

// Add a note to a service request
exports.addNote = async (req, res) => {
  try {
    if (!req.body.text) {
      return res.status(400).json({
        status: 'fail',
        message: 'Note text is required'
      });
    }

    const note = {
      text: req.body.text,
      createdBy: req.user.id
    };

    const serviceRequest = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      {
        $push: { notes: note },
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
      return res.status(404).json({
        status: 'fail',
        message: 'Service request not found'
      });
    }

    res.status(200).json({
      status: 'success',
      notes: serviceRequest.notes
    });
  } catch (error) {
    console.error('Error in addNote:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add note',
      error: error.message
    });
  }
};

// Assign technician to service request
exports.assignTechnician = async (req, res) => {
  try {
    if (!req.body.technicianId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Technician ID is required'
      });
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
      return res.status(404).json({
        status: 'fail',
        message: 'Service request not found'
      });
    }

    res.status(200).json({
      status: 'success',
      serviceRequest
    });
  } catch (error) {
    console.error('Error in assignTechnician:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to assign technician',
      error: error.message
    });
  }
};

// Update service request status
exports.updateStatus = async (req, res) => {
  try {
    if (!req.body.status) {
      return res.status(400).json({
        status: 'fail',
        message: 'Status is required'
      });
    }

    // Add note about status change if provided
    const update = {
      status: req.body.status,
      updatedBy: req.user.id
    };

    if (req.body.note) {
      update.$push = {
        notes: {
          text: req.body.note,
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
      return res.status(404).json({
        status: 'fail',
        message: 'Service request not found'
      });
    }

    res.status(200).json({
      status: 'success',
      serviceRequest
    });
  } catch (error) {
    console.error('Error in updateStatus:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update status',
      error: error.message
    });
  }
};

// Schedule service
exports.scheduleService = async (req, res) => {
  try {
    if (!req.body.scheduledDate) {
      return res.status(400).json({
        status: 'fail',
        message: 'Scheduled date is required'
      });
    }

    const update = {
      scheduledDate: req.body.scheduledDate,
      updatedBy: req.user.id
    };

    // Add note about scheduling if provided
    if (req.body.note) {
      update.$push = {
        notes: {
          text: req.body.note,
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
      return res.status(404).json({
        status: 'fail',
        message: 'Service request not found'
      });
    }

    res.status(200).json({
      status: 'success',
      serviceRequest
    });
  } catch (error) {
    console.error('Error in scheduleService:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to schedule service',
      error: error.message
    });
  }
};

// Complete service
exports.completeService = async (req, res) => {
  try {
    if (!req.body.completionDate) {
      return res.status(400).json({
        status: 'fail',
        message: 'Completion date is required'
      });
    }

    const update = {
      status: 'completed',
      completionDate: req.body.completionDate,
      updatedBy: req.user.id
    };

    // Add completion note if provided
    if (req.body.notes) {
      update.$push = {
        notes: {
          text: req.body.notes,
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
      return res.status(404).json({
        status: 'fail',
        message: 'Service request not found'
      });
    }

    res.status(200).json({
      status: 'success',
      serviceRequest,
      notes: serviceRequest.notes
    });
  } catch (error) {
    console.error('Error in completeService:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to complete service',
      error: error.message
    });
  }
};

// Get service requests for a customer
exports.getCustomerServiceRequests = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    
    const serviceRequests = await ServiceRequest.find({ customer: customerId })
      .populate('project', 'name projectNumber')
      .populate('assignedTechnician', 'firstName lastName email')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: serviceRequests.length,
      serviceRequests
    });
  } catch (error) {
    console.error('Error in getCustomerServiceRequests:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customer service requests',
      error: error.message
    });
  }
};

// Get service requests for a project
exports.getProjectServiceRequests = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    
    const serviceRequests = await ServiceRequest.find({ project: projectId })
      .populate('customer', 'firstName lastName email phone')
      .populate('assignedTechnician', 'firstName lastName email')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: serviceRequests.length,
      serviceRequests
    });
  } catch (error) {
    console.error('Error in getProjectServiceRequests:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch project service requests',
      error: error.message
    });
  }
};