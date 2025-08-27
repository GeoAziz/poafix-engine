import mongoose from 'mongoose';

const certificationSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',  // Updated to match our naming
    required: true
  },
  type: {
    type: String,
    required: true
  },
  issuedBy: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  documentUrl: String,
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  }
}, { 
  timestamps: true,
  collection: 'certifications'  // Added explicit collection name
});

// Add indexes for better query performance
certificationSchema.index({ providerId: 1 });
certificationSchema.index({ verificationStatus: 1 });
certificationSchema.index({ expiryDate: 1 });

// Prevent duplicate model registration
const Certification = mongoose.models.Certification || mongoose.model('Certification', certificationSchema);

export { Certification };
