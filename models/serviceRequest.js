import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  initialRequestTime: {
    type: Date,
    default: Date.now
  },
  providerResponseTime: Date,
  responseStatus: {
    type: String,
    enum: ['awaiting', 'accepted', 'rejected'],
    default: 'awaiting'
  },
  completedAt: Date,
  scheduledDate: {
    type: Date,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    address: String
  },
  amount: {
    type: Number,
    required: true
  },
  notes: String,
  rejectionReason: String
}, {
  timestamps: true,
  collection: 'servicerequests'
});

// Prevent duplicate model registration
const ServiceRequest = mongoose.models.ServiceRequest || 
  mongoose.model('ServiceRequest', serviceRequestSchema);

export { ServiceRequest };
