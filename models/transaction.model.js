import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
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
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['mpesa', 'card', 'cash']
  },
  reference: {
    type: String,
    unique: true
  },
  currency: {
    type: String,
    default: 'KES'
  }
}, { 
  timestamps: true,
  collection: 'transactions'
});

// Prevent duplicate model registration
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

export { Transaction };
