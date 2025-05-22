const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
const Project = require('../models/project.model');
const Customer = require('../models/customer.model');
const Proposal = require('../models/proposal.model');
const Inventory = require('../models/inventory.model'); // Import Inventory model
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

// INTERNAL function for stage update logic & stock management (to be called within a transaction)
// eslint-disable-next-line no-unused-vars
const _updateProjectStageAndManageStock = async (
  projectDocument,
  newStage,
  userId,
  session
) => {
  // eslint-disable-next-line no-param-reassign
  projectDocument.stage = newStage;

  // If stage is 'in_progress', commit allocated stock from proposal
  if (newStage === 'in_progress' && projectDocument.proposal) {
    const proposal = await Proposal.findById(projectDocument.proposal)
      .populate('lineItems.itemId')
      .session(session);
    if (proposal && proposal.lineItems && proposal.lineItems.length > 0) {
      const equipmentUsedEntries = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const lineItem of proposal.lineItems) {
        if (lineItem.itemId && lineItem.quantity > 0) {
          // eslint-disable-next-line no-await-in-loop
          const inventoryItem = await Inventory.findById(
            lineItem.itemId._id
          ).session(session);
          if (!inventoryItem) {
            console.warn(
              `Inventory item ${lineItem.itemId.name || lineItem.itemId._id} not found during stock commitment for project ${projectDocument._id}.`
            );
            // eslint-disable-next-line no-continue
            continue;
          }
          if (inventoryItem.reservedQuantity < lineItem.quantity) {
            console.warn(
              `Not enough reserved stock for ${inventoryItem.name} to commit for project ${projectDocument._id}. Reserved: ${inventoryItem.reservedQuantity}, Needed: ${lineItem.quantity}. Skipping commitment for this item.`
            );
            // eslint-disable-next-line no-continue
            continue;
          }
          if (inventoryItem.quantity < lineItem.quantity) {
            console.warn(
              `Not enough physical stock for ${inventoryItem.name} to commit for project ${projectDocument._id}. Physical: ${inventoryItem.quantity}, Needed: ${lineItem.quantity}. Skipping commitment for this item.`
            );
            // eslint-disable-next-line no-continue
            continue;
          }

          inventoryItem.quantity -= lineItem.quantity;
          inventoryItem.reservedQuantity -= lineItem.quantity;

          inventoryItem.stockLog.push({
            type: 'committed',
            quantityChange: -lineItem.quantity, // Negative for consumption
            createdBy: userId,
            notes: `Committed for Project: ${projectDocument.name} (ID: ${projectDocument._id})`,
            referenceDocument: `ProjectID:${projectDocument._id}`,
            createdAt: new Date(),
          });
          // eslint-disable-next-line no-await-in-loop
          await inventoryItem.save({ session });

          equipmentUsedEntries.push({
            item: inventoryItem._id,
            quantityUsed: lineItem.quantity,
            notes: `Committed from proposal line item for project ${projectDocument.name}`,
            // serialNumbersUsed: [] // Placeholder if serial tracking is added later
          });
        }
      }
      if (equipmentUsedEntries.length > 0) {
        // eslint-disable-next-line no-param-reassign
        projectDocument.equipmentUsed = projectDocument.equipmentUsed
          ? projectDocument.equipmentUsed.concat(equipmentUsedEntries)
          : equipmentUsedEntries;
      }
    }
  }
  // Note: Logic for releasing stock on 'cancelled' status is handled in updateProjectStatus,
  // as 'cancelled' is a status, not typically a stage. If a stage implies cancellation, add here.

  await projectDocument.save({ session });
  return projectDocument;
};

// Add payment to project's payment schedule
exports.addProjectPayment = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  project.financials.paymentSchedule.push(req.body);
  await project.save();

  const newPayment =
    project.financials.paymentSchedule[
      project.financials.paymentSchedule.length - 1
    ];
  return res.status(201).json({
    status: 'success',
    data: {
      payment: newPayment,
      project, // Return the updated project
    },
  });
});

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
      if (key === 'projectManager') {
        filterConditions['team.projectManager'] = standardFilters[key];
      } else {
        filterConditions[key] = standardFilters[key];
      }
    }
  });

  console.log(
    'getAllProjects - Final filter conditions before find:',
    JSON.stringify(filterConditions)
  );

  let query = Project.find(filterConditions);

  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }

  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  const projects = await query;
  const totalProjects = await Project.countDocuments(filterConditions);

  return res.status(200).json({
    status: 'success',
    results: totalProjects,
    data: {
      projects,
    },
  });
});

// Get project by ID
exports.getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate({
      path: 'team.projectManager team.salesRep team.designer team.installationTeam',
      select: 'firstName lastName email',
    })
    .populate({
      path: 'issues.reportedBy',
      select: 'firstName lastName email',
    })
    .populate('customer', 'firstName lastName email phone address')
    .populate('proposal', 'name proposalId')
    .populate('equipmentUsed.item', 'name sku modelNumber category');

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  return res.status(200).json({
    status: 'success',
    data: {
      project,
    },
  });
});

// Create new project
exports.createProject = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  const customer = await Customer.findById(req.body.customer);
  if (!customer) {
    return next(new AppError('No customer found with that ID', 404));
  }

  let proposalDetails = null;
  if (req.body.proposal) {
    proposalDetails = await Proposal.findById(req.body.proposal).populate(
      'lineItems.itemId'
    );
    if (!proposalDetails) {
      return next(new AppError('No proposal found with that ID', 404));
    }

    if (!req.body.systemSize) req.body.systemSize = proposalDetails.systemSize;
    if (!req.body.panelCount) req.body.panelCount = proposalDetails.panelCount;
    if (!req.body.panelType) req.body.panelType = proposalDetails.panelType;
    if (!req.body.inverterType)
      req.body.inverterType = proposalDetails.inverterType;
    if (req.body.includesBattery === undefined)
      req.body.includesBattery = proposalDetails.includesBattery;
    if (proposalDetails.includesBattery) {
      if (!req.body.batteryType)
        req.body.batteryType = proposalDetails.batteryType;
      if (!req.body.batteryCount)
        req.body.batteryCount = proposalDetails.batteryCount;
    }
    if (!req.body.projectType)
      req.body.projectType = proposalDetails.projectType;

    // Populate financial details from proposal, including GST
    if (!req.body.financials) req.body.financials = {};

    // totalContractValue in project should be the pre-GST value from proposal's finalProjectCost
    if (proposalDetails.finalProjectCost !== undefined) {
      req.body.financials.totalContractValue = proposalDetails.finalProjectCost;
    }
    if (proposalDetails.taxableAmount !== undefined) {
      req.body.financials.taxableAmount = proposalDetails.taxableAmount;
    }
    if (proposalDetails.cgstRate !== undefined)
      req.body.financials.cgstRate = proposalDetails.cgstRate;
    if (proposalDetails.sgstRate !== undefined)
      req.body.financials.sgstRate = proposalDetails.sgstRate;
    if (proposalDetails.igstRate !== undefined)
      req.body.financials.igstRate = proposalDetails.igstRate;
    if (proposalDetails.cgstAmount !== undefined)
      req.body.financials.cgstAmount = proposalDetails.cgstAmount;
    if (proposalDetails.sgstAmount !== undefined)
      req.body.financials.sgstAmount = proposalDetails.sgstAmount;
    if (proposalDetails.igstAmount !== undefined)
      req.body.financials.igstAmount = proposalDetails.igstAmount;
    if (proposalDetails.totalGstAmount !== undefined) {
      req.body.financials.totalGstAmount = proposalDetails.totalGstAmount;
    }
    if (proposalDetails.totalAmountWithGST !== undefined) {
      req.body.financials.totalAmountWithGST =
        proposalDetails.totalAmountWithGST;
    }
    if (proposalDetails.subsidyAmount !== undefined) {
      req.body.financials.subsidyAmount = proposalDetails.subsidyAmount;
    }
    // netInvestment from proposal becomes netCustomerPayable in project
    if (proposalDetails.netInvestment !== undefined) {
      req.body.financials.netCustomerPayable = proposalDetails.netInvestment;
    }
    if (proposalDetails.currency) {
      // Ensure currency is also copied
      req.body.financials.totalContractValueCurrency = proposalDetails.currency;
    }
  }

  if (customer.address && typeof customer.address === 'object') {
    req.body.installAddress = {
      ...customer.address,
      ...req.body.installAddress,
    };
  }

  if (req.body.systemSize)
    req.body.systemSize = parseFloat(req.body.systemSize);
  if (req.body.panelCount)
    req.body.panelCount = parseInt(req.body.panelCount, 10);
  if (req.body.financials && req.body.financials.totalContractValue) {
    req.body.financials.totalContractValue = parseFloat(
      req.body.financials.totalContractValue
    );
  }
  if (req.body.batteryCount)
    req.body.batteryCount = parseInt(req.body.batteryCount, 10);

  let newProject;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const projectToCreate = new Project(req.body);
      // eslint-disable-next-line prefer-destructuring
      newProject = (await Project.create([projectToCreate], { session }))[0];

      if (
        proposalDetails &&
        proposalDetails.lineItems &&
        proposalDetails.lineItems.length > 0
      ) {
        // eslint-disable-next-line no-restricted-syntax
        for (const lineItem of proposalDetails.lineItems) {
          if (lineItem.itemId && lineItem.quantity > 0) {
            // eslint-disable-next-line no-await-in-loop
            const inventoryItem = await Inventory.findById(
              lineItem.itemId._id
            ).session(session);
            if (!inventoryItem) {
              throw new AppError(
                `Inventory item ${lineItem.itemId.name || lineItem.itemId._id} not found for allocation.`,
                404
              );
            }
            if (inventoryItem.availableQuantity < lineItem.quantity) {
              throw new AppError(
                `Not enough available stock for ${inventoryItem.name}. Available: ${inventoryItem.availableQuantity}, Required: ${lineItem.quantity}`,
                400
              );
            }
            inventoryItem.reservedQuantity += lineItem.quantity;

            inventoryItem.stockLog.push({
              type: 'allocated',
              quantityChange: lineItem.quantity,
              createdBy: req.user.id,
              notes: `Allocated for Project: ${newProject.name} (ID: ${newProject._id})`,
              referenceDocument: `ProjectID:${newProject._id}`,
              createdAt: new Date(),
            });
            // eslint-disable-next-line no-await-in-loop
            await inventoryItem.save({ session });
          }
        }
      }
    });
  } catch (error) {
    console.error('Error during Project.create and stock allocation:', error);
    // Ensure session is ended if an error occurs before next() is called or response sent
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    return next(
      new AppError(
        `Project creation failed: ${error.message}`,
        error.statusCode || 400
      )
    );
  } finally {
    if (session.inTransaction()) {
      // Check if transaction is still active before ending
      await session.abortTransaction(); // Or commit if appropriate, but abort is safer on general finally
    }
    await session.endSession();
  }

  if (!newProject) {
    return next(
      new AppError('Project creation failed, project data not available.', 500)
    );
  }

  const populatedProject = await Project.findById(newProject._id)
    .populate('customer')
    .populate('proposal');

  return res.status(201).json({
    status: 'success',
    data: {
      project: populatedProject, // Send populated project
    },
  });
});

// Update project (general details)
exports.updateProject = catchAsync(async (req, res, next) => {
  const excludedFields = [
    'customer',
    'proposal',
    'createdBy',
    'financials',
    'active',
    'equipmentUsed',
    'stage',
    'status',
  ];
  const filteredBody = { ...req.body };
  excludedFields.forEach((el) => delete filteredBody[el]);

  const project = await Project.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  return res.status(200).json({
    status: 'success',
    data: {
      project,
    },
  });
});

// Deactivate project (soft delete)
exports.deleteProject = catchAsync(async (req, res, next) => {
  // Note: Consider releasing allocated stock if a project is soft-deleted and not yet 'in_progress'
  // This logic is currently in updateProjectStatus when status becomes 'cancelled'.
  // If soft-deleting via this route should also trigger stock release, add similar logic here.
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true }
  );

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  return res.status(200).json({
    // Return the deactivated project
    status: 'success',
    message: 'Project deactivated successfully.',
    data: { project },
  });
});

// Update project stage (uses transaction and stock logic)
// eslint-disable-next-line no-unused-vars
exports.updateProjectStage = catchAsync(async (req, res, next) => {
  const { stage } = req.body;
  const userId = req.user ? req.user.id : undefined;

  if (!stage) {
    return next(new AppError('Please provide a stage to update.', 400));
  }

  let updatedProjectDoc;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const project = await Project.findById(req.params.id).session(session);
      if (!project) {
        throw new AppError('No project found with that ID', 404);
      }
      updatedProjectDoc = await _updateProjectStageAndManageStock(
        project,
        stage,
        userId,
        session
      );
    });
  } catch (error) {
    // Session ending is handled in finally
    console.error(
      'Error during project stage update and stock management:',
      error
    );
    return next(
      new AppError(
        `Project stage update failed: ${error.message}`,
        error.statusCode || 400
      )
    );
  } finally {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
  }

  if (!updatedProjectDoc) {
    // Should be caught by try-catch
    return next(
      new AppError(
        'Project stage update failed, project data not available.',
        500
      )
    );
  }

  const populatedProject = await Project.findById(updatedProjectDoc._id)
    .populate('customer', 'firstName lastName email')
    .populate('proposal', 'name proposalId')
    .populate('equipmentUsed.item', 'name sku modelNumber category')
    .populate(
      'team.projectManager team.salesRep team.designer',
      'firstName lastName email'
    );

  return res.status(200).json({
    status: 'success',
    data: {
      project: populatedProject,
    },
  });
});

// Update project status (handles stock release on cancellation)
exports.updateProjectStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const userId = req.user ? req.user.id : undefined;

  if (!status) {
    return next(new AppError('Please provide a status to update.', 400));
  }

  let updatedProjectDoc;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const project = await Project.findById(req.params.id).session(session);
      if (!project) {
        throw new AppError('No project found with that ID', 404);
      }

      const oldStatus = project.status;
      // eslint-disable-next-line no-param-reassign
      project.status = status;

      if (
        status === 'cancelled' &&
        oldStatus !== 'cancelled' &&
        project.proposal
      ) {
        const proposal = await Proposal.findById(project.proposal)
          .populate('lineItems.itemId')
          .session(session);
        if (proposal && proposal.lineItems && proposal.lineItems.length > 0) {
          // eslint-disable-next-line no-restricted-syntax
          for (const lineItem of proposal.lineItems) {
            if (lineItem.itemId && lineItem.quantity > 0) {
              // eslint-disable-next-line no-await-in-loop
              const inventoryItem = await Inventory.findById(
                lineItem.itemId._id
              ).session(session);
              if (inventoryItem && inventoryItem.reservedQuantity > 0) {
                const quantityToRelease = Math.min(
                  inventoryItem.reservedQuantity,
                  lineItem.quantity
                );
                if (quantityToRelease > 0) {
                  inventoryItem.reservedQuantity -= quantityToRelease;
                  inventoryItem.stockLog.push({
                    type: 'released',
                    quantityChange: quantityToRelease,
                    createdBy: userId,
                    notes: `Released due to project status change to cancelled: ${project.name} (ID: ${project._id})`,
                    referenceDocument: `ProjectID:${project._id}`,
                    createdAt: new Date(),
                  });
                  // eslint-disable-next-line no-await-in-loop
                  await inventoryItem.save({ session });
                }
              } else if (inventoryItem) {
                console.warn(
                  `No reserved stock to release for ${inventoryItem.name} for cancelled project ${project._id}.`
                );
              }
            }
          }
        }
      }
      await project.save({ session });
      updatedProjectDoc = project;
    });
  } catch (error) {
    console.error(
      'Error during project status update and stock release:',
      error
    );
    // Session ending is handled in finally
    return next(
      new AppError(
        `Project status update failed: ${error.message}`,
        error.statusCode || 400
      )
    );
  } finally {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
  }

  if (!updatedProjectDoc) {
    // Should be caught by try-catch
    return next(
      new AppError(
        'Project status update failed, project data not available.',
        500
      )
    );
  }

  const populatedProject = await Project.findById(updatedProjectDoc._id)
    .populate('customer', 'firstName lastName email')
    .populate('proposal', 'name proposalId')
    .populate('equipmentUsed.item', 'name sku modelNumber category')
    .populate(
      'team.projectManager team.salesRep team.designer',
      'firstName lastName email'
    );

  return res.status(200).json({
    status: 'success',
    data: {
      project: populatedProject,
    },
  });
});

// Add note to project
exports.addProjectNote = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user.id;
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $push: { notes: req.body } },
    { new: true, runValidators: true }
  ).populate('notes.createdBy', 'firstName lastName email');

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  return res.status(200).json({ status: 'success', data: { project } });
});

// Add issue to project
exports.addProjectIssue = catchAsync(async (req, res, next) => {
  req.body.reportedBy = req.user.id;
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $push: { issues: req.body } },
    { new: true, runValidators: true }
  )
    .populate('issues.reportedBy', 'firstName lastName email')
    .populate('issues.assignedTo', 'firstName lastName email');

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  const newIssue = project.issues[project.issues.length - 1]; // Get the newly added issue
  return res.status(201).json({ status: 'success', data: { issue: newIssue } });
});

// Update a specific issue within a project
exports.updateProjectIssue = catchAsync(async (req, res, next) => {
  const { id, issueId } = req.params;
  const updateData = req.body;

  delete updateData._id;
  delete updateData.reportedBy;
  // delete updateData.createdAt; // Keep if you want to allow editing, but usually not

  if (updateData.status === 'resolved' && !updateData.resolvedAt) {
    updateData.resolvedAt = Date.now();
  }

  const setUpdate = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const key in updateData) {
    if (Object.prototype.hasOwnProperty.call(updateData, key)) {
      setUpdate[`issues.$.${key}`] = updateData[key];
    }
  }

  const updatedProject = await Project.findOneAndUpdate(
    { _id: id, 'issues._id': issueId },
    { $set: setUpdate },
    { new: true, runValidators: true }
  )
    .populate('issues.reportedBy', 'firstName lastName email')
    .populate('issues.assignedTo', 'firstName lastName email');

  if (!updatedProject) {
    return next(
      new AppError(
        'Failed to update issue. Project or issue may not exist.',
        404
      )
    );
  }

  const updatedIssue = updatedProject.issues.id(issueId);
  if (!updatedIssue) {
    return next(new AppError('Failed to retrieve updated issue data.', 500));
  }
  return res
    .status(200)
    .json({ status: 'success', data: { issue: updatedIssue } });
});

// Add document to project
exports.addProjectDocument = catchAsync(async (req, res, next) => {
  req.body.uploadedBy = req.user.id;
  // Assuming fileUrl is provided in req.body (e.g., after an upload middleware)
  if (!req.body.fileUrl || !req.body.name || !req.body.type) {
    return next(
      new AppError('Document type, name, and file URL are required.', 400)
    );
  }

  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $push: { documents: req.body } },
    { new: true, runValidators: true }
  ).populate('documents.uploadedBy', 'firstName lastName email');

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  const newDocument = project.documents[project.documents.length - 1];
  return res
    .status(201)
    .json({ status: 'success', data: { document: newDocument } });
});

// Add equipment to project (manual addition, distinct from proposal-driven equipment)
// This now uses the equipmentUsed field.
exports.addProjectEquipment = catchAsync(async (req, res, next) => {
  const { itemId, quantityUsed, notes, serialNumbersUsed } = req.body;
  const userId = req.user.id;

  if (!itemId || !quantityUsed || quantityUsed <= 0) {
    return next(
      new AppError('Item ID and a positive quantity are required.', 400)
    );
  }

  let updatedProject;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const project = await Project.findById(req.params.id).session(session);
      if (!project) {
        throw new AppError('No project found with that ID', 404);
      }

      const inventoryItem = await Inventory.findById(itemId).session(session);
      if (!inventoryItem) {
        throw new AppError(`Inventory item ${itemId} not found.`, 404);
      }

      // This is a manual add, so we assume stock is available and commit it directly
      // For more robust logic, one might allocate first, then commit.
      if (inventoryItem.availableQuantity < quantityUsed) {
        // Check available, not just total
        throw new AppError(
          `Not enough available stock for ${inventoryItem.name}. Available: ${inventoryItem.availableQuantity}, Required: ${quantityUsed}`,
          400
        );
      }
      // If it was reserved, it should be unreserved and then committed.
      // For simplicity here, we directly reduce quantity. If it was reserved, reservedQuantity should also be reduced.
      // A more complex flow would check if this quantity was part of a prior reservation.

      // If this item was part of a reservation for this project, reduce reservation.
      // This part is tricky without knowing if this manual add corresponds to a prior reservation.
      // Assuming for now this is "new" equipment not previously allocated via proposal.

      inventoryItem.quantity -= quantityUsed;
      // If this item was somehow reserved outside the proposal flow, that needs handling.
      // For now, we assume direct commitment from unreserved stock.
      // If inventoryItem.reservedQuantity >= quantityUsed (meaning it was reserved), then also reduce reserved.
      // This needs a clearer workflow definition: is this adding NEW items or confirming RESERVED items?
      // Assuming this is for adding NEW items not from proposal's line items.

      inventoryItem.stockLog.push({
        type: 'committed',
        quantityChange: -quantityUsed,
        createdBy: userId,
        notes: `Manually added and committed for Project: ${project.name} (ID: ${project._id}). ${notes || ''}`,
        referenceDocument: `ProjectID:${project._id}`,
        createdAt: new Date(),
      });
      await inventoryItem.save({ session });

      project.equipmentUsed.push({
        item: itemId,
        quantityUsed,
        notes,
        serialNumbersUsed: serialNumbersUsed || [],
      });
      await project.save({ session });
      updatedProject = project;
    });
  } catch (error) {
    console.error('Error during manual equipment addition:', error);
    // Session ending handled in finally
    return next(
      new AppError(
        `Failed to add equipment: ${error.message}`,
        error.statusCode || 400
      )
    );
  } finally {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
  }

  if (!updatedProject) {
    return next(
      new AppError('Failed to add equipment, project data not available.', 500)
    );
  }

  const populatedProject = await Project.findById(updatedProject._id).populate(
    'equipmentUsed.item',
    'name sku modelNumber category'
  );

  // Find the newly added equipment entry to return it specifically
  const newEquipmentEntry =
    populatedProject.equipmentUsed.find(
      (eq) =>
        eq.item._id.toString() === itemId && eq.quantityUsed === quantityUsed // Simple match
    ) ||
    populatedProject.equipmentUsed[populatedProject.equipmentUsed.length - 1];

  return res.status(201).json({
    status: 'success',
    data: {
      equipment: newEquipmentEntry, // Return the specific equipment entry
      project: populatedProject, // Optionally return the whole project
    },
  });
});

// Update project team
exports.updateProjectTeam = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { team: req.body },
    { new: true, runValidators: true }
  ).populate(
    'team.projectManager team.salesRep team.designer team.installationTeam',
    'firstName lastName email'
  );

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  return res.status(200).json({ status: 'success', data: { project } });
});

// Add expense to project
exports.addProjectExpense = catchAsync(async (req, res, next) => {
  req.body.recordedBy = req.user.id;
  const project = await Project.findById(req.params.id);
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }
  project.financials.expenses.push(req.body);
  await project.save(); // This will trigger the pre-save hook for financials

  const newExpense =
    project.financials.expenses[project.financials.expenses.length - 1];

  // Re-fetch to get populated 'recordedBy' and updated 'projectedProfit'
  const updatedProject = await Project.findById(project._id).populate(
    'financials.expenses.recordedBy',
    'firstName lastName email'
  );

  return res.status(201).json({
    status: 'success',
    data: {
      expense: newExpense, // Return the specific expense
      project: updatedProject, // Return the updated project with new financials
    },
  });
});

// Get project statistics
exports.getProjectStats = catchAsync(async (req, res, _next) => {
  const stats = await Project.aggregate([
    { $match: { active: { $ne: false } } }, // Consider active projects
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        totalContractValue: { $sum: '$financials.totalContractValue' },
        // avgSystemSize: { $avg: '$systemSize' } // Example additional stat
      },
    },
    {
      $project: {
        // Reshape output
        stage: '$_id',
        count: 1,
        totalContractValue: 1,
        // avgSystemSize: 1,
        _id: 0, // Exclude default _id
      },
    },
    { $sort: { count: -1 } },
  ]);

  return res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// --- Task Management ---

// Add a task to a project
exports.addTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const taskData = { ...req.body, createdBy: req.user.id };

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  if (taskData.dependsOn) {
    taskData.dependsOn = taskData.dependsOn.filter(
      (depId) =>
        mongoose.Types.ObjectId.isValid(depId) &&
        project.tasks.some((t) => t._id.equals(depId))
    );
  }
  project.tasks.push(taskData);
  await project.save();

  const newTask = project.tasks[project.tasks.length - 1];
  // Manually populate assignedTo and createdBy for the new task if needed for response
  await Project.populate(newTask, {
    path: 'assignedTo createdBy',
    select: 'firstName lastName email',
  });

  return res.status(201).json({
    status: 'success',
    data: {
      task: newTask,
    },
  });
});

// Update a specific task within a project
exports.updateTask = catchAsync(async (req, res, next) => {
  const { id, taskId } = req.params;
  const updateData = req.body;

  const project = await Project.findById(id).populate(
    'tasks.assignedTo tasks.createdBy',
    'firstName lastName email'
  );
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  const task = project.tasks.id(taskId);
  if (!task) {
    return next(
      new AppError('No task found with that ID within the project', 404)
    );
  }

  // Dependency Check
  if (
    updateData.status &&
    (updateData.status === 'in_progress' || updateData.status === 'done') &&
    task.dependsOn &&
    task.dependsOn.length > 0
  ) {
    const incompleteDependencies = project.tasks.filter(
      (t) => task.dependsOn.includes(t._id) && t.status !== 'done'
    );
    if (incompleteDependencies.length > 0) {
      return next(
        new AppError(
          `Cannot update task. Prerequisite tasks not completed: ${incompleteDependencies.map((t) => t.description).join(', ')}`,
          400
        )
      );
    }
  }

  if (updateData.dependsOn) {
    updateData.dependsOn = updateData.dependsOn.filter(
      (depId) =>
        mongoose.Types.ObjectId.isValid(depId) &&
        project.tasks.some((t) => t._id.equals(depId) && !t._id.equals(taskId))
    );
  }

  Object.keys(updateData).forEach((key) => {
    task[key] = updateData[key];
  });

  await project.save();

  // Repopulate the specific task after save if necessary, or ensure virtuals handle it
  // For simplicity, we're returning the task as it is after update.
  // If populated fields of the task itself need to be returned fresh:
  const updatedTask = project.tasks.id(taskId); // Re-fetch from parent
  await Project.populate(updatedTask, {
    path: 'assignedTo createdBy',
    select: 'firstName lastName email',
  });

  return res.status(200).json({
    status: 'success',
    data: {
      task: updatedTask,
    },
  });
});

// Delete a specific task from a project
exports.deleteTask = catchAsync(async (req, res, next) => {
  const { id, taskId } = req.params;

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  const task = project.tasks.id(taskId);
  if (!task) {
    return next(new AppError('No task found with that ID to delete', 404));
  }

  // Check if other tasks depend on this task
  const dependentTasks = project.tasks.filter(
    (t) => t.dependsOn && t.dependsOn.includes(taskId)
  );
  if (dependentTasks.length > 0) {
    return next(
      new AppError(
        `Cannot delete task. Other tasks depend on it: ${dependentTasks.map((t) => t.description).join(', ')}`,
        400
      )
    );
  }

  // Mongoose 6+ .remove() on subdocument
  if (typeof task.remove === 'function') {
    task.remove();
  } else {
    // Fallback for older Mongoose or if .remove() is not available on subdoc instance
    project.tasks.pull({ _id: taskId });
  }

  await project.save();

  return res.status(204).json({
    status: 'success',
    data: null,
  });
});
