import mongoose from 'mongoose';

const providerSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  businessAddress: {
    type: String,
    required: true,
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
  },
  isAvailable: {
    type: Boolean,
    default: false,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  experience: String,
  skills: [String],
  serviceAreas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceArea'
  }],
  availability: [{
    weekDay: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    slots: [{
      startTime: String,
      endTime: String,
      isAvailable: {
        type: Boolean,
        default: true
      }
    }]
  }],
  reviews: [{
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  workingHours: {
    default: {
      start: String,
      end: String,
    },
    exceptions: [{
      date: Date,
      start: String,
      end: String,
      isClosed: Boolean
    }]
  },
  idNumber: String,
  driverLicenseNumber: String,
  insurancePolicyNumber: String,
  insuranceProvider: String,
  profileImage: String,
  lastLocationUpdate: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isSuspended: {
    type: Boolean,
    default: false,
  },
  currentSuspension: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Suspension',
    default: null
  },
  suspensionHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Suspension'
  }],
  suspendedAt: {
    type: Date,
  },
  certifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certification'
  }],
}, {
  timestamps: true,
});

// Add this pre-save middleware
providerSchema.pre('save', function(next) {
  // Check if there's a recent suspension
  if (this.suspendedAt) {
    const suspensionDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const suspensionEndTime = new Date(this.suspendedAt.getTime() + suspensionDuration);
    
    // Update isSuspended based on whether suspension period is still active
    this.isSuspended = (suspensionEndTime > new Date());
  } else {
    this.isSuspended = false;
  }
  next();
});

// Add this method to check suspension status
providerSchema.methods.checkSuspensionStatus = function() {
  if (this.suspendedAt) {
    const suspensionDuration = 24 * 60 * 60 * 1000; // 24 hours
    const suspensionEndTime = new Date(this.suspendedAt.getTime() + suspensionDuration);
    return suspensionEndTime > new Date();
  }
  return false;
};

// Add indices for faster queries
providerSchema.index({ isVerified: 1 });
providerSchema.index({ isSuspended: 1 });
providerSchema.index({ rating: -1 });

// Single export using conditional compilation
export const Provider = mongoose.models.Provider || mongoose.model('Provider', providerSchema);

// Add default export for compatibility
export default Provider;

// Create indexes if they don't exist
const createIndexes = async () => {
  try {
    // Get list of existing indexes
    const indexExists = async (indexSpec) => {
      const indexes = await Provider.collection.indexes();
      return indexes.some(index => 
        JSON.stringify(index.key) === JSON.stringify(indexSpec)
      );
    };

    // Create geospatial index if it doesn't exist
    const geoIndexSpec = { location: '2dsphere' };
    if (!(await indexExists(geoIndexSpec))) {
      await Provider.collection.createIndex(
        geoIndexSpec,
        { 
          name: 'provider_location_2dsphere',
          background: true
        }
      );
      console.log('Created provider geospatial index');
    }
  } catch (error) {
    console.error('Error creating Provider indexes:', error);
  }
};

// Add this to the pre-find middleware
providerSchema.pre(['find', 'findOne'], function(next) {
  this.populate('serviceAreas')
      .populate('certifications')
      .populate({
        path: 'reviews',
        options: { sort: { createdAt: -1 }, limit: 10 }
      });
  next();
});

export { createIndexes };
