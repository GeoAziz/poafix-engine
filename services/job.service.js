import Job from '../models/job.js';
import { Booking } from '../models/booking.model.js';
import { NotificationService } from './notification.service.js'; // Update import to use named import

class JobService {
  static async createFromBooking(bookingId) {
    try {
      // Get booking details
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Create new job
      // Ensure location and coordinates are present
      let location = booking.location;
      if (!location || !location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
        // fallback to default Nairobi coordinates
        location = {
          type: 'Point',
          coordinates: [36.8219, -1.2921],
          address: booking.address || 'Nairobi, Kenya'
        };
      }

      const job = new Job({
        bookingId: booking._id,
        providerId: booking.providerId,
        clientId: booking.clientId,
        serviceType: booking.serviceType,
        scheduledDate: booking.schedule, // match booking model
        location: location,
        amount: booking.amount || 0,
        payment: booking.payment || { method: 'mpesa', status: 'pending' },
        notes: booking.notes || '',
        status: 'pending'
      });

      await job.save();

      // Send notifications
      await NotificationService.createNotification({
        recipientId: booking.clientId,
        recipientModel: 'client',
        type: 'JOB_CREATED',
        title: 'Job Created',
        message: `Your ${booking.serviceType} service has been scheduled`,
        data: {
          jobId: job._id,
          bookingId: booking._id,
          serviceType: booking.serviceType
        }
      });

      return job;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }
}

export default JobService;
