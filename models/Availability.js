import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  weekDay: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  startTime: String,
  endTime: String
}, { timestamps: true });

export const Availability = mongoose.model('Availability', availabilitySchema);
