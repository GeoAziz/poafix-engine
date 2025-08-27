import mongoose from 'mongoose';

const providerDocumentSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['ID_DOCUMENT', 'BUSINESS_LICENSE', 'INSURANCE_POLICY', 'VEHICLE_REGISTRATION']
  },
  category: {
    type: String,
    required: true,
    enum: ['Identity', 'Certifications', 'Insurance']
  },
  documentNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationNotes: String,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  verifiedAt: Date,
  documentUrl: String,
  expiryDate: Date,
  issuedDate: Date,
  issuingAuthority: String,
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

export const ProviderDocument = mongoose.model('ProviderDocument', providerDocumentSchema);
export default ProviderDocument;