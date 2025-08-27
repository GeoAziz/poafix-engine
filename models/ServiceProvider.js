import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

mongoose.set('strictPopulate', false); // Move this to global level

export const VALID_SERVICES = [
  'moving',
  'cleaning',
  'plumbing',
  'electrical',
  'painting',
  'carpentry',
  'appliance_repair',
  'pest_control',
  'gardening',
  'masonry',
  'mechanic'
];

// First define the schema
const serviceProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required']
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    unique: true
  },
  businessAddress: {
    type: String,
    required: [true, 'Business address is required']
  },
  serviceOffered: {
    type: [
      {
        name: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: String, required: true },
        duration: { type: String, required: true },
      }
    ],
    default: [],
    required: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['verified', 'pending', 'suspended'],
    default: 'pending'
  },
  rating: {
    type: Number,
    default: 0
  },
  servicesCompleted: {
    type: Number,
    default: 0
  },
  experience: {
    type: Number,
    default: 0
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
  totalRatings: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  certifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certification'
  }],
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  availability: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Availability'
  }],
  serviceType: {
    type: String,
    required: true
  },
  address: String,
  pricing: {
    basePrice: Number,
    pricePerKm: Number
  },
  currentSuspension: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Suspension',
    default: null
  },
  isSuspended: {
    type: Boolean,
    default: false,
    index: true  // Add index for better query performance
  },
  suspensionHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Suspension'
  }],
  suspendedAt: Date,
  serviceAreas: [{
    area: String,
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: [Number]
    },
    radius: Number
  }]
}, {
  timestamps: true,
  collection: 'providers'
});

// Then set options after schema is defined
serviceProviderSchema.set('strictPopulate', false);
serviceProviderSchema.set('toObject', { virtuals: true });
serviceProviderSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  }
});

// Basic indexes (these are safe to declare here)
serviceProviderSchema.index({ email: 1 });
serviceProviderSchema.index({ businessName: 1 });

// Validation for coordinates
serviceProviderSchema.path('location.coordinates').validate(function(coords) {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lng, lat] = coords;
  return isFinite(lng) && isFinite(lat) && 
         lng >= -180 && lng <= 180 && 
         lat >= -90 && lat <= 90;
}, 'Invalid coordinates');

// Pre-save middleware
serviceProviderSchema.pre('save', function(next) {
  if (this.location) {
    // Ensure location type is Point
    this.location.type = 'Point';
    // Ensure coordinates are numbers
    if (this.location.coordinates) {
      this.location.coordinates = this.location.coordinates.map(Number);
    }
    // Validate coordinates
    if (!Array.isArray(this.location.coordinates) || 
        this.location.coordinates.length !== 2 ||
        this.location.coordinates.some(coord => !isFinite(coord))) {
      next(new Error('Invalid coordinates'));
      return;
    }
  }

  // Suspension logic
  if (!this.suspendedAt) {
    this.isSuspended = false;
  } else {
    this.isSuspended = true;
  }
  // Update isAvailable when suspended
  if (this.isSuspended) {
    this.isAvailable = false;
  }
  next();
});

// Static method for nearby search
serviceProviderSchema.statics.findNearby = function(coordinates, maxDistance, service) {
  return this.find({
    serviceOffered: service,
    isAvailable: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    }
  });
};

// Create the model
const ServiceProvider = mongoose.models.ServiceProvider || mongoose.model('ServiceProvider', serviceProviderSchema);
export { ServiceProvider };

// Function to ensure indexes - call this after database connection
export async function ensureIndexes() {
  try {
    // Drop existing geospatial index if it exists
    try {
      await ServiceProvider.collection.dropIndex('location_2dsphere');
    } catch (error) {
      // Ignore error if index doesn't exist
      if (error.code !== 27) console.error('Error dropping index:', error);
    }

    // Create new geospatial index
    await ServiceProvider.collection.createIndex(
      { location: '2dsphere' },
      { 
        name: 'location_2dsphere',
        sparse: true,
        background: true 
      }
    );

    console.log('ServiceProvider indexes created successfully');
  } catch (error) {
    console.error('Error ensuring indexes:', error);
  }
}
