import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Base user schema
const userSchema = new mongoose.Schema({
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  phoneNumber: {
    type: String,
    required: true
  },
  address: String,
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
  backupContact: String,
  preferredCommunication: {
    type: String,
    enum: ['SMS', 'Email', 'Both'],
    default: 'Both'
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true,
  collection: 'users'
});

// Add new methods
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Add case-insensitive email index
userSchema.index({ email: 1 }, { 
  unique: true,
  collation: { locale: 'en', strength: 2 }
});

userSchema.pre('save', function(next) {
  // Validate backup contact format
  if (this.backupContact && !this.isValidPhoneNumber(this.backupContact)) {
    next(new Error('Invalid backup contact format'));
  }

  // Validate timezone
  if (this.timezone) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: this.timezone });
    } catch (e) {
      next(new Error('Invalid timezone'));
    }
  }

  next();
});

// Add validation middleware
userSchema.pre('save', async function(next) {
  try {
    // Validate and convert coordinates
    if (this.location && this.location.coordinates) {
      const coords = this.location.coordinates.map(coord => 
        typeof coord === 'number' ? coord : parseFloat(coord)
      );
      
      if (coords.some(isNaN)) {
        throw new Error('Invalid coordinates format');
      }
      
      this.location.coordinates = coords;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.isValidPhoneNumber = function(phone) {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

userSchema.path('preferredCommunication').validate(function(value) {
  return ['SMS', 'Email', 'Both'].includes(value);
}, 'Invalid communication preference');

// Create the base User model only if it doesn't exist
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Create Client discriminator only if it doesn't exist
const clientSchema = new mongoose.Schema({
  isBlocked: {
    type: Boolean,
    required: true,
    default: false
  },
  blockReason: {
    type: String,
    default: null
  },
  blockedAt: {
    type: Date,
    default: null
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  phoneNumber: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],  // This ensures coordinates are stored as numbers
      required: true,
      default: [36.8219, -1.2921], // Default to Nairobi coordinates
      validate: {
        validator: function(coords) {
          return Array.isArray(coords) && 
                 coords.length === 2 && 
                 coords[0] >= -180 && 
                 coords[0] <= 180 && 
                 coords[1] >= -90 && 
                 coords[1] <= 90;
        },
        message: 'Invalid coordinates. Must be [longitude, latitude]'
      }
    }
  }
});

// Add index for geospatial queries
clientSchema.index({ location: '2dsphere' });

// Remove any middleware that might interfere with the block operation
clientSchema.pre('save', function(next) {
  next();
});

// Add a static method to handle blocking
clientSchema.statics.blockClient = async function(clientId, reason, adminId) {
  return this.findByIdAndUpdate(
    clientId,
    {
      $set: {
        isBlocked: true,
        blockReason: reason,
        blockedAt: new Date(),
        blockedBy: adminId
      }
    },
    { new: true }
  );
};

// Check if Client discriminator already exists
const Client = mongoose.models.Client || User.discriminator('Client', clientSchema);

// Export models using a synchronized pattern
let exportedUser = null;
let exportedClient = null;

const getModels = () => {
  if (!exportedUser) {
    exportedUser = User;
    exportedClient = Client;
  }
  return { User: exportedUser, Client: exportedClient };
};

export const { User: ExportedUser, Client: ExportedClient } = getModels();

// Change exports to be consistent
export { User, Client };
export default User;
