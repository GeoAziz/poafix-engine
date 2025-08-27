import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider', // Updated from 'Provider' to match our model naming
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
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
    enum: ['mpesa', 'cash', 'card'],
    default: 'mpesa'
  },
  mpesaReference: String,
  reference: {
    type: String,
    unique: true
  },
  currency: {
    type: String,
    default: 'KES'
  },
  clientName: String,
  serviceType: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'transactions'
});

// Indexes
transactionSchema.index({ providerId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ reference: 1 }, { unique: true });

// Instance methods from transaction.js
transactionSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  return this.save();
};

// Static methods from transaction.js
transactionSchema.statics.getProviderTransactions = function(providerId) {
  return this.find({ providerId }).sort({ createdAt: -1 });
};

transactionSchema.statics.getProviderSummary = function(providerId) {
  return this.aggregate([
    { $match: { providerId, status: 'completed' } },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);
};

// Prevent duplicate model registration
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

export { Transaction };
