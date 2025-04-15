const mongoose = require('mongoose');
const { Schema } = mongoose;

const dealerSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Dealer name is required'],
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    unique: true, // Assuming email should be unique for dealers
    sparse: true // Allows multiple null values if email is not required/provided
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    district: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  commissionRate: { // Optional: Example field for tracking commission
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator user is required']
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes
dealerSchema.index({ name: 1 });
dealerSchema.index({ email: 1 });
dealerSchema.index({ isActive: 1 });

// Query middleware to only find active dealers by default
dealerSchema.pre(/^find/, function(next) {
  const currentQuery = this.getQuery();
  if (currentQuery.isActive === undefined) {
    this.where({ isActive: { $ne: false } });
  }
  next();
});

const Dealer = mongoose.model('Dealer', dealerSchema);

module.exports = Dealer;