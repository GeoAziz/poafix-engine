import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  serviceType: {
    type: String,
    required: true
  },
  categoryRatings: {
    Quality: { type: Number, min: 0, max: 5, default: 0 },
    Timeliness: { type: Number, min: 0, max: 5, default: 0 },
    Communication: { type: Number, min: 0, max: 5, default: 0 },
    Professionalism: { type: Number, min: 0, max: 5, default: 0 },
    'Value for Money': { type: Number, min: 0, max: 5, default: 0 },
    // Legacy fields for backward compatibility
    punctuality: Number,
    professionalism: Number,
    serviceQuality: Number,
    communication: Number
  },
  quickFeedback: {
    'Arrived on time': { type: Boolean, default: false },
    'Professional conduct': { type: Boolean, default: false },
    'Clean work area': { type: Boolean, default: false },
    'Fair pricing': { type: Boolean, default: false },
    'Would recommend': { type: Boolean, default: false },
    'Fixed the problem': { type: Boolean, default: false }
  },
  date: {
    type: Date,
    default: Date.now
  },
  helpful: {
    type: Number,
    default: 0
  },
  flagged: {
    type: Boolean,
    default: false
  },
  flaggedReason: String,
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate average rating for provider
ratingSchema.statics.calculateProviderRating = async function(providerId) {
  const result = await this.aggregate([
    { $match: { providerId: new mongoose.Types.ObjectId(providerId) } },
    { $group: {
        _id: null,
        averageRating: { $avg: '$score' },
        totalRatings: { $sum: 1 }
    }}
  ]);
  return result[0] || { averageRating: 0, totalRatings: 0 };
};

// Change to use default export with model check
const Rating = mongoose.models.Rating || mongoose.model('Rating', ratingSchema);
export default Rating;
