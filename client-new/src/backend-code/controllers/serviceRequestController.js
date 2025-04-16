const mongoose = require('mongoose');
const ServiceRequest = require('../models/ServiceRequest');
const Customer = require('../models/Customer');
const Project = require('../models/Project');
const {
  validateServiceRequest,
} = require('../validators/serviceRequestValidator');

// Get all service requests with filtering options
exports.getServiceRequests = async (req, res) => {
  try {
    const {
      customer,
      project,
      assignedTechnician,
      status,
      requestType,
      priority,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sort = '-createdAt',
    } = req.query;

    // Build filter
    const filter = { active: true };

    // Add optional filters if provided
    if (customer) filter.customer = mongoose.Types.ObjectId(customer);
    if (project) filter.project = mongoose.Types.ObjectId(project);
    if (assignedTechnician) {
      filter.assignedTechnician =
        assignedTechnician === 'unassigned'
          ? { $exists: false }
          : mongoose.Types.ObjectId(assignedTechnician);
    }
    if (status) {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',') };
      } else {
        filter.status = status;
      }
    }
    if (requestType) filter.requestType = requestType;
    if (priority) filter.priority = priority;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDateTime;
      }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort
    const sortOptions = {};
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortDirection = sort.startsWith('-') ? -1 : 1;
    sortOptions[sortField] = sortDirection;

    // Execute query with pagination
    const [serviceRequests, total] = await Promise.all([
      ServiceRequest.find(filter)
        .populate('customer', 'firstName lastName email phone')
        .populate('project', 'name projectNumber')
        .populate('assignedTechnician', 'firstName lastName email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .exec(),
      ServiceRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      results: total,
      page: parseInt(page),
      limit: parseInt(limit),
      data: {
        serviceRequests,
      },
    });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service requests',
      error: error.message,
    });
  }
};

// Get a single service request by ID
exports.getServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone')
      .populate('project', 'name projectNumber')
      .populate('assignedTechnician', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        serviceRequest,
      },
    });
  } catch (error) {
    console.error('Error fetching service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service request',
      error: error.message,
    });
  }
};

// Create a new service request
exports.createServiceRequest = async (req, res) => {
  try {
    // Validate request body
    const { error } = validateServiceRequest(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Verify customer exists
    const customer = await Customer.findById(req.body.customer);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Verify project exists if provided
    if (req.body.project) {
      const project = await Project.findById(req.body.project);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found',
        });
      }
    }

    // Create service request
    const serviceRequest = new ServiceRequest({
      ...req.body,
      createdBy: req.user.id, // Assuming user info is in request from auth middleware
    });

    // Set status based on whether a technician is assigned
    if (req.body.assignedTechnician && serviceRequest.status === 'new') {
      serviceRequest.status = 'assigned';
    }

    await serviceRequest.save();

    // Fetch populated service request to return
    const populatedRequest = await ServiceRequest.findById(serviceRequest._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('project', 'name projectNumber')
      .populate('assignedTechnician', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      data: {
        serviceRequest: populatedRequest,
      },
    });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service request',
      error: error.message,
    });
  }
};

// Update a service request
exports.updateServiceRequest = async (req, res) => {
  try {
    // Validate request body
    const { error } = validateServiceRequest(req.body, true);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Find service request
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
      });
    }

    // Check if updating customer or project, verify they exist
    if (req.body.customer) {
      const customer = await Customer.findById(req.body.customer);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
      }
    }

    if (req.body.project) {
      const project = await Project.findById(req.body.project);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found',
        });
      }
    }

    // Handle status changes
    if (req.body.status && req.body.status !== serviceRequest.status) {
      if (req.body.status === 'completed' && !req.body.completionDate) {
        req.body.completionDate = new Date();
      }
    }

    // Auto-update status when technician is assigned
    if (
      req.body.assignedTechnician &&
      !serviceRequest.assignedTechnician &&
      serviceRequest.status === 'new'
    ) {
      req.body.status = 'assigned';
    }

    // Update service request
    Object.keys(req.body).forEach((key) => {
      serviceRequest[key] = req.body[key];
    });

    await serviceRequest.save();

    // Fetch populated updated service request
    const updatedRequest = await ServiceRequest.findById(serviceRequest._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('project', 'name projectNumber')
      .populate('assignedTechnician', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Service request updated successfully',
      data: {
        serviceRequest: updatedRequest,
      },
    });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service request',
      error: error.message,
    });
  }
};

// Delete a service request
exports.deleteServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
      });
    }

    // Soft delete by setting active to false
    serviceRequest.active = false;
    await serviceRequest.save();

    res.status(200).json({
      success: true,
      message: 'Service request deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service request',
      error: error.message,
    });
  }
};

// Add a note to a service request
exports.addNote = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Note text is required',
      });
    }

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
      });
    }

    // Add the note
    serviceRequest.notes.push({
      text,
      createdBy: req.user.id,
      createdAt: Date.now(),
    });

    await serviceRequest.save();

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: {
        notes: serviceRequest.notes,
      },
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message,
    });
  }
};

// Assign a technician to a service request
exports.assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        success: false,
        message: 'Technician ID is required',
      });
    }

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
      });
    }

    // Use the model method to assign technician
    await serviceRequest.assignTechnician(technicianId);

    // Fetch populated service request
    const updatedRequest = await ServiceRequest.findById(serviceRequest._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('project', 'name projectNumber')
      .populate('assignedTechnician', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Technician assigned successfully',
      data: {
        serviceRequest: updatedRequest,
      },
    });
  } catch (error) {
    console.error('Error assigning technician:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign technician',
      error: error.message,
    });
  }
};

// Update the status of a service request
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const validStatuses = [
      'new',
      'assigned',
      'in_progress',
      'on_hold',
      'completed',
      'cancelled',
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
      });
    }

    // Use the model method to update status
    await serviceRequest.updateStatus(status);

    // Fetch populated service request
    const updatedRequest = await ServiceRequest.findById(serviceRequest._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('project', 'name projectNumber')
      .populate('assignedTechnician', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: {
        serviceRequest: updatedRequest,
      },
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message,
    });
  }
};

// Schedule a service request
exports.scheduleService = async (req, res) => {
  try {
    const { scheduledDate } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date is required',
      });
    }

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
      });
    }

    // Use the model method to schedule service
    await serviceRequest.scheduleService(new Date(scheduledDate));

    // Fetch populated service request
    const updatedRequest = await ServiceRequest.findById(serviceRequest._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('project', 'name projectNumber')
      .populate('assignedTechnician', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Service request scheduled successfully',
      data: {
        serviceRequest: updatedRequest,
      },
    });
  } catch (error) {
    console.error('Error scheduling service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule service request',
      error: error.message,
    });
  }
};

// Complete a service request
exports.completeService = async (req, res) => {
  try {
    const { completionDate, notes } = req.body;

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
      });
    }

    // Use the model method to complete service
    await serviceRequest.completeService(
      completionDate ? new Date(completionDate) : null,
      notes
    );

    // Fetch populated service request
    const updatedRequest = await ServiceRequest.findById(serviceRequest._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('project', 'name projectNumber')
      .populate('assignedTechnician', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Service request completed successfully',
      data: {
        serviceRequest: updatedRequest,
        notes: serviceRequest.notes,
      },
    });
  } catch (error) {
    console.error('Error completing service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete service request',
      error: error.message,
    });
  }
};

// Get service requests for a specific customer
exports.getCustomerServiceRequests = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Get service requests for the customer
    const serviceRequests = await ServiceRequest.find({
      customer: customerId,
      active: true,
    })
      .populate('project', 'name projectNumber')
      .populate('assignedTechnician', 'firstName lastName email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: serviceRequests.length,
      data: {
        serviceRequests,
      },
    });
  } catch (error) {
    console.error('Error fetching customer service requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer service requests',
      error: error.message,
    });
  }
};

// Get service requests for a specific project
exports.getProjectServiceRequests = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Get service requests for the project
    const serviceRequests = await ServiceRequest.find({
      project: projectId,
      active: true,
    })
      .populate('customer', 'firstName lastName email phone')
      .populate('assignedTechnician', 'firstName lastName email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: serviceRequests.length,
      data: {
        serviceRequests,
      },
    });
  } catch (error) {
    console.error('Error fetching project service requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project service requests',
      error: error.message,
    });
  }
};
