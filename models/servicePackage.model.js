import mongoose from 'mongoose';

const servicePackageItemSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  description: String,
  estimatedDuration: Number, // in minutes
  requirements: [String]
});

const servicePackageSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  providerName: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  services: [servicePackageItemSchema],
  packagePrice: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['bundle', 'subscription', 'unlimited', 'custom'],
    required: true
  },
  validity: {
    type: Number, // days
    default: 30
  },
  maxBookings: {
    type: Number,
    default: 1
  },
  features: [String],
  limitations: [String],
  terms: {
    type: Object,
    default: {}
  },
  images: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  tags: [String],
  minimumAdvanceBooking: {
    type: Number, // hours
    default: 24
  },
  availableSlots: {
    type: Object,
    default: {}
  },
  rating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  purchaseCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient searching
servicePackageSchema.index({ providerId: 1, isActive: 1 });
servicePackageSchema.index({ category: 1, isActive: 1 });
servicePackageSchema.index({ packagePrice: 1 });
servicePackageSchema.index({ rating: -1 });

export default mongoose.model('ServicePackage', servicePackageSchema);