import express from 'express';
import { Booking, VALID_STATUSES } from '../models/index.js';  // Import from index instead
import authMiddleware from '../middleware/auth.middleware.js';
import mongoose from 'mongoose';
import { NotificationService } from '../services/notification.service.js';
import { Notification } from '../models/index.js';
import { Job } from '../models/index.js';  // Updated import path
import { WebSocketService } from '../services/websocket.service.js'; // Add this import
import JobService from '../services/job.service.js';
import { Provider } from '../models/provider.model.js';
import { checkSuspension } from '../middleware/suspension-validation.middleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Basic rate limiting middleware
const createRateLimiter = (windowMs, max) => {
  return (req, res, next) => {
    // Simple in-memory store - replace with Redis for production
    const store = new Map();
    const now = Date.now();
    const key = req.ip;
    
    // Clean up old entries
    store.forEach((value, key) => {
      if (value.timestamp < now - windowMs) {
        store.delete(key);
      }
    });

    // Get current count
    const record = store.get(key) || { count: 0, timestamp: now };
    
    if (record.count >= max) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later'
      });
    }

    // Update count
    record.count++;
    store.set(key, record);
    next();
  };
};

// Apply rate limiting to booking creation
const bookingLimiter = createRateLimiter(1000, 1); // 1 request per second

// Debug logs for route registration
console.log('Setting up booking routes');

// Test route with middleware logging
router.use((req, res, next) => {
    console.log('Route accessed:', {
        path: req.path,
        method: req.method,
        userId: req.userId,
        userType: req.userType
    });
    next();
});

// Test route
router.get('/test', (req, res) => {
    console.log('Test route accessed');
    res.json({
        success: true,
        message: 'Booking routes are working',
        timestamp: new Date().toISOString()
    });
});

// Provider bookings route
router.get('/by-provider', authMiddleware, async (req, res) => {
    try {
        console.log('Debug - Provider Route:', {
            userId: req.userId,
            userType: req.userType,
            headers: req.headers
        });

        // Check provider status
        if (req.userType !== 'service-provider') {
            console.log('Access denied: Invalid user type:', req.userType);
            return res.status(403).json({
                success: false,
                error: "Provider access only"
            });
        }

        // Find bookings using provider ID
        const providerId = req.userId;
        const bookings = await Booking.find({
            $or: [
                { 'provider': providerId },
                { 'providerId': providerId },
                { 'provider._id': providerId },
                { 'provider.id': providerId }
            ]
        }).sort({ createdAt: -1 });

        console.log(`Found ${bookings.length} bookings for provider ${providerId}`);

        return res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Provider bookings error:', error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            details: error.message
        });
    }
});

// Update the client bookings route
router.get('/client/:clientId', authMiddleware, async (req, res) => {
  try {
    const { clientId } = req.params;
    
    console.log('Client booking request:', {
      requestedClientId: clientId,
      authenticatedUser: {
        id: req.user?.id,
        type: req.user?.type
      }
    });

    // Validate client authorization
    if (!req.user || req.user.id !== clientId) {
      console.log('Authorization failed:', {
        requestedId: clientId,
        authUserId: req.user?.id
      });
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view these bookings'
      });
    }

    // Find bookings with all possible client ID formats
    const bookings = await Booking.find({
      $or: [
        { clientId: clientId },
        { 'client.id': clientId },
        { 'client._id': clientId },
  { clientId: clientId }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${bookings.length} bookings for client ${clientId}`);
    
    // Transform booking data to ensure consistent format
    const transformedBookings = bookings.map(booking => ({
      _id: booking._id,
      serviceType: booking.serviceType,
      serviceName: booking.serviceName,
      status: booking.status.toLowerCase(),
  schedule: booking.schedule,
      amount: booking.amount,
      location: booking.location,
  providerId: booking.providerId,
  clientId: booking.clientId,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.json({
      success: true,
      data: transformedBookings
    });
  } catch (error) {
    console.error('Error fetching client bookings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all bookings (with provider filter)
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Get bookings request:', {
      userId: req.user?.id,
      userType: req.user?.type
    });

    let query = {};
    
    if (req.user.type === 'service-provider') {
      query = {
        $or: [
          { providerId: req.user.id },
          { 'provider.id': req.user.id },
          { providerId: req.user.id }
        ]
      };
    } else if (req.user.type === 'client') {
      query = {
        $or: [
          { clientId: req.user.id },
          { 'client.id': req.user.id },
          { clientId: req.user.id }
        ]
      };
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    
    console.log(`Found ${bookings.length} bookings for ${req.user.type}`);
    
    res.json({ 
      success: true, 
      data: bookings 
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Create new booking
router.post('/', authMiddleware, bookingLimiter, async (req, res) => {
  try {
    // Accept both legacy and new field names
    const {
      providerId,
      clientId,
      serviceType,
      schedule,
      scheduledTime,
      address,
      description,
      status,
      ...rest
    } = req.body;


    // Robustly parse schedule from various frontend formats
    let scheduleDate = null;
    if (schedule) {
      scheduleDate = new Date(schedule);
  } else if (schedule && scheduledTime) {
      // Try to parse scheduledTime as AM/PM or 24h
      let time24 = scheduledTime;
      if (/am|pm/i.test(scheduledTime)) {
        // Convert to 24h
        const [time, modifier] = scheduledTime.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier.toLowerCase() === 'pm' && hours < 12) hours += 12;
        if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;
        time24 = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
  // Accept schedule as ISO or YYYY-MM-DD
  let datePart = schedule.split('T')[0];
      scheduleDate = new Date(`${datePart}T${time24}:00.000Z`);
    } else if (schedule) {
      scheduleDate = new Date(schedule);
    }

    // Log for debugging
  console.log('Parsed scheduleDate:', scheduleDate, 'from schedule:', schedule, 'scheduledTime:', scheduledTime);

    if (!providerId || !clientId || !serviceType || !scheduleDate || isNaN(scheduleDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid required fields',
        received: { providerId, clientId, serviceType, schedule: scheduleDate }
      });
    }

    const booking = new Booking({
      providerId,
      clientId,
      serviceType,
      schedule: scheduleDate,
      address,
      description,
      status: status || 'pending',
      ...rest
    });

    console.log('Attempting to save booking:', booking);
    const savedBooking = await booking.save();
    console.log('Booking saved:', savedBooking);

    // Create notification
    if (typeof NotificationService?.createNotification === 'function') {
      await NotificationService.createNotification({
        recipientId: providerId,
        recipientModel: 'provider', // must be lowercase to match enum
        type: 'BOOKING_REQUEST',
        title: 'New Booking Request',
        message: `You have a new ${serviceType} service request`,
        data: {
          bookingId: savedBooking._id,
          serviceType: savedBooking.serviceType,
          schedule: savedBooking.schedule
        }
      });
    }

    res.status(201).json({
      success: true,
      data: savedBooking
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create booking'
    });
  }
});

// Get single booking
router.get('/:bookingId', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log('Fetching booking:', {
      bookingId,
      userId: req.userId,
      userType: req.userType
    });

    // First validate booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    console.log('Found booking:', {
      bookingId: booking._id,
  providerId: booking.providerId,
      providerId: booking.providerId,
      requestingUserId: req.userId,
      userType: req.userType
    });

    // Check provider access - handle both provider and providerId fields
    if (req.userType === 'service-provider') {
      const bookingProviderId = booking.providerId?.toString() || booking.provider?.toString();
      const isProvider = bookingProviderId === req.userId;
      
      console.log('Authorization check:', {
        bookingProviderId,
        requestUserId: req.userId,
        isProvider
      });

      if (!isProvider) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view this booking'
        });
      }
    }

    return res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Booking fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
      details: error.message
    });
  }
});

// Update booking status
router.patch('/:bookingId', authMiddleware, bookingLimiter, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    console.log(`Updating booking ${bookingId} to status: ${status}`);

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // For 'accepted' and 'rejected', handle directly here
    if (status === 'accepted' || status === 'rejected') {
      booking.status = status;
      await booking.save();
      const notificationType = status === 'accepted' ? 'BOOKING_ACCEPTED' : 'BOOKING_REJECTED';
      await NotificationService.createNotification({
        recipientId: booking.clientId,
        recipientModel: 'client',
        type: notificationType,
        title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your booking request has been ${status}`,
        data: {
          bookingId: booking._id,
          serviceType: booking.serviceType,
          status: status
        }
      });
      WebSocketService.emitToUser(booking.clientId.toString(), 'booking_update', {
        bookingId: booking._id,
        status: status,
        timestamp: new Date()
      });
      if (status === 'accepted') {
        const job = await JobService.createFromBooking(bookingId);
        return res.json({
          success: true,
          data: { booking, job }
        });
      }
      const response = {
        success: true,
        booking: {
          ...booking.toObject(),
          serviceRequestId: booking.serviceRequestId
        }
      };
      return res.json(response);
    }

    // For 'completed' and 'in_progress', delegate to controller logic
    // Import and call updateBookingStatus from controller
    const { updateBookingStatus } = await import('../controllers/booking.controller.js');
    return updateBookingStatus(req, res);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false, 
      error: error.message
    });
  }
});

// Add this route for canceling bookings
router.patch('/:bookingId/cancel', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log('Cancel booking attempt:', {
      bookingId,
      userId: req.user?.id,
      userType: req.user?.type
    });

    // Find booking first
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Debug log to see booking data
    console.log('Found booking:', {
      bookingId: booking._id,
  clientId: booking.clientId,
  providerId: booking.providerId,
      requestingUserId: req.user?.id
    });

    // Updated authorization check to handle all client ID formats
    const bookingClientId = booking.clientId?.toString() || 
                          booking.client?.toString() || 
                          (booking.client?._id)?.toString() ||
                          (booking.client?.id)?.toString();

    const bookingProviderId = booking.providerId?.toString() || 
                             booking.provider?.toString() || 
                             (booking.provider?._id)?.toString();

    if (bookingClientId !== req.user?.id) {
      console.log('Authorization failed:', {
        bookingClientId,
        requestUserId: req.user?.id,
      });
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this booking'
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.lastUpdated = new Date();
    await booking.save();

    // Try to send notification but don't fail if it errors
    try {
      if (bookingProviderId) {
        await NotificationService.createNotification({
          recipientId: bookingProviderId,
          recipientModel: 'Provider',
          type: 'SYSTEM_ALERT', // Changed from BOOKING_CANCELLED
          title: 'Booking Cancelled',
          message: `Booking #${booking._id.toString().slice(-6)} has been cancelled`,
          data: {
            bookingId: booking._id,
            serviceType: booking.serviceType,
            type: 'booking_cancelled' // Add type in data
          }
        });
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Continue execution - don't fail the cancel operation
    }

    // Use WebSocketService static method
    if (global.io) {
      WebSocketService.emitToAll('booking_status_updated', {
        bookingId: booking._id,
        status: 'cancelled',
        timestamp: new Date()
      });
    }

    return res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
      details: error.message
    });
  }
});

// Add this new route for provider bookings
router.get('/provider/:providerId', authMiddleware, checkSuspension, async (req, res) => {
  try {
    // Use the provider from middleware
    const provider = req.provider;

    // Get bookings for this provider
    const bookings = await Booking.find({
      $or: [
        { providerId: provider._id },
  { providerId: provider._id }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('client', 'name phoneNumber')
    .lean();

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      details: error.message
    });
  }
});

// Debug route for provider bookings
router.get('/debug/:providerId', async (req, res) => {
    try {
        const { providerId } = req.params;
        
        // Find bookings with all possible provider field formats
        const bookings = await Booking.find({
            $or: [
                { providerId: providerId },
                { providerId: providerId },
                { 'provider._id': providerId },
                { 'provider.id': providerId }
            ]
        }).lean();

        res.json({
            success: true,
            debug: {
                searchedFor: providerId,
                totalFound: bookings.length,
                bookings: bookings.map(b => ({
                    _id: b._id,
                    providerId: b.providerId,
                    providerId: b.providerId,
                    status: b.status
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
