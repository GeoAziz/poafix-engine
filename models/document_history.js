import mongoose from 'mongoose';

const documentHistorySchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderDocument',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'verified', 'rejected']
  },
  comment: String,
  actionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export const DocumentHistory = mongoose.model('DocumentHistory', documentHistorySchema);
export default DocumentHistory;
