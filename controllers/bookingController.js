import { Booking, Job } from '../models/index.js';
import { sendNotification } from '../services/notificationService.js';
import { io } from '../config/socket.js';

export const createBooking = async (req, res) => {
  try {
    const {
      providerId,
      clientId,
      serviceType,
      scheduledDate,
      services,
      totalAmount,
      payment,
      location
    } = req.body;

    const booking = new Booking({
      provider: providerId,
      client: clientId,
      serviceType,
      scheduledDate,
      services,
      amount: totalAmount,
      payment,
      location,
      status: 'pending'
    });

    await booking.save();

    // Emit socket event for real-time update
    io.to(`provider_${providerId}`).emit('new_booking', {
      type: 'NEW_BOOKING',
      booking: await booking.populate('client', 'name phoneNumber')
    });

    // Send notification to provider
    await sendNotification({
      recipientId: providerId,
      type: 'NEW_BOOKING',
      title: 'New Booking Request',
      message: `You have a new ${serviceType} booking request`,
      data: { bookingId: booking._id }
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add method to fetch provider's bookings
export const getProviderBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ provider: req.params.providerId })
      .populate('client', 'name phoneNumber')
      .sort({ scheduledDate: -1 });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, providerId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();

    // Create job when booking is accepted
    if (status === 'accepted') {
      const job = new Job({
        clientId: booking.clientId,
        providerId: booking.providerId,
        serviceType: booking.serviceType,
        description: booking.description,
        location: booking.location,
        scheduledDate: booking.scheduledDate,
        amount: booking.estimatedAmount,
        status: 'pending'
      });

      await job.save();

      // Emit event for real-time updates
      req.app.get('io').emit('job_created', {
        jobId: job._id,
        bookingId: booking._id,
        providerId: providerId
      });
    }

    res.json({ success: true, booking, job: status === 'accepted' ? job : null });
  } catch (error) {
    res.status (500).json({ error: error.message });
  }
};
