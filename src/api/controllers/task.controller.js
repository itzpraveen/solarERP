const Project = require('../models/project.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

// Add a new task to a project
exports.createTask = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;
  const { description, assignedTo, dueDate } = req.body;

  if (!description) {
    return next(new AppError('Task description is required.', 400));
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found.', 404));
  }

  // Add the new task to the project's tasks array
  project.tasks.push({
    description,
    assignedTo: assignedTo || undefined, // Handle optional assignment
    dueDate: dueDate || undefined, // Handle optional due date
    createdBy: req.user.id, // Assuming req.user is populated by auth middleware
  });

  await project.save();

  // Return the newly added task (last element in the array)
  const newTask = project.tasks[project.tasks.length - 1];

  res.status(201).json({
    status: 'success',
    data: {
      task: newTask,
    },
  });
});

// Update an existing task within a project
exports.updateTask = catchAsync(async (req, res, next) => {
  const { projectId, taskId } = req.params;
  const { description, status, assignedTo, dueDate } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found.', 404));
  }

  // Find the task within the project's tasks array
  const task = project.tasks.id(taskId);
  if (!task) {
    return next(new AppError('Task not found within this project.', 404));
  }

  // Update task properties if provided
  if (description) task.description = description;
  if (status) task.status = status;
  if (assignedTo !== undefined) task.assignedTo = assignedTo; // Allow setting to null/undefined
  if (dueDate !== undefined) task.dueDate = dueDate; // Allow setting to null/undefined

  await project.save();

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});

// Delete a task from a project
exports.deleteTask = catchAsync(async (req, res, next) => {
  const { projectId, taskId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found.', 404));
  }

  // Find the task to remove
  const task = project.tasks.id(taskId);
  if (!task) {
    return next(new AppError('Task not found within this project.', 404));
  }

  // Remove the task using the pull method (Mongoose >= 5.9)
  project.tasks.pull(taskId);

  // // Alternative for older Mongoose versions:
  // const taskIndex = project.tasks.findIndex(t => t._id.toString() === taskId);
  // if (taskIndex === -1) {
  //   return next(new AppError('Task not found within this project.', 404));
  // }
  // project.tasks.splice(taskIndex, 1);

  await project.save();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});