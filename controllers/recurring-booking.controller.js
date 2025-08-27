import RecurringBooking from '../models/recurringBooking.model.js';
import { Booking } from '../models/booking.model.js';

export const getRecurringBookings = async (req, res) => {
  try {
    const { userId, isActive, serviceType } = req.query;
    
    const query = {};
    if (userId) query.userId = userId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (serviceType) query.serviceType = serviceType;
    
    const bookings = await RecurringBooking.find(query)
      .sort({ createdAt: -1 })
      .populate('providerId', 'businessName')
      .populate('clientId', 'name');
    
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

export const createRecurringBooking = async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Calculate next execution date
    bookingData.nextExecution = calculateNextExecution(
      bookingData.startDate,
      bookingData.recurrencePattern
    );
    
    const recurringBooking = new RecurringBooking(bookingData);
    await recurringBooking.save();
    
    // Generate upcoming booking instances
    await generateUpcomingInstances(recurringBooking);
    
    res.status(201).json({
      success: true,
      data: recurringBooking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateRecurringBooking = async (req, res) => {
  try {
    const { recurringBookingId } = req.params;
    const updates = req.body;
    
    const booking = await RecurringBooking.findByIdAndUpdate(
      recurringBookingId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Recurring booking not found'
      });
    }
    
    // Regenerate upcoming instances if pattern changed
    if (updates.recurrencePattern) {
      await generateUpcomingInstances(booking);
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const cancelRecurringBooking = async (req, res) => {
  try {
    const { recurringBookingId } = req.params;
    const { reason } = req.body;
    
    const booking = await RecurringBooking.findByIdAndUpdate(
      recurringBookingId,
      { 
        isActive: false,
        cancellationReason: reason,
        cancelledAt: new Date()
      },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Recurring booking not found'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const pauseRecurringBooking = async (req, res) => {
  try {
    const { recurringBookingId } = req.params;
    const { resumeDate } = req.body;
    
    const booking = await RecurringBooking.findByIdAndUpdate(
      recurringBookingId,
      { 
        isActive: false,
        pausedAt: new Date(),
        resumeDate: resumeDate ? new Date(resumeDate) : null
      },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Recurring booking not found'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Helper functions
function calculateNextExecution(startDate, pattern) {
  const start = new Date(startDate);
  const now = new Date();
  
  switch (pattern.type) {
    case 'daily':
      return new Date(Math.max(start.getTime(), now.getTime()) + (pattern.interval * 24 * 60 * 60 * 1000));
    case 'weekly':
      return new Date(Math.max(start.getTime(), now.getTime()) + (pattern.interval * 7 * 24 * 60 * 60 * 1000));
    case 'monthly':
      const nextMonth = new Date(start);
      nextMonth.setMonth(nextMonth.getMonth() + pattern.interval);
      return nextMonth;
    default:
      return new Date(start.getTime() + (24 * 60 * 60 * 1000)); // Default to daily
  }
}

async function generateUpcomingInstances(recurringBooking) {
  const instances = [];
  let currentDate = new Date(recurringBooking.startDate);
  const endDate = recurringBooking.endDate ? new Date(recurringBooking.endDate) : new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)); // 1 year ahead
  const maxOccurrences = recurringBooking.maxOccurrences || 50;
  
  let count = 0;
  while (currentDate <= endDate && count < maxOccurrences) {
    if (currentDate > new Date()) { // Only future instances
      instances.push({
        scheduledDate: new Date(currentDate),
        status: 'scheduled',
        amount: recurringBooking.amount
      });
    }
    
    // Calculate next occurrence based on pattern
    currentDate = calculateNextExecution(currentDate, recurringBooking.recurrencePattern);
    count++;
  }
  
  // Update the recurring booking with new instances
  await RecurringBooking.findByIdAndUpdate(
    recurringBooking._id,
    { upcomingBookings: instances }
  );
}