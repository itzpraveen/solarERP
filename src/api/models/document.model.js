const mongoose = require('mongoose');
const crypto = require('crypto');

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Document type is required'],
    enum: [
      'permit',
      'contract',
      'design',
      'proposal',
      'inspection',
      'utility',
      'warranty',
      'invoice',
      'customer',
      'marketing',
      'legal',
      'other'
    ]
  },
  category: {
    type: String,
    enum: [
      'project',
      'customer',
      'lead',
      'proposal',
      'equipment',
      'finance',
      'company',
      'employee',
      'other'
    ],
    default: 'other'
  },
  // The related entity (project, customer, etc.)
  relatedTo: {
    entityType: {
      type: String,
      enum: [
        'project',
        'customer',
        'lead',
        'proposal',
        'equipment',
        'user',
        'other'
      ],
      required: [true, 'Related entity type is required']
    },
    entityId: {
      type: mongoose.Schema.ObjectId,
      refPath: 'relatedTo.entityType',
      required: [true, 'Related entity ID is required']
    }
  },
  // File storage information
  file: {
    originalName: {
      type: String,
      required: [true, 'Original file name is required']
    },
    mimeType: {
      type: String,
      required: [true, 'File MIME type is required']
    },
    size: {
      type: Number,
      required: [true, 'File size is required']
    },
    path: {
      type: String,
      required: [true, 'File path is required']
    },
    url: {
      type: String,
      required: [true, 'File URL is required']
    },
    extension: String,
    storageProvider: {
      type: String,
      enum: ['local', 's3', 'gcs', 'azure', 'other'],
      default: 'local'
    }
  },
  status: {
    type: String,
    enum: [
      'draft',
      'active',
      'archived',
      'expired',
      'pending_approval',
      'approved',
      'rejected'
    ],
    default: 'active'
  },
  // For versioning
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  previousVersions: [{
    versionNumber: Number,
    fileUrl: String,
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date,
    notes: String
  }],
  // For expiration
  expiresAt: Date,
  // For sharing
  isPublic: {
    type: Boolean,
    default: false
  },
  publicAccessUrl: String,
  shareExpiration: Date,
  // Document tags for searching
  tags: [String],
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  // Access controls
  accessControl: {
    readAccess: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }],
    writeAccess: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }]
  },
  // Signatures (if applicable)
  signatures: [{
    signedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    signedAt: Date,
    signatureData: String,
    verified: Boolean
  }],
  // Audit trail
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Document creator is required']
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for common queries
documentSchema.index({ name: 'text', description: 'text', tags: 'text' });
documentSchema.index({ type: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ 'relatedTo.entityType': 1, 'relatedTo.entityId': 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ createdBy: 1 });
documentSchema.index({ createdAt: -1 });

// Query middleware to only find active documents
documentSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

// Populate references
documentSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'createdBy',
    select: 'firstName lastName email'
  });
  
  next();
});

// Generate public access URL if document is public
documentSchema.pre('save', function(next) {
  if (this.isPublic && !this.publicAccessUrl) {
    // Generate a unique token for public access
    const token = crypto.randomBytes(20).toString('hex');
    this.publicAccessUrl = `/documents/public/${token}`;
  }
  
  next();
});

// Check if document is expired
documentSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return Date.now() > this.expiresAt;
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;