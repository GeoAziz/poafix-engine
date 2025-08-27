import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
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
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  method: {
    type: String,
    required: true,
    enum: ['mpesa', 'card', 'cash', 'paypal']
  },
  transactionRef: String,
  currency: {
    type: String,
    default: 'KES'
  },
  // PayPal specific fields
  paypalOrderId: String,
  paypalPayerId: String,
  paypalTransactionId: String,
  paypalPaymentUrl: String,
  // MPesa specific fields
  mpesaCheckoutRequestId: String,
  mpesaReceiptNumber: String,
  mpesaPhoneNumber: String,
}, { 
  timestamps: true,
  collection: 'payments'
});


const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export default Payment;
