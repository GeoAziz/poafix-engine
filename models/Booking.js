import mongoose from 'mongoose';

export const VALID_STATUSES = [
    'pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'
];

const bookingSchema = new mongoose.Schema({
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    serviceType: {
        type: String,
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    services: [{
        name: String,
        quantity: Number,
        basePrice: Number,
        totalPrice: Number
    }],
    notes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: VALID_STATUSES,
        default: 'pending'
    },
    payment: {
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending'
        },
        method: {
            type: String,
            enum: ['mpesa', 'card', 'cash'],
            default: 'mpesa'
        }
    }
}, {
});

// Add this before creating the model
bookingSchema.pre('find', function() {
    console.log('Finding bookings with query:', this.getQuery());
});

// Add query helpers
bookingSchema.query.byProvider = function(providerId) {
    return this.find({
        $or: [
            { provider: providerId },
            { providerId: providerId },
            { 'provider._id': providerId }
        ]
    });
};

// Create indexes
bookingSchema.index({ client: 1, status: 1 });
bookingSchema.index({ providerId: 1, status: 1 });
bookingSchema.index({ scheduledDate: 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ location: '2dsphere' });

// Add method to update payment status
bookingSchema.methods.updatePaymentStatus = async function(status, transactionDetails = {}) {
    this.payment.status = status;
    if (status === 'completed') {
        this.payment.paidAmount = transactionDetails.amount;
        this.payment.paidAt = new Date();
        this.payment.transactionId = transactionDetails.transactionId;
    }
    return this.save();
};

// Check if model exists before creating
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export default Booking;
