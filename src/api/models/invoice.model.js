const mongoose = require('mongoose');

const invoiceLineItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    unitPrice: {
      // Price per unit, exclusive of tax
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      // quantity * unitPrice
      type: Number,
      required: true,
      min: 0,
    },
    // Optional: Link to a product/service from a catalog if applicable
    // productId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductOrService' },
  },
  { _id: false }
);

const paymentReceivedSchema = new mongoose.Schema(
  {
    paymentDate: { type: Date, required: true, default: Date.now },
    amountReceived: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: [
        'cash',
        'cheque',
        'bank_transfer',
        'upi',
        'online_gateway',
        'other',
      ],
      default: 'bank_transfer',
    },
    referenceNumber: { type: String, trim: true }, // e.g., cheque number, transaction ID
    notes: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      // Should be unique and auto-generated or managed
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    project: {
      // Optional, if invoice is related to a specific project
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    proposal: {
      // Optional, if invoice is generated from a proposal
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    lineItems: [invoiceLineItemSchema],
    subTotal: {
      // Sum of all lineItem amounts
      type: Number,
      required: true,
      min: 0,
    },
    // GST Fields
    taxableAmount: { type: Number, min: 0 }, // Could be same as subTotal or different if discounts apply before tax
    cgstRate: { type: Number, default: 0, min: 0 },
    sgstRate: { type: Number, default: 0, min: 0 },
    igstRate: { type: Number, default: 0, min: 0 },
    cgstAmount: { type: Number, default: 0, min: 0 },
    sgstAmount: { type: Number, default: 0, min: 0 },
    igstAmount: { type: Number, default: 0, min: 0 },
    totalGstAmount: { type: Number, default: 0, min: 0 },

    totalAmount: {
      // subTotal (or taxableAmount) + totalGstAmount
      type: Number,
      required: true,
      min: 0,
    },
    // Optional: Shipping, adjustments, discounts applied after subtotal but before/after tax
    // discountAmount: { type: Number, default: 0, min: 0 },
    // shippingCharges: { type: Number, default: 0, min: 0 },

    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      // totalAmount - amountPaid
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        'draft',
        'sent',
        'pending_payment',
        'partially_paid',
        'paid',
        'overdue',
        'void',
        'cancelled',
      ],
      default: 'draft',
    },
    currency: {
      type: String,
      default: 'INR',
      required: true,
    },
    notesToCustomer: {
      // Public notes visible on the invoice
      type: String,
      trim: true,
    },
    internalNotes: {
      // Private notes for internal use
      type: String,
      trim: true,
    },
    paymentsReceived: [paymentReceivedSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sentDate: Date,
    lastPaymentDate: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save middleware to calculate amounts
// eslint-disable-next-line func-names
invoiceSchema.pre('save', function (next) {
  // Calculate line item amounts
  this.lineItems.forEach((item) => {
    // eslint-disable-next-line no-param-reassign
    item.amount = item.quantity * item.unitPrice;
  });

  // Calculate subTotal
  this.subTotal = this.lineItems.reduce((sum, item) => sum + item.amount, 0);

  // Assume taxableAmount is subTotal for now. Add discount logic if needed.
  this.taxableAmount = this.subTotal;

  // Calculate GST amounts (assuming rates are set or defaulted)
  if (this.igstRate > 0) {
    // Inter-state
    this.cgstAmount = 0;
    this.sgstAmount = 0;
    this.igstAmount = this.taxableAmount * this.igstRate;
  } else {
    // Intra-state
    this.cgstAmount = this.taxableAmount * this.cgstRate;
    this.sgstAmount = this.taxableAmount * this.sgstRate;
    this.igstAmount = 0;
  }
  this.totalGstAmount = this.cgstAmount + this.sgstAmount + this.igstAmount;

  // Calculate totalAmount
  this.totalAmount = this.taxableAmount + this.totalGstAmount;

  // Calculate amountPaid from paymentsReceived array
  this.amountPaid = this.paymentsReceived.reduce(
    (sum, payment) => sum + payment.amountReceived,
    0
  );
  if (this.paymentsReceived.length > 0) {
    this.lastPaymentDate = this.paymentsReceived.sort(
      (a, b) => b.paymentDate - a.paymentDate
    )[0].paymentDate;
  }

  // Calculate balanceDue
  this.balanceDue = this.totalAmount - this.amountPaid;

  // Update status based on payments (simplified)
  if (
    this.status !== 'draft' &&
    this.status !== 'void' &&
    this.status !== 'cancelled'
  ) {
    if (this.balanceDue <= 0) {
      this.status = 'paid';
    } else if (this.amountPaid > 0 && this.balanceDue > 0) {
      this.status = 'partially_paid';
    } else if (this.amountPaid === 0 && new Date() > this.dueDate) {
      this.status = 'overdue';
    } else if (this.amountPaid === 0 && this.status !== 'sent') {
      // if not yet sent and no payment
      // keep as pending_payment or draft depending on workflow
    }
  }

  next();
});

// Indexes
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ project: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ dueDate: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
