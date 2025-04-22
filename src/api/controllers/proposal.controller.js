const Proposal = require('../models/proposal.model');
const Lead = require('../models/lead.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const sendEmail = require('../../utils/email');
const { generateProposalPdf } = require('../../utils/generatePdf'); // Import the PDF generator

// Get all proposals with filtering, sorting, and pagination
exports.getAllProposals = catchAsync(async (req, res, _next) => {
  // Rename next to _next
  // BUILD FILTER CONDITIONS
  const filterConditions = {};

  // 1) Add standard filters from req.query (e.g., status, lead)
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
      // Basic equality check for fields like status, lead
      filterConditions[key] = standardFilters[key];
      // Add logic here if range filters (gte, lte) or search are needed
    }
  });
  console.log(
    'getAllProposals - Standard filters applied:',
    JSON.stringify(filterConditions)
  );

  // Note: The 'active' filter is handled by the pre-find middleware in the model.

  console.log(
    'getAllProposals - Final filter conditions before find:',
    JSON.stringify(filterConditions)
  );

  // BUILD QUERY (Find + Sort + Paginate)
  // Apply all calculated filters at once. The 'active' filter is added by pre-find middleware.
  let query = Proposal.find(filterConditions);

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
      proposals,
    },
  });
});

// Get proposal by ID
exports.getProposal = catchAsync(async (req, res, next) => {
  const proposal = await Proposal.findById(req.params.id).populate('lead'); // Populate the lead field

  if (!proposal) {
    return next(new AppError('No proposal found with that ID', 404)); // Added return
  }

  res.status(200).json({
    status: 'success',
    data: {
      proposal,
    },
  });
});

// Create new proposal
exports.createProposal = catchAsync(async (req, res, next) => {
  // Set the creator to the current user
  req.body.createdBy = req.user.id;

  // Verify that the lead exists
  const lead = await Lead.findById(req.body.lead);
  if (!lead) {
    return next(new AppError('No lead found with that ID', 404)); // Added return
  }

  const newProposal = await Proposal.create(req.body);

  // Update lead status to proposal if it's not already in a later stage
  if (['new', 'contacted', 'qualified'].includes(lead.status)) {
    await Lead.findByIdAndUpdate(lead.id, { status: 'proposal' }); // Use lead.id
  }

  res.status(201).json({
    status: 'success',
    data: {
      proposal: newProposal,
    },
  });
});

// Update proposal
exports.updateProposal = catchAsync(async (req, res, next) => {
  // Exclude fields that shouldn't be updated via this generic route
  const excludedFields = [
    'lead',
    'createdBy',
    'status',
    'sentDate',
    'viewedDate',
    'acceptedDate',
    'rejectedDate',
    'active',
  ];
  const filteredBody = { ...req.body };
  excludedFields.forEach((el) => delete filteredBody[el]);

  const proposal = await Proposal.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!proposal) {
    return next(new AppError('No proposal found with that ID', 404)); // Added return
  }

  res.status(200).json({
    status: 'success',
    data: {
      proposal,
    },
  });
});

// Delete proposal (soft delete)
exports.deleteProposal = catchAsync(async (req, res, next) => {
  const proposal = await Proposal.findByIdAndUpdate(req.params.id, {
    active: false,
  });

  if (!proposal) {
    return next(new AppError('No proposal found with that ID', 404)); // Added return
  }

  res.status(204).json({
    status: 'success',
    data: null,
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
    return next(new AppError('No proposal found with that ID', 404)); // Added return
  }

  // If proposal is accepted or rejected, update lead status
  if (status === 'accepted') {
    await Lead.findByIdAndUpdate(proposal.lead.id, { status: 'won' }); // Use proposal.lead.id
  } else if (status === 'rejected') {
    await Lead.findByIdAndUpdate(proposal.lead.id, { status: 'lost' }); // Use proposal.lead.id
  }

  res.status(200).json({
    status: 'success',
    data: {
      proposal,
    },
  });
});

// Send proposal via email
exports.sendProposal = catchAsync(async (req, res, next) => {
  const proposal = await Proposal.findById(req.params.id);

  if (!proposal) {
    return next(new AppError('No proposal found with that ID', 404)); // Added return
  }

  // Update status to sent
  proposal.status = 'sent';
  proposal.sentDate = Date.now();
  await proposal.save();

  // Get full lead information
  const lead = await Lead.findById(proposal.lead.id); // Use proposal.lead.id

  // Create view link with tracking capability
  const viewLink = `${req.protocol}://${req.get('host')}/proposals/view/${proposal.id}`; // Use proposal.id

  // Populate equipment details if not already populated (might be needed if proposal was fetched without pre-find hook)
  await proposal.populate({
    path: 'equipment.item',
    select: 'name category modelNumber',
  });

  // Generate equipment list for email
  const equipmentListHtml = proposal.equipment
    .map(
      (eq) =>
        `<li>${eq.quantity} x ${eq.item.name} (${eq.item.category}${eq.item.modelNumber ? ` - ${eq.item.modelNumber}` : ''})</li>`
    )
    .join('');

  // Format currency helper
  const formatCurrency = (amount) => {
    return `${proposal.currency === 'INR' ? '₹' : '$'}${amount?.toLocaleString() || '0'}`;
  };

  // Send email to customer
  await sendEmail({
    email: lead.email,
    subject: `Your Solar Proposal: ${proposal.name}`,
    // Update plain text message as well
    message: `Dear ${lead.firstName} ${lead.lastName},\n\nThank you for your interest in our solar solutions. We're excited to share your custom proposal with you.\n\nYou can view your proposal at: ${viewLink}\n\nThis proposal includes a ${proposal.systemSize}kW solar system.\n\nKey Financials:\n- Final Project Cost: ${formatCurrency(proposal.finalProjectCost)}\n- Subsidy: ${formatCurrency(proposal.subsidyAmount)}\n- Net Investment: ${formatCurrency(proposal.netInvestment)}\n\nEquipment:\n${proposal.equipment.map((eq) => `- ${eq.quantity} x ${eq.item.name} (${eq.item.category})`).join('\n')}\n\nThis proposal is valid until ${new Date(proposal.validUntil).toLocaleDateString()}.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nYour Solar Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Solar Proposal is Ready</h2>
        <p>Dear ${lead.firstName} ${lead.lastName},</p>
        <p>Thank you for your interest in our solar solutions. We're excited to share your custom proposal with you.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${viewLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Proposal</a>
        </div>
        <p>This proposal includes a ${proposal.systemSize}kW solar system.</p>
        <p><strong>Key Financials:</strong></p>
        <ul>
          <li>Final Project Cost: ${formatCurrency(proposal.finalProjectCost)}</li>
          <li>Subsidy (PM Surya Ghar): ${formatCurrency(proposal.subsidyAmount)}</li>
          <li>Net Investment: ${formatCurrency(proposal.netInvestment)}</li>
          ${proposal.additionalCosts > 0 ? `<li>Additional Costs (Registration, etc.): ${formatCurrency(proposal.additionalCosts)}</li>` : ''}
        </ul>
        <p><strong>Equipment Included:</strong></p>
        <ul>
          ${equipmentListHtml || '<li>Details available in the full proposal.</li>'}
        </ul>
        <p>This proposal is valid until <strong>${new Date(proposal.validUntil).toLocaleDateString()}</strong>.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Your Solar Team</p>
      </div>
    `,
  });

  res.status(200).json({
    status: 'success',
    message: 'Proposal sent successfully',
    data: {
      proposal,
    },
  });
});

// Track proposal view
exports.trackProposalView = catchAsync(async (req, res, next) => {
  const proposal = await Proposal.findById(req.params.id);

  if (!proposal) {
    return next(new AppError('No proposal found with that ID', 404)); // Added return
  }

  // Only update to viewed if it's in sent status
  if (proposal.status === 'sent') {
    proposal.status = 'viewed';
    proposal.viewedDate = Date.now();
    await proposal.save();
  }

  // Don't send proposal data, just success status
  res.status(200).json({
    status: 'success',
  });
});

// Download proposal as PDF
exports.downloadProposalPdf = catchAsync(async (req, res, next) => {
  console.log(
    `Entering downloadProposalPdf for ID: ${req.params.id} by User: ${req.user?.id}`
  ); // <-- Add logging

  // Use findOne to explicitly include inactive proposals for download
  const proposal = await Proposal.findOne({
    _id: req.params.id,
    active: { $in: [true, false] }, // Bypass the pre-find hook filtering active=false
  })
    .populate('lead')
    .populate('equipment.item'); // Ensure necessary fields are populated

  if (!proposal) {
    // This 404 is now only triggered if the ID truly doesn't exist at all
    return next(new AppError('No proposal found with that ID', 404)); // Added return
  }

  try {
    const pdfBuffer = await generateProposalPdf(proposal.toObject()); // Pass plain object

    res.setHeader('Content-Type', 'application/pdf');
    // Use proposal name or ID for the filename
    const filename = `Proposal-${proposal.name || proposal.id}.pdf`
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase(); // Use proposal.id
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error in Controller:', error);
    return next(new AppError('Failed to generate PDF.', 500));
  }
});
