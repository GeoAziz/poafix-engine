import mongoose from 'mongoose';

const serviceAreaSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  area: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number]
  },
  radius: {
    type: Number,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'serviceareas'
});

// Create geospatial index
serviceAreaSchema.index({ location: '2dsphere' });

// Prevent duplicate model registration
const ServiceArea = mongoose.models.ServiceArea || mongoose.model('ServiceArea', serviceAreaSchema);

export { ServiceArea };
