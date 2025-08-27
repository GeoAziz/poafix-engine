import mongoose from 'mongoose';

const suspensionSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  reasonType: {
    type: String,
    enum: ['Policy Violation', 'Poor Service Quality', 'Customer Complaints', 'Document Verification Issues', 'Other'],
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
});

const Suspension = mongoose.model('Suspension', suspensionSchema);
export default Suspension;
