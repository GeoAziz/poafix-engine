import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',  // Standardize to ServiceProvider
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  serviceType: {
    type: String,
    required: true
  },
  scheduledDate: {    // Added from job.js
    type: Date,
    required: true
  },
  startTime: Date,
  endTime: Date,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  amount: {          // Added from job.js
    type: Number,
    default: 0
  },
  payment: {         // Added from job.js
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['mpesa', 'cash'],
      default: 'mpesa'
    },
    transactionId: String
  },
  notes: String,
  completionNotes: String,
  rating: {
    score: Number,
    review: String,    // Enhanced rating structure
    date: Date
  }
}, {
  timestamps: true,
  collection: 'jobs'    // Explicitly set collection name
});

// Add geospatial index
jobSchema.index({ location: '2dsphere' });

// Prevent duplicate model registration
const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

export { Job };
