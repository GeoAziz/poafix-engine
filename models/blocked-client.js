import mongoose from 'mongoose';

const blockedClientSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  blockedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'blockedclients'
});

// Remove all hooks - we'll handle updates directly in the route
blockedClientSchema.pre('save', function(next) {
  next();
});

// Change default export to named export
const BlockedClient = mongoose.model('BlockedClient', blockedClientSchema);
export { BlockedClient };
