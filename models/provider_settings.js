import mongoose from 'mongoose';

const providerSettingsSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    unique: true
  },
  workingHours: {
    monday: { start: String, end: String, isActive: Boolean },
    tuesday: { start: String, end: String, isActive: Boolean },
    wednesday: { start: String, end: String, isActive: Boolean },
    thursday: { start: String, end: String, isActive: Boolean },
    friday: { start: String, end: String, isActive: Boolean },
    saturday: { start: String, end: String, isActive: Boolean },
    sunday: { start: String, end: String, isActive: Boolean }
  },
  notifications: {
    bookingRequests: Boolean,
    messages: Boolean,
    updates: Boolean,
    marketing: Boolean
  },
  locationTracking: {
    enabled: Boolean,
    accuracy: String // 'high', 'medium', 'low'
  },
  paymentPreferences: {
    mpesa: Boolean,
    cash: Boolean,
    autoWithdrawal: Boolean,
    minimumWithdrawal: Number
  },
  serviceArea: {
    radius: Number, // in kilometers
    baseLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number] // [longitude, latitude]
    }
  }
}, {
  timestamps: true
});

export const ProviderSettings = mongoose.model('ProviderSettings', providerSettingsSchema);
