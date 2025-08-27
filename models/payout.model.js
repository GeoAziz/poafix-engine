import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'bank'],
    required: true
  },
  reference: {
    type: String,
    unique: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  notes: String
}, {
  timestamps: true
});

const Payout = mongoose.model('Payout', payoutSchema);
export default Payout;
