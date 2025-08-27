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
    coordinates: {
      type: [Number],
      required: true
    }
  },
  radius: {
    type: Number,
    required: true,
    min: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  collection: 'serviceareas'
});

// Prevent model compilation error by checking if it exists
const ServiceArea = mongoose.models.ServiceArea || mongoose.model('ServiceArea', serviceAreaSchema);

export { ServiceArea };
