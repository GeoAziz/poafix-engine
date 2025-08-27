import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
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
  clientName: {
    type: String,
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  providerName: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  lastMessage: {
    content: String,
    timestamp: Date,
    senderId: mongoose.Schema.Types.ObjectId,
    senderType: {
      type: String,
      enum: ['client', 'provider']
    }
  },
  unreadCount: {
    client: {
      type: Number,
      default: 0
    },
    provider: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked', 'completed'],
    default: 'active'
  }
}, {
  timestamps: true,
  collection: 'chats'
});

// Indexes for performance
chatSchema.index({ bookingId: 1 });
chatSchema.index({ clientId: 1, updatedAt: -1 });
chatSchema.index({ providerId: 1, updatedAt: -1 });
chatSchema.index({ isActive: 1, status: 1 });

// Virtual for getting the other participant info
chatSchema.virtual('otherParticipant').get(function() {
  // This would be populated based on the current user type
  return null;
});

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
