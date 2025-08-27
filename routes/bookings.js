import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Booking } from '../models/index.js';

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log('[Bookings Route]', {
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    userType: req.headers['user-type'],
    auth: req.headers.authorization ? 'Present' : 'Missing'
  });
  next();
});

// Get provider's bookings - Notice this is now /provider/:providerId
router.get('/provider/:providerId', authenticateToken, async (req, res) => {
  try {
    const { providerId } = req.params;
    
    console.log('Fetching bookings for provider:', {
      providerId,
      user: req.user
    });

    if (!providerId) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID is required'
      });
    }

    const bookings = await Booking.find({ providerId })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${bookings.length} bookings for provider ${providerId}`);

    return res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
