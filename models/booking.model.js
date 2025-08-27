import mongoose from 'mongoose';

// Export this constant
export const VALID_STATUSES = [
  'pending', 
  'accepted', 
  'rejected', 
  'cancelled', 
  'completed', 
  'in_progress'
];

const bookingSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  schedule: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: VALID_STATUSES,
    default: 'pending'
  },
  description: String,
  address: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes
bookingSchema.index({ clientId: 1 });
bookingSchema.index({ providerId: 1 });
bookingSchema.index({ status: 1 });

// Prevent duplicate model registration
  const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema, 'bookings');

// Export as named export
export { Booking };
