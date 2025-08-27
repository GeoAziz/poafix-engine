import mongoose from 'mongoose';

// Add notification types constant
export const NOTIFICATION_TYPES = {
  REQUEST: 'request',
  MESSAGE: 'message',
  SYSTEM: 'system',
  ALERT: 'alert',
  ERROR: 'error'
};

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(NOTIFICATION_TYPES)
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
