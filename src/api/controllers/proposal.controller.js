const Proposal = require('../models/proposal.model');
const Lead = require('../models/lead.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const sendEmail = require('../../utils/email');

// Get all proposals with filtering, sorting, and pagination
exports.getAllProposals = catchAsync(async (req, res, next) => {
  // BUILD QUERY
  // 1) Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);
  
  // 2) Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  
  let query = Proposal.find(JSON.parse(queryStr));
  
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
  const proposals = await query;
  
  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: proposals.length,
    data: {
      proposals
    }
  });
});

// Get proposal by ID
exports.getProposal = catchAsync(async (req, res, next) => {
  const proposal = await Proposal.findById(req.params.id);
  
  if (!proposal) {
    return next(new AppError('No proposal found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      proposal
    }
  });
});

// Create new proposal
exports.createProposal = catchAsync(async (req, res, next) => {
  // Set the creator to the current user
  req.body.createdBy = req.user.id;
  
  // Verify that the lead exists
  const lead = await Lead.findById(req.body.lead);
  if (!lead) {
    return next(new AppError('No lead found with that ID', 404));
  }
  
  const newProposal = await Proposal.create(req.body);
  
  // Update lead status to proposal if it's not already in a later stage
  if (['new', 'contacted', 'qualified'].includes(lead.status)) {
    await Lead.findByIdAndUpdate(lead._id, { status: 'proposal' });
  }
  
  res.status(201).json({
    status: 'success',
    data: {
      proposal: newProposal
    }
  });
});

// Update proposal
exports.updateProposal = catchAsync(async (req, res, next) => {
  const proposal = await Proposal.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  if (!proposal) {
    return next(new AppError('No proposal found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      proposal
    }
  });
});

// Delete proposal (soft delete)
exports.deleteProposal = catchAsync(async (req, res, next) => {
  const proposal = await Proposal.findByIdAndUpdate(req.params.id, { active: false });
  
  if (!proposal) {
    return next(new AppError('No proposal found with that ID', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Update proposal status
exports.updateProposalStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  const proposal = await Proposal.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  
  if (!proposal) {
    return next(new AppError('No proposal found with that ID', 404));
  }
  
  // If proposal is accepted or rejected, update lead status
  if (status === 'accepted') {
    await Lead.findByIdAndUpdate(proposal.lead._id, { status: 'won' });
  } else if (status === 'rejected') {
    await Lead.findByIdAndUpdate(proposal.lead._id, { status: 'lost' });
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      proposal
    }
  });
});

// Send proposal via email
exports.sendProposal = catchAsync(async (req, res, next) => {
  const proposal = await Proposal.findById(req.params.id);
  
  if (!proposal) {
    return next(new AppError('No proposal found with that ID', 404));
  }
  
  // Update status to sent
  proposal.status = 'sent';
  proposal.sentDate = Date.now();
  await proposal.save();
  
  // Get full lead information
  const lead = await Lead.findById(proposal.lead._id);
  
  // Create view link with tracking capability
  const viewLink = `${req.protocol}://${req.get('host')}/proposals/view/${proposal._id}`;
  
  // Send email to customer
  await sendEmail({
    email: lead.email,
    subject: `Your Solar Proposal: ${proposal.name}`,
    message: `Dear ${lead.firstName} ${lead.lastName},\n\nThank you for your interest in our solar solutions. We're excited to share your custom proposal with you.\n\nYou can view your proposal at: ${viewLink}\n\nThis proposal is valid until ${new Date(proposal.validUntil).toLocaleDateString()}.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nYour Solar Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Solar Proposal is Ready</h2>
        <p>Dear ${lead.firstName} ${lead.lastName},</p>
        <p>Thank you for your interest in our solar solutions. We're excited to share your custom proposal with you.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${viewLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Proposal</a>
        </div>
        <p>This proposal includes:</p>
        <ul>
          <li>${proposal.systemSize}kW solar system with ${proposal.panelCount} ${proposal.panelType} panels</li>
          <li>Estimated annual production of ${proposal.yearlyProductionEstimate.toLocaleString()} kWh</li>
          <li>Potential 25-year savings of $${proposal.estimatedSavings.twentyFiveYear.toLocaleString()}</li>
        </ul>
        <p>This proposal is valid until <strong>${new Date(proposal.validUntil).toLocaleDateString()}</strong>.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Your Solar Team</p>
      </div>
    `
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Proposal sent successfully',
    data: {
      proposal
    }
  });
});

// Track proposal view
exports.trackProposalView = catchAsync(async (req, res, next) => {
  const proposal = await Proposal.findById(req.params.id);
  
  if (!proposal) {
    return next(new AppError('No proposal found with that ID', 404));
  }
  
  // Only update to viewed if it's in sent status
  if (proposal.status === 'sent') {
    proposal.status = 'viewed';
    proposal.viewedDate = Date.now();
    await proposal.save();
  }
  
  // Don't send proposal data, just success status
  res.status(200).json({
    status: 'success'
  });
});