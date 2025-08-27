import mongoose from 'mongoose';

const recurrencePatternSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
    required: true
  },
  interval: {
    type: Number,
    default: 1
  },
  daysOfWeek: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  dayOfMonth: Number,
  monthOfYear: Number,
  customPattern: {
    type: Object,
    default: {}
  }
});

const recurringBookingInstanceSchema = new mongoose.Schema({
  scheduledDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'skipped'],
    default: 'scheduled'
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  amount: {
    type: Number,
    required: true
  },
  completedDate: Date,
  cancellationReason: String,
  customizations: {
    type: Object,
    default: {}
  }
});

const recurringBookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    required: true,
    enum: ['Client', 'ServiceProvider']
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
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  serviceDetails: {
    type: Object,
    required: true
  },
  recurrencePattern: {
    type: recurrencePatternSchema,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  maxOccurrences: Number,
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  upcomingBookings: [recurringBookingInstanceSchema],
  completedBookings: [recurringBookingInstanceSchema],
  location: {
    type: Object,
    required: true
  },
  notes: String,
  preferences: {
    type: Object,
    default: {}
  },
  lastExecuted: Date,
  nextExecution: Date
}, {
  timestamps: true
});

// Index for efficient querying
recurringBookingSchema.index({ userId: 1, isActive: 1 });
recurringBookingSchema.index({ providerId: 1, isActive: 1 });
recurringBookingSchema.index({ nextExecution: 1, isActive: 1 });

export default mongoose.model('RecurringBooking', recurringBookingSchema);