import mongoose from 'mongoose';

const clientReviewSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Explicitly set the collection name
const ClientReview = mongoose.model('ClientReview', clientReviewSchema, 'clientReviews');

export { ClientReview };
export default ClientReview;
