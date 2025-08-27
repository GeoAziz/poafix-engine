import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['general', 'payment', 'notification', 'system'],
    default: 'general'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
