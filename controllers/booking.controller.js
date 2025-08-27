import { initiatePaypalPayment } from '../services/paypal.service.js';
// PayPal payment endpoint
export const payWithPaypal = async (req, res) => {
  try {
    const { paymentId } = req.body;
    console.log('[PayPal] Received payWithPaypal request:', req.body);
    const Payment = (await import('../models/Payment.js')).default || (await import('../models/Payment.js'));
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      console.error('[PayPal] Payment not found:', paymentId);
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    // Update payment method and status
    payment.method = 'paypal';
    payment.status = 'processing';
    await payment.save();
    // Simulate PayPal API
    const result = await initiatePaypalPayment({
      amount: payment.amount,
      bookingId: payment.bookingId,
      clientId: payment.clientId,
      providerId: payment.providerId
    });
    console.log('[PayPal] Payment initiation result:', result);
    payment.transactionRef = result.transactionRef;
    payment.paypalPaymentUrl = result.approvalUrl;
    await payment.save();
    res.json({ success: true, approvalUrl: result.approvalUrl });
  } catch (err) {
    console.error('[PayPal] Error in payWithPaypal:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
import { Booking, Notification, BOOKING_STATUSES } from '../models/index.js';
import mongoose from 'mongoose';
import { WebSocketService } from '../services/websocket.service.js';
import { ServiceProvider } from '../models/ServiceProvider.js';

export const createBooking = async (req, res) => {
  try {
    console.log('=== Booking Creation Request ===');
    console.log('Request Body:', req.body);
    // Ensure both provider and client are set as ObjectIds for schema consistency
    const bookingData = { ...req.body };
    if (req.body.providerId) {
      bookingData.provider = mongoose.Types.ObjectId(req.body.providerId);
      bookingData.providerId = req.body.providerId;
    }
    if (req.body.clientId) {
      bookingData.client = mongoose.Types.ObjectId(req.body.clientId);
      bookingData.clientId = req.body.clientId;
    }
    const booking = new Booking(bookingData);
    const savedBooking = await booking.save();
    console.log('Booking saved:', savedBooking._id);

    // Notify provider through WebSocket
    console.log('Triggering provider notification:', booking.provider.id);
    WebSocketService.notifyUser(booking.provider.id, {
      type: 'NEW_BOOKING',
      data: savedBooking
    });

    // Optionally, trigger notification service for persistent notification
    try {
      const notificationService = await import('../services/notification.service.js');
      await notificationService.NotificationService.createNotification({
  recipient: booking.provider.id,
        recipientModel: 'provider',
        type: 'new_booking',
        title: 'New Booking',
        message: `You have a new booking from client ${booking.client.id}`,
        data: { bookingId: savedBooking._id }
      });
      console.log('Provider notification persisted.');
    } catch (notifyErr) {
      console.error('Error triggering persistent notification:', notifyErr);
    }

    res.status(201).json({
      success: true,
      data: savedBooking
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const getProviderBookings = async (req, res) => {
  try {
    console.log('Getting bookings for provider:', {
      providerId: req.userId,
      userType: req.userType
    });
    
    const bookings = await Booking.find({ provider: req.userId })
      .populate('provider', 'name businessName')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Transform the data to include required fields
    const transformedBookings = bookings.map(booking => ({
      ...booking,
      providerName: booking.provider?.businessName || booking.provider?.name || 'Unknown Provider',
      serviceName: booking.serviceName || booking.serviceType // Fallback to serviceType
    }));

    console.log(`Found ${bookings.length} bookings`);

    res.json({
      success: true,
      data: transformedBookings
    });
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    console.log('Starting status update:', {
      bookingId,
      newStatus: status,
      providerId: req.userId
    });

    // First find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    let bookingProviderId = null;
    console.log('[DEBUG] booking.providerId:', booking.providerId, 'booking.provider:', booking.provider);
    if (booking.providerId) {
      try {
        bookingProviderId = booking.providerId.toString();
      } catch (err) {
        console.error('[ERROR] booking.providerId.toString() failed:', err, 'Value:', booking.providerId);
      }
    } else if (booking.provider && typeof booking.provider.toString === 'function') {
      try {
        bookingProviderId = booking.provider.toString();
      } catch (err) {
        console.error('[ERROR] booking.provider.toString() failed:', err, 'Value:', booking.provider);
      }
    } else if (typeof booking.provider === 'string') {
      bookingProviderId = booking.provider;
    }
    if (!bookingProviderId) {
      console.error('[ERROR] Provider ID is missing in booking:', booking);
      return res.status(400).json({ success: false, error: 'Provider ID is missing in booking.' });
    }
    console.log('[DEBUG] bookingProviderId:', bookingProviderId, 'req.userId:', req.userId);
    if (!req.userId) {
      console.error('[ERROR] req.userId is undefined. Auth context:', req.userId, req.userType);
      return res.status(403).json({ success: false, error: 'User ID missing in request context.' });
    }
    if (bookingProviderId !== req.userId.toString()) {
      console.error('[ERROR] Provider ID mismatch:', bookingProviderId, req.userId);
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this booking'
      });
    }

    // Validate status value
    const validStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update using findOneAndUpdate and explicitly select client and provider
    let updatedBooking = await Booking.findOneAndUpdate(
      { _id: bookingId },
      { 
        $set: { 
          status: status,
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    if (updatedBooking) {
      updatedBooking = await Booking.findById(updatedBooking._id).select('client clientId provider providerId serviceType estimatedCost amount status');
      console.log('[BookingController] DEBUG updatedBooking after select:', updatedBooking);
    }
    console.log('[BookingController] updatedBooking after update:', updatedBooking);

    // Use client and provider for notifications and WebSocket, robust fallback
    let resolvedClientId = null;
    if (updatedBooking.client) {
      if (typeof updatedBooking.client === 'object' && updatedBooking.client !== null && updatedBooking.client._id) {
        resolvedClientId = String(updatedBooking.client._id);
      } else if (typeof updatedBooking.client === 'string' || typeof updatedBooking.client === 'number') {
        resolvedClientId = String(updatedBooking.client);
      }
    } else if (updatedBooking.clientId) {
      resolvedClientId = String(updatedBooking.clientId);
    }
    if (!resolvedClientId) {
      if (booking.client) {
        if (typeof booking.client === 'object' && booking.client !== null && booking.client._id) {
          resolvedClientId = String(booking.client._id);
        } else if (typeof booking.client === 'string' || typeof booking.client === 'number') {
          resolvedClientId = String(booking.client);
        }
      } else if (booking.clientId) {
        resolvedClientId = String(booking.clientId);
      }
      console.warn('[BookingController] Fallback to booking.client for resolvedClientId:', resolvedClientId);
    }
    let resolvedProviderId = null;
    if (updatedBooking.provider) {
      if (typeof updatedBooking.provider === 'object' && updatedBooking.provider !== null && updatedBooking.provider._id) {
        resolvedProviderId = String(updatedBooking.provider._id);
      } else if (typeof updatedBooking.provider === 'string' || typeof updatedBooking.provider === 'number') {
        resolvedProviderId = String(updatedBooking.provider);
      }
    } else if (updatedBooking.providerId) {
      resolvedProviderId = String(updatedBooking.providerId);
    }
    if (!resolvedProviderId) {
      if (booking.provider) {
        if (typeof booking.provider === 'object' && booking.provider !== null && booking.provider._id) {
          resolvedProviderId = String(booking.provider._id);
        } else if (typeof booking.provider === 'string' || typeof booking.provider === 'number') {
          resolvedProviderId = String(booking.provider);
        }
      } else if (booking.providerId) {
        resolvedProviderId = String(booking.providerId);
      }
    }
    let notification;
    if (status === 'completed') {
      console.log('[BookingController] Entered completed status block for booking:', updatedBooking._id);
      try {
        // 1. Send job completed notification
        const jobNotification = await Notification.create({
          type: 'JOB_COMPLETED',
          recipient: resolvedClientId,
          recipientModel: 'Client',
          title: 'Booking Completed',
          message: 'Your booking has been completed.',
          data: {
            bookingId: updatedBooking._id,
            status: 'completed',
            serviceType: updatedBooking.serviceType
          }
        });
        console.log('[Notification] JOB_COMPLETED notification created:', jobNotification._id);

        // 2. Create payment and send payment request notification
        const Payment = (await import('../models/Payment.js')).default || (await import('../models/Payment.js'));
        let amount = updatedBooking.estimatedCost || updatedBooking.amount;
        console.log('[BookingController] Payment amount resolved:', amount);
        if (!amount || amount <= 0) amount = 3500;
        console.log('[BookingController] ProviderId resolved:', resolvedProviderId);
        if (!resolvedProviderId) {
          console.error('[BookingController] Cannot create payment notification: providerId is missing for booking', updatedBooking._id);
          return res.status(400).json({
            success: false,
            error: 'Cannot create payment notification: providerId is missing.'
          });
        }
        const payment = await Payment.create({
          bookingId: updatedBooking._id,
          clientId: resolvedClientId,
          providerId: resolvedProviderId,
          amount,
          method: 'mpesa', // Use a valid method
          status: 'pending'
        });
        console.log('[Payment] Payment record created:', payment._id);
        notification = await Notification.create({
          type: 'PAYMENT_REQUEST',
          recipient: resolvedClientId,
          recipientModel: 'Client',
          title: 'Payment Required',
          message: `Please pay KES ${amount} for your completed service. Choose MPesa or PayPal.`,
          data: {
            bookingId: updatedBooking._id,
            paymentId: payment._id,
            amount,
            clientId: resolvedClientId,
            providerId: resolvedProviderId,
            methods: ['mpesa', 'paypal']
          }
        });
        console.log('[Notification] PAYMENT_REQUEST notification created:', notification._id);
      } catch (err) {
        console.error('[BookingController] Error in completed status block:', err);
        // Fallback: create error notification for client
        notification = await Notification.create({
          type: 'PAYMENT_ERROR',
          recipient: resolvedClientId,
          recipientModel: 'Client',
          title: 'Payment Notification Error',
          message: 'There was an error creating your payment request. Please contact support.',
          data: {
            bookingId: updatedBooking._id,
            error: err.message
          }
        });
        console.log('[Notification] PAYMENT_ERROR notification created:', notification._id);
        return res.status(500).json({
          success: false,
          error: 'Failed to create payment or notification',
          details: err.message
        });
      }
    } else {
      notification = await Notification.create({
        type: 'JOB_UPDATE',
        recipient: resolvedClientId,
        recipientModel: 'Client',
        title: status === 'in_progress' ? 'Job Started' : 'Job Status Updated',
        message: status === 'in_progress' 
          ? 'Your job has been started by the provider.'
          : `Your booking has been ${status}`,
        data: {
          ...updatedBooking.toObject(),
          action: status === 'in_progress' ? 'started' : status
        }
      });
    }


    console.log('Status updated successfully:', {
      bookingId,
      newStatus: status,
      notificationId: notification._id
    });

    // Try to notify client through WebSocket
    let delivered = false;
    let clientIdStr = null;
    try {
      console.log('[BookingController] WebSocket notify debug:', {
        updatedBooking,
        resolvedClientId
      });
      if (resolvedClientId) {
        if (typeof resolvedClientId === 'object' && resolvedClientId !== null && resolvedClientId._id) {
          clientIdStr = resolvedClientId._id.toString();
        } else if (typeof resolvedClientId.toString === 'function') {
          clientIdStr = resolvedClientId.toString();
        } else if (typeof resolvedClientId === 'string') {
          clientIdStr = resolvedClientId;
        }
        WebSocketService.notifyUser(clientIdStr, {
          type: 'BOOKING_UPDATE',
          data: {
            bookingId: updatedBooking._id,
            status: updatedBooking.status,
            notification: {
              id: notification._id,
              message: notification.message
            }
          }
        });
        delivered = WebSocketService.getConnectedUsers().includes(clientIdStr);
      } else {
        console.warn('[BookingController] Could not resolve client for WebSocket notification. Value:', resolvedClientId);
        delivered = false;
      }
    } catch (wsError) {
      console.warn('WebSocket notification failed:', wsError);
      delivered = false;
      // Continue processing as notification is already stored in database
    }
    if (!resolvedClientId) {
      console.error('[BookingController] resolvedClientId is undefined for booking', bookingId, 'Booking:', updatedBooking);
    }
    res.json({
      success: true,
      data: updatedBooking,
      notification: {
        id: notification._id,
        delivered
      }
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const getBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log('Fetching booking:', {
      bookingId,
      userId: req.userId,
      userType: req.userType
    });

    const booking = await Booking.findById(bookingId)
      .populate('provider', 'name email')
      .populate('client', 'name email');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const isAuthorized = booking.isAuthorizedUser(req.userId, req.userType);

    console.log('Authorization check:', {
      isAuthorized,
      bookingProvider: booking.provider._id,
      bookingClient: booking.client._id,
      requestingUser: req.userId,
      userType: req.userType
    });

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
