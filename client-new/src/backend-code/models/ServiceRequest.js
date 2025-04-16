const mongoose = require('mongoose');

const { Schema } = mongoose;

// Schema for service request notes
const noteSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Service Request Schema
const serviceRequestSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    requestType: {
      type: String,
      enum: ['maintenance', 'repair', 'installation', 'inspection', 'other'],
      default: 'maintenance',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: [
        'new',
        'assigned',
        'in_progress',
        'on_hold',
        'completed',
        'cancelled',
      ],
      default: 'new',
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    assignedTechnician: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    scheduledDate: {
      type: Date,
    },
    completionDate: {
      type: Date,
    },
    notes: [noteSchema],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to update status based on technician assignment
serviceRequestSchema.pre('save', function (next) {
  // If the status is 'new' and a technician is assigned, change status to 'assigned'
  if (
    this.isModified('assignedTechnician') &&
    this.assignedTechnician &&
    this.status === 'new'
  ) {
    this.status = 'assigned';
  }

  // If marking as completed, ensure completion date is set
  if (
    this.isModified('status') &&
    this.status === 'completed' &&
    !this.completionDate
  ) {
    this.completionDate = Date.now();
  }

  next();
});

// Virtual for full request reference number (SR-YYYY-XXXX)
serviceRequestSchema.virtual('requestNumber').get(function () {
  const timestamp = this._id.getTimestamp();
  const year = timestamp.getFullYear();
  const objectIdStr = this._id.toString().slice(-4).toUpperCase();
  return `SR-${year}-${objectIdStr}`;
});

// Methods
serviceRequestSchema.methods.addNote = function (text, userId) {
  this.notes.push({
    text,
    createdBy: userId,
    createdAt: Date.now(),
  });
  return this.save();
};

serviceRequestSchema.methods.assignTechnician = function (technicianId) {
  this.assignedTechnician = technicianId;

  // If not already in a state beyond 'new', set to 'assigned'
  if (this.status === 'new') {
    this.status = 'assigned';
  }

  return this.save();
};

serviceRequestSchema.methods.updateStatus = function (status) {
  this.status = status;

  // If marked as completed, set completion date
  if (status === 'completed' && !this.completionDate) {
    this.completionDate = Date.now();
  }

  return this.save();
};

serviceRequestSchema.methods.scheduleService = function (date) {
  this.scheduledDate = date;
  return this.save();
};

serviceRequestSchema.methods.completeService = function (
  completionDate,
  notes
) {
  this.status = 'completed';
  this.completionDate = completionDate || Date.now();

  // Add completion note if provided
  if (notes) {
    this.notes.push({
      text: notes,
      createdAt: Date.now(),
    });
  }

  return this.save();
};

// Ensure virtual fields are included when converting to JSON
serviceRequestSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
