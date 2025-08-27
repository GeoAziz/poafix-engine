import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number]
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false,
    index: true  // Add index for better query performance
  },
  blockReason: {
    type: String,
    default: null
  },
  blockedAt: {
    type: Date,
    default: null
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, { 
  timestamps: true,
  collection: 'clients'
});

// Add pre-save middleware to handle blocking logic
clientSchema.pre('save', function(next) {
  if (this.isBlocked && !this.blockedAt) {
    this.blockedAt = new Date();
  }
  if (!this.isBlocked) {
    this.blockReason = null;
    this.blockedAt = null;
    this.blockedBy = null;
  }
  next();
});

// Prevent duplicate model registration
const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);

export { Client };
