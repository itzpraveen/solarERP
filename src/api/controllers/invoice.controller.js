const Invoice = require('../models/invoice.model');
const Project = require('../models/project.model');
const Customer = require('../models/customer.model');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const { getNextSequenceValue } = require('../../utils/sequenceGenerator'); // Assuming a sequence generator for invoice numbers

// Helper to calculate invoice totals - can be used if not relying solely on pre-save hook
// or for more complex scenarios before creating/updating.
// const calculateInvoiceTotals = (invoice) => {
//   invoice.subTotal = invoice.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
//   invoice.taxableAmount = invoice.subTotal; // Assuming no pre-tax discounts for now

//   if (invoice.igstRate > 0) {
//     invoice.cgstAmount = 0;
//     invoice.sgstAmount = 0;
//     invoice.igstAmount = invoice.taxableAmount * invoice.igstRate;
//   } else {
//     invoice.cgstAmount = invoice.taxableAmount * (invoice.cgstRate || 0);
//     invoice.sgstAmount = invoice.taxableAmount * (invoice.sgstRate || 0);
//     invoice.igstAmount = 0;
//   }
//   invoice.totalGstAmount = invoice.cgstAmount + invoice.sgstAmount + invoice.igstAmount;
//   invoice.totalAmount = invoice.taxableAmount + invoice.totalGstAmount;

//   invoice.amountPaid = invoice.paymentsReceived.reduce((sum, payment) => sum + payment.amountReceived, 0);
//   invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;

//   return invoice;
// };

// Create a new invoice
exports.createInvoice = catchAsync(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  // Auto-generate invoice number if not provided
  if (!req.body.invoiceNumber) {
    req.body.invoiceNumber = await getNextSequenceValue('invoice');
  }

  // Ensure customer exists
  const customer = await Customer.findById(req.body.customer);
  if (!customer) {
    return next(new AppError('Customer not found for this invoice.', 404));
  }

  // If project is linked, ensure it exists
  if (req.body.project) {
    const project = await Project.findById(req.body.project);
    if (!project) {
      return next(new AppError('Project not found for this invoice.', 404));
    }
    // Optionally, pre-fill customer from project if not provided
    if (!req.body.customer) req.body.customer = project.customer;
  }

  // If line items are provided, calculate amounts
  if (req.body.lineItems && req.body.lineItems.length > 0) {
    req.body.lineItems.forEach((item) => {
      if (item.quantity && item.unitPrice) {
        // eslint-disable-next-line no-param-reassign
        item.amount = item.quantity * item.unitPrice;
      }
    });
  }

  // The pre-save hook in invoice.model.js will handle most calculations.
  // We can call calculateInvoiceTotals here if we need values before create for some reason,
  // or if we want to override model's default rates with request body rates.
  // For now, relying on model's pre-save.

  const newInvoice = await Invoice.create(req.body);

  // Populate necessary fields for the response
  const populatedInvoice = await Invoice.findById(newInvoice._id)
    .populate('customer', 'firstName lastName email')
    .populate('project', 'name')
    .populate('createdBy', 'firstName lastName');

  return res.status(201).json({
    status: 'success',
    data: {
      invoice: populatedInvoice,
    },
  });
});

// Get all invoices with filtering, sorting, pagination
exports.getAllInvoices = catchAsync(async (req, res, _next) => {
  // eslint-disable-line no-unused-vars
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.customerId) filter.customer = req.query.customerId;
  if (req.query.projectId) filter.project = req.query.projectId;
  // Add date range filters for invoiceDate or dueDate if needed

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const invoices = await Invoice.find(filter)
    .populate('customer', 'firstName lastName email')
    .populate('project', 'name')
    .sort(req.query.sort || '-invoiceDate')
    .skip(skip)
    .limit(limit);

  const totalInvoices = await Invoice.countDocuments(filter);

  return res.status(200).json({
    status: 'success',
    results: invoices.length,
    total: totalInvoices,
    totalPages: Math.ceil(totalInvoices / limit),
    currentPage: page,
    data: {
      invoices,
    },
  });
});

// Get a single invoice by ID
exports.getInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('customer', 'firstName lastName email phone address')
    .populate('project', 'name projectType')
    .populate('proposal', 'name proposalId')
    .populate('createdBy', 'firstName lastName email')
    .populate('paymentsReceived.recordedBy', 'firstName lastName email');

  if (!invoice) {
    return next(new AppError('No invoice found with that ID', 404));
  }

  return res.status(200).json({
    status: 'success',
    data: {
      invoice,
    },
  });
});

// Update an invoice (e.g., line items, notes - typically for 'draft' invoices)
exports.updateInvoice = catchAsync(async (req, res, next) => {
  // Certain fields should not be updatable directly, e.g., invoiceNumber, createdBy
  // eslint-disable-next-line no-unused-vars
  const {
    invoiceNumber,
    createdBy,
    paymentsReceived,
    amountPaid,
    balanceDue,
    ...updateData
  } = req.body;

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    return next(new AppError('No invoice found with that ID', 404));
  }

  // Restrict updates for non-draft invoices (example logic)
  if (invoice.status !== 'draft' && invoice.status !== 'pending_payment') {
    // Allow updating notes or specific fields for sent invoices if needed
    if (updateData.internalNotes || updateData.notesToCustomer) {
      // Allow only note updates
    } else {
      return next(
        new AppError(
          `Cannot update invoice with status: ${invoice.status}. Only notes may be editable.`,
          400
        )
      );
    }
  }

  // Update fields
  Object.assign(invoice, updateData);

  // Recalculations will be handled by pre-save hook in the model
  await invoice.save();

  const populatedInvoice = await Invoice.findById(invoice._id)
    .populate('customer', 'firstName lastName email')
    .populate('project', 'name')
    .populate('createdBy', 'firstName lastName');

  return res.status(200).json({
    status: 'success',
    data: {
      invoice: populatedInvoice,
    },
  });
});

// Record a payment for an invoice
exports.recordPayment = catchAsync(async (req, res, next) => {
  const { amountReceived, paymentDate, paymentMethod, referenceNumber, notes } =
    req.body;
  const recordedBy = req.user.id;

  if (!amountReceived || amountReceived <= 0) {
    return next(new AppError('Payment amount must be a positive number.', 400));
  }

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    return next(new AppError('No invoice found with that ID', 404));
  }

  if (
    invoice.status === 'paid' ||
    invoice.status === 'void' ||
    invoice.status === 'cancelled'
  ) {
    return next(
      new AppError(
        `Cannot record payment for invoice with status: ${invoice.status}`,
        400
      )
    );
  }

  invoice.paymentsReceived.push({
    amountReceived,
    paymentDate: paymentDate || new Date(),
    paymentMethod,
    referenceNumber,
    notes,
    recordedBy,
  });

  // Pre-save hook will recalculate amountPaid, balanceDue, and potentially update status
  await invoice.save();

  const populatedInvoice = await Invoice.findById(invoice._id)
    .populate('customer', 'firstName lastName email')
    .populate('project', 'name')
    .populate('paymentsReceived.recordedBy', 'firstName lastName');

  return res.status(200).json({
    status: 'success',
    message: 'Payment recorded successfully.',
    data: {
      invoice: populatedInvoice,
    },
  });
});

// Update invoice status (e.g., send, void, cancel)
exports.updateInvoiceStatus = catchAsync(async (req, res, next) => {
  const { status, sentDate } = req.body; // sentDate is optional

  if (!status) {
    return next(new AppError('Status is required.', 400));
  }

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    return next(new AppError('No invoice found with that ID', 404));
  }

  invoice.status = status;
  if (status === 'sent' && !invoice.sentDate) {
    invoice.sentDate = sentDate || new Date();
  }
  // Other status-specific logic can be added here (e.g., voiding impact)

  await invoice.save(); // Pre-save hook will also run

  const populatedInvoice = await Invoice.findById(invoice._id)
    .populate('customer', 'firstName lastName email')
    .populate('project', 'name');

  return res.status(200).json({
    status: 'success',
    message: `Invoice status updated to ${status}.`,
    data: {
      invoice: populatedInvoice,
    },
  });
});

// Delete an invoice (use with caution, prefer voiding/cancelling)
exports.deleteInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return next(new AppError('No invoice found with that ID', 404));
  }

  // Add business rule: only delete draft invoices, otherwise void/cancel
  if (invoice.status !== 'draft') {
    return next(
      new AppError(
        `Cannot delete invoice with status ${invoice.status}. Consider voiding or cancelling.`,
        400
      )
    );
  }

  await Invoice.findByIdAndDelete(req.params.id);

  return res.status(204).json({
    status: 'success',
    data: null,
  });
});

// TODO: Function to generate invoice from project payment milestones
// exports.createInvoiceFromProjectMilestone = catchAsync(async (req, res, next) => { ... });

// TODO: Function to send invoice via email (similar to sendProposal)
// exports.sendInvoiceByEmail = catchAsync(async (req, res, next) => { ... });
