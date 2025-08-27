import express from 'express';
import {
  getRecurringBookings,
  createRecurringBooking,
  updateRecurringBooking,
  cancelRecurringBooking,
  pauseRecurringBooking
} from '../controllers/recurring-booking.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get recurring bookings
router.get('/', authMiddleware, getRecurringBookings);

// Create recurring booking
router.post('/', authMiddleware, createRecurringBooking);

// Update recurring booking
router.patch('/:recurringBookingId', authMiddleware, updateRecurringBooking);

// Cancel recurring booking
router.patch('/:recurringBookingId/cancel', authMiddleware, cancelRecurringBooking);

// Pause recurring booking
router.patch('/:recurringBookingId/pause', authMiddleware, pauseRecurringBooking);

export default router;