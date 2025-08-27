import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',  // Standardized to ServiceProvider
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
  scheduledDate: {
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
  amount: {
    type: Number,
    default: 0
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['mpesa', 'cash', 'card'],
      default: 'mpesa'
    },
    transactionId: String,
    completedAt: Date
  },
  notes: String,
  completionNotes: String,
  rating: {
    score: Number,
    review: String,
    date: Date,
    feedback: String
  },
  metrics: {
    timeToComplete: Number,
    distanceTraveled: Number
  }
}, {
  timestamps: true,
  collection: 'jobs'
});

// Add indexes
jobSchema.index({ location: '2dsphere' });
jobSchema.index({ providerId: 1, status: 1 });
jobSchema.index({ clientId: 1, status: 1 });
jobSchema.index({ bookingId: 1 }, { unique: true });

// Prevent duplicate model registration
const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);
export default Job;
