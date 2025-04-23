const Project = require('../models/project.model');
const Customer = require('../models/customer.model');
const Proposal = require('../models/proposal.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

// Get all projects with filtering, sorting, and pagination
exports.getAllProjects = catchAsync(async (req, res, _next) => {
  // BUILD FILTER CONDITIONS
  const filterConditions = {};

  // 1) Add standard filters from req.query (e.g., status, stage, projectManager)
  const standardFilters = { ...req.query };
  // Exclude fields handled separately (pagination, sorting, etc.)
  const excludedFields = ['page', 'sort', 'limit', 'fields', '_cb'];
  excludedFields.forEach((el) => delete standardFilters[el]);

  Object.keys(standardFilters).forEach((key) => {
    if (
      standardFilters[key] !== '' &&
      standardFilters[key] !== undefined &&
      standardFilters[key] !== null
    ) {
      // Handle specific fields like projectManager which might be nested
      if (key === 'projectManager') {
        filterConditions['team.projectManager'] = standardFilters[key];
      } else {
        // Basic equality check for other fields (status, stage)
        filterConditions[key] = standardFilters[key];
      }
      // Add logic here if range filters (gte, lte) or search are needed
    }
  });

  // Note: The 'active' filter is handled by the pre-find middleware in the model.

  console.log(
    'getAllProjects - Final filter conditions before find:',
    JSON.stringify(filterConditions)
  );

  // BUILD QUERY (Find + Sort + Paginate)
  // Apply all calculated filters at once. The 'active' filter is added by pre-find middleware.
  let query = Project.find(filterConditions);

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

  // EXECUTE QUERY & COUNT
  const projects = await query; // Query for the current page
  const totalProjects = await Project.countDocuments(filterConditions); // Count total matching documents (middleware adds active:true)

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: totalProjects, // Return total count for pagination
    data: {
      projects, // Return projects for the current page
    },
  });
  // No return needed here as it's the main function body
});

// Get project by ID
exports.getProject = catchAsync(async (req, res, next) => {
  // Fetch project, populating only fields essential for the initial overview
  const project = await Project.findById(req.params.id)
    // Populate team members needed for overview
    .populate({
      path: 'team.projectManager team.salesRep team.designer team.installationTeam',
      select: 'firstName lastName email', // Select necessary fields
    })
    // Populate issue reporter needed for overview
    .populate({
      path: 'issues.reportedBy',
      select: 'firstName lastName email',
    });
  // Note: Other populations (proposal, notes, documents, full issues, financials)
  // should ideally be loaded on demand by separate requests from the frontend.

  if (!project) {
    return next(new AppError('No project found with that ID', 404)); // Added return
  }

  res.status(200).json({
    status: 'success',
    data: {
      project,
    },
  });
  // No return needed here as it's the main function body
});

// Create new project
exports.createProject = catchAsync(async (req, res, next) => {
  // Set the creator to the current user
  req.body.createdBy = req.user.id;

  // Verify that the customer exists
  const customer = await Customer.findById(req.body.customer);
  if (!customer) {
    return next(new AppError('No customer found with that ID', 404)); // Added return
  }
  // Log the fetched customer's address
  console.log(
    `DEBUG: Fetched Customer ${customer._id} address data:`,
    JSON.stringify(customer.address, null, 2)
  );

  // Verify that the proposal exists if provided
  if (req.body.proposal) {
    const proposal = await Proposal.findById(req.body.proposal);
    if (!proposal) {
      return next(new AppError('No proposal found with that ID', 404)); // Added return
    }

    // Auto-populate project data from proposal if not provided
    if (!req.body.systemSize) req.body.systemSize = proposal.systemSize;
    if (!req.body.panelCount) req.body.panelCount = proposal.panelCount;
    if (!req.body.panelType) req.body.panelType = proposal.panelType;
    if (!req.body.inverterType) req.body.inverterType = proposal.inverterType;
    if (!req.body.includesBattery)
      req.body.includesBattery = proposal.includesBattery;
    if (proposal.includesBattery) {
      if (!req.body.batteryType) req.body.batteryType = proposal.batteryType;
      if (!req.body.batteryCount) req.body.batteryCount = proposal.batteryCount;
    }
    // --> ADDED: Copy projectType from proposal if not provided in request <--
    if (!req.body.projectType) req.body.projectType = proposal.projectType;

    // Set financials if not provided
    if (!req.body.financials || !req.body.financials.totalContractValue) {
      if (!req.body.financials) req.body.financials = {};
      req.body.financials.totalContractValue = proposal.pricing.netCost;
    }
  }

  // --- Handle Install Address ---
  let finalInstallAddress = {}; // Start with an empty object

  // Use customer address as a base if it exists and is an object
  if (customer.address && typeof customer.address === 'object') {
    finalInstallAddress = { ...customer.address }; // Copy customer address
    console.log(
      'Using customer address as base:',
      JSON.stringify(finalInstallAddress)
    );
  }

  // Override with fields from req.body.installAddress if it exists and is an object
  if (req.body.installAddress && typeof req.body.installAddress === 'object') {
    console.log(
      'Merging with req.body.installAddress:',
      JSON.stringify(req.body.installAddress)
    );
    finalInstallAddress = {
      ...finalInstallAddress,
      ...req.body.installAddress,
    }; // Merge, req.body takes precedence
  }

  // Ensure installAddress is at least an object if it exists, otherwise let Mongoose handle defaults/validation
  if (finalInstallAddress && typeof finalInstallAddress === 'object') {
    req.body.installAddress = finalInstallAddress;
    console.log(
      'Final installAddress being used:',
      JSON.stringify(finalInstallAddress)
    );
  } else {
    // If neither request nor customer provided a valid address object,
    // ensure it's not set or is set to null/undefined depending on model schema defaults
    // In this case, since sub-fields are not required, we can just ensure it's not invalid
    req.body.installAddress =
      finalInstallAddress && typeof finalInstallAddress === 'object'
        ? finalInstallAddress
        : {};
    console.log(
      'Install address was incomplete or invalid, using default empty object or letting model handle it.'
    );
  }
  // --- End Handle Install Address ---

  // --- Ensure Numeric Types ---
  // Explicitly parse potentially stringified numbers from req.body
  if (req.body.systemSize)
    req.body.systemSize = parseFloat(req.body.systemSize);
  if (req.body.panelCount)
    req.body.panelCount = parseInt(req.body.panelCount, 10); // Added radix 10
  if (req.body.financials && req.body.financials.totalContractValue) {
    req.body.financials.totalContractValue = parseFloat(
      req.body.financials.totalContractValue
    );
  }
  // Add similar parsing for other numeric fields if needed (e.g., batteryCount)
  if (req.body.batteryCount)
    req.body.batteryCount = parseInt(req.body.batteryCount, 10);
  // --- End Ensure Numeric Types ---

  // Log the final data being sent to Project.create
  console.log('Data for Project.create:', JSON.stringify(req.body, null, 2));

  let newProject;
  try {
    newProject = await Project.create(req.body);
  } catch (error) {
    console.error('Error during Project.create:', error); // Log the full error
    // Pass the error to the global error handler
    return next(new AppError(`Project creation failed: ${error.message}`, 400)); // Added return
  }

  return res.status(201).json({
    // Added return
    status: 'success',
    data: {
      project: newProject,
    },
  });
});

// Update project
exports.updateProject = catchAsync(async (req, res, next) => {
  // Exclude fields that shouldn't be updated via this generic route
  const excludedFields = [
    'customer',
    'proposal',
    'createdBy',
    'financials',
    'active',
  ];
  const filteredBody = { ...req.body };
  excludedFields.forEach((el) => delete filteredBody[el]);

  const project = await Project.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!project) {
    return next(new AppError('No project found with that ID', 404)); // Added return
  }

  res.status(200).json({
    status: 'success',
    data: {
      project,
    },
  });
  // No return needed here as it's the main function body
});

// Delete project (soft delete)
exports.deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(req.params.id, {
    active: false,
  });

  if (!project) {
    return next(new AppError('No project found with that ID', 404)); // Added return
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
  // No return needed for 204 status
});

// Update project status
exports.updateProjectStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body; // Extract status from body

  // Basic validation (optional, depends on requirements)
  if (!status) {
    return next(new AppError('Please provide a status to update.', 400));
  }
  // Could add validation against allowed statuses here

  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { status }, // Update only the status field
    { new: true, runValidators: true }
  );

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      project,
    },
  });
});

// Update project stage
exports.updateProjectStage = catchAsync(async (req, res, next) => {
  const { stage } = req.body; // Extract stage from body

  // Basic validation (optional)
  if (!stage) {
    return next(new AppError('Please provide a stage to update.', 400));
  }
  // Could add validation against allowed stages here

  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { stage }, // Update only the stage field
    { new: true, runValidators: true }
  );

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      project,
    },
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
      project,
    },
  });
  // No return needed here as it's the main function body
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
      project,
    },
  });
  // No return needed here as it's the main function body
});

// Update a specific issue within a project
exports.updateProjectIssue = catchAsync(async (req, res, next) => {
  const { id, issueId } = req.params; // Project ID and Issue ID
  const updateData = req.body; // Data to update the issue with

  // Prevent updating immutable fields like _id or reportedBy if necessary
  delete updateData._id;
  delete updateData.reportedBy;
  delete updateData.createdAt; // Usually shouldn't be updated

  // If status is being changed to resolved, add resolution date automatically
  if (updateData.status === 'resolved' && !updateData.resolvedAt) {
    updateData.resolvedAt = Date.now();
  }

  // Build the $set object for findOneAndUpdate using the positional operator $
  const setUpdate = {};
  for (const key in updateData) {
    if (Object.prototype.hasOwnProperty.call(updateData, key)) {
      setUpdate[`issues.$.${key}`] = updateData[key];
    }
  }

  // Perform the atomic update
  const updatedProject = await Project.findOneAndUpdate(
    { _id: id, 'issues._id': issueId }, // Query to find the project and the specific issue
    { $set: setUpdate }, // Use $set with positional operator
    { new: true, runValidators: true } // Options: return updated doc, run schema validators
  );

  if (!updatedProject) {
    return next(
      new AppError(
        'Failed to update issue. Project or issue may no longer exist or validation failed.',
        404
      )
    );
  }

  // Find the updated issue within the returned project document
  const updatedIssue = updatedProject.issues.id(issueId);
  if (!updatedIssue) {
    // Should not happen if findOneAndUpdate succeeded, but safety check
    return next(new AppError('Failed to retrieve updated issue data.', 500));
  }

  res.status(200).json({
    status: 'success',
    data: {
      issue: updatedIssue, // Return the updated issue object
    },
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
      project,
    },
  });
  // No return needed here as it's the main function body
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
      project,
    },
  });
  // No return needed here as it's the main function body
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
      project,
    },
  });
  // No return needed here as it's the main function body
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
      project,
    },
  });
  // No return needed here as it's the main function body
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
      project,
    },
  });
  // No return needed here as it's the main function body
});

// Get project statistics
exports.getProjectStats = catchAsync(async (req, res, _next) => {
  const stats = await Project.aggregate([
    {
      $match: { active: true },
    },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        avgContractValue: { $avg: '$financials.totalContractValue' },
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

// --- Task Management ---

// Add a task to a project
exports.addTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const taskData = req.body;

  // Set the creator of the task
  taskData.createdBy = req.user.id;

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  // Add the task to the project's tasks array
  // Ensure dependsOn contains valid task IDs if provided
  if (taskData.dependsOn) {
    taskData.dependsOn = taskData.dependsOn.filter((depId) =>
      project.tasks.some((t) => t._id.equals(depId))
    );
  }
  project.tasks.push(taskData);
  await project.save(); // Use save to trigger potential middleware if needed

  // Find the newly added task (Mongoose adds _id upon push)
  // Note: This assumes the last task added is the new one. Might need refinement if parallel adds occur.
  const newTask = project.tasks[project.tasks.length - 1];

  res.status(201).json({
    status: 'success',
    data: {
      task: newTask, // Return the newly created task object
    },
  });
  // No return needed here as it's the main function body
});

// Update a specific task within a project using findOneAndUpdate for atomicity
exports.updateTask = catchAsync(async (req, res, next) => {
  const { id, taskId } = req.params;
  const updateData = req.body;

  // --- Pre-computation/Validation (like dependency check) ---
  // Fetch the project first to perform checks that require context
  const projectForCheck = await Project.findOne({
    _id: id,
    'tasks._id': taskId,
  }).select('tasks'); // Select only tasks for efficiency
  if (!projectForCheck) {
    return next(
      new AppError('No project or task found with the given IDs', 404)
    );
  }
  const taskForCheck = projectForCheck.tasks.id(taskId);
  if (!taskForCheck) {
    // Should not happen if projectForCheck was found, but good safety check
    return next(new AppError('Task not found within the project', 404));
  }

  // Dependency Check (using projectForCheck and taskForCheck)
  if (
    updateData.status &&
    (updateData.status === 'in_progress' || updateData.status === 'done') &&
    taskForCheck.dependsOn &&
    taskForCheck.dependsOn.length > 0
  ) {
    const dependencies = projectForCheck.tasks.filter((t) =>
      taskForCheck.dependsOn.includes(t._id)
    );
    const incompleteDependencies = dependencies.filter(
      (dep) => dep.status !== 'done'
    );
    if (incompleteDependencies.length > 0) {
      const incompleteTaskDescriptions = incompleteDependencies
        .map((t) => t.description)
        .join(', ');
      return next(
        new AppError(
          `Cannot update task status. Prerequisite tasks not completed: ${incompleteTaskDescriptions}`,
          400
        )
      );
    }
  }

  // Ensure dependsOn contains valid task IDs if provided in update
  if (updateData.dependsOn) {
    updateData.dependsOn = updateData.dependsOn.filter((depId) =>
      projectForCheck.tasks.some(
        (t) => t._id.equals(depId) && !t._id.equals(taskId)
      )
    );
  }
  // --- End Pre-computation/Validation ---

  // Build the $set object for findOneAndUpdate using the positional operator $
  const setUpdate = {};
  for (const key in updateData) {
    // Ensure we only update fields present in the request body
    if (Object.prototype.hasOwnProperty.call(updateData, key)) {
      // Handle potential nested fields if necessary in the future, for now assume flat task structure
      setUpdate[`tasks.$.${key}`] = updateData[key];
    }
  }

  // Perform the atomic update
  const updatedProject = await Project.findOneAndUpdate(
    { _id: id, 'tasks._id': taskId }, // Query to find the project and the specific task
    { $set: setUpdate }, // Use $set with positional operator
    { new: true, runValidators: true } // Options: return updated doc, run schema validators
  );

  if (!updatedProject) {
    // This could happen if the document was deleted between the check and the update, or if validation failed
    return next(
      new AppError(
        'Failed to update task. Project or task may no longer exist or validation failed.',
        404
      )
    );
  }

  // Find the updated task within the returned project document
  const updatedTask = updatedProject.tasks.id(taskId);
  if (!updatedTask) {
    // Should not happen if findOneAndUpdate succeeded, but safety check
    return next(new AppError('Failed to retrieve updated task data.', 500));
  }

  res.status(200).json({
    status: 'success',
    data: {
      task: updatedTask, // Return the updated task object
    },
  });
  // No return needed here as it's the main function body
});

// Delete a specific task from a project
exports.deleteTask = catchAsync(async (req, res, next) => {
  const { id, taskId } = req.params;

  const project = await Project.findByIdAndUpdate(
    id,
    { $pull: { tasks: { _id: taskId } } }, // Use $pull to remove the task subdocument
    { new: true } // Option to return the updated project if needed, though not strictly necessary for delete
  );

  if (!project) {
    // Note: This check might not reliably tell if the *task* existed, only if the project did.
    // If findByIdAndUpdate doesn't find the project, it returns null.
    // If it finds the project but the $pull condition doesn't match any task, it still returns the project (unchanged).
    // A pre-check might be needed if differentiating "project not found" vs "task not found" is critical.
    // For now, assume if the project exists, the operation was attempted.
    return next(
      new AppError(
        'No project found with that ID, or task deletion failed',
        404
      )
    );
  }

  // Check if the task was actually removed (optional, requires comparing before/after or checking update result)
  // For simplicity, we assume success if the project was found and updated.

  res.status(204).json({
    status: 'success',
    data: null,
  });
  // No return needed for 204 status
});
