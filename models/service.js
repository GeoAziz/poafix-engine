import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['moving', 'cleaning', 'plumbing', 'electrical', 'painting', 'carpentry']
  },
  basePrice: {
    type: Number,
    required: true
  },
  description: String,
  isAvailable: {
    type: Boolean,
    default: true
  },
  images: [String],
  pricing: {
    hourly: Number,
    fixed: Number,
    minimumCharge: Number
  },
  features: [String],
  rating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export const Service = mongoose.model('Service', serviceSchema);
