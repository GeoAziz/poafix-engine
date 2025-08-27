import mongoose from 'mongoose';

const clientReviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'clientReviews'
});

// Prevent duplicate model registration
const ClientReview = mongoose.models.ClientReview || mongoose.model('ClientReview', clientReviewSchema);

export { ClientReview };
