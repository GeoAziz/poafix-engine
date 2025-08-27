import express from 'express';
import Rating from '../models/rating.model.js';
import Review from '../models/review.model.js';
import { ServiceProvider } from '../models/ServiceProvider.js';
import { Client } from '../models/Client.js';
import { Booking } from '../models/booking.model.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Create a new rating
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      bookingId,
      providerId,
      score,
      comment,
      serviceType,
      categoryRatings,
      quickFeedback
    } = req.body;

    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user already rated this booking
    const existingRating = await Rating.findOne({
      bookingId,
      clientId: req.user.id
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        error: 'You have already rated this booking'
      });
    }

    // Create rating
    const rating = new Rating({
      bookingId,
      providerId,
      clientId: req.user.id,
      score,
      comment,
      serviceType,
      categoryRatings: categoryRatings || {},
      quickFeedback: quickFeedback || {},
      date: new Date()
    });

    await rating.save();

    // Update provider's average rating
    await updateProviderRating(providerId);

    // Also create a review if comment provided
    if (comment && comment.trim().length > 0) {
      const review = new Review({
        bookingId,
        providerId,
        clientId: req.user.id,
        rating: score,
        review: comment,
        serviceType,
        date: new Date(),
        isVerified: true // Auto-verify reviews from completed bookings
      });
      await review.save();
    }

    res.status(201).json({
      success: true,
      data: rating
    });
  } catch (error) {
    console.error('Error creating rating:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get ratings for a provider
router.get('/provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { limit = 50, sortBy = 'recent' } = req.query;

    let sortOptions = {};
    switch (sortBy) {
      case 'rating_high':
        sortOptions = { score: -1 };
        break;
      case 'rating_low':
        sortOptions = { score: 1 };
        break;
      case 'recent':
      default:
        sortOptions = { date: -1 };
        break;
    }

    const ratings = await Rating.find({ providerId })
      .populate('clientId', 'name')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: ratings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get rating statistics for a provider
router.get('/provider/:providerId/stats', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const stats = await Rating.aggregate([
      { $match: { providerId: providerId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$score' },
          totalRatings: { $sum: 1 },
          ratings: { $push: '$score' }
        }
      },
      {
        $addFields: {
          ratingBreakdown: {
            '5': {
              $size: {
                $filter: {
                  input: '$ratings',
                  cond: { $eq: ['$$this', 5] }
                }
              }
            },
            '4': {
              $size: {
                $filter: {
                  input: '$ratings',
                  cond: { $eq: ['$$this', 4] }
                }
              }
            },
            '3': {
              $size: {
                $filter: {
                  input: '$ratings',
                  cond: { $eq: ['$$this', 3] }
                }
              }
            },
            '2': {
              $size: {
                $filter: {
                  input: '$ratings',
                  cond: { $eq: ['$$this', 2] }
                }
              }
            },
            '1': {
              $size: {
                $filter: {
                  input: '$ratings',
                  cond: { $eq: ['$$this', 1] }
                }
              }
            }
          }
        }
      }
    ]);

    // Get category ratings average
    const categoryStats = await Rating.aggregate([
      { $match: { providerId: providerId } },
      {
        $group: {
          _id: null,
          avgQuality: { $avg: '$categoryRatings.Quality' },
          avgTimeliness: { $avg: '$categoryRatings.Timeliness' },
          avgCommunication: { $avg: '$categoryRatings.Communication' },
          avgProfessionalism: { $avg: '$categoryRatings.Professionalism' },
          avgValueForMoney: { $avg: '$categoryRatings.Value for Money' }
        }
      }
    ]);

    const result = stats[0] || {
      averageRating: 0,
      totalRatings: 0,
      ratingBreakdown: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
    };

    if (categoryStats[0]) {
      result.categoryBreakdown = categoryStats[0];
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check if user has rated a booking
router.get('/booking/:bookingId/check', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const rating = await Rating.findOne({
      bookingId,
      clientId: req.user.id
    });

    res.json({
      success: true,
      hasRated: !!rating
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get rating breakdown for analytics
router.get('/provider/:providerId/breakdown', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const breakdown = await Rating.aggregate([
      { $match: { providerId: providerId } },
      {
        $group: {
          _id: '$serviceType',
          averageRating: { $avg: '$score' },
          count: { $sum: 1 },
          ratings: { $push: '$score' }
        }
      },
      {
        $sort: { averageRating: -1 }
      }
    ]);

    res.json({
      success: true,
      breakdown: breakdown
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger rating request (for providers to request ratings)
router.post('/trigger', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    // Verify booking exists and is completed
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Can only request rating for completed bookings'
      });
    }

    // Send notification to client (implement notification service)
    // This could trigger push notification, SMS, or email

    res.json({
      success: true,
      message: 'Rating request sent to client'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to update provider's average rating
async function updateProviderRating(providerId) {
  try {
    const stats = await Rating.aggregate([
      { $match: { providerId: providerId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$score' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await ServiceProvider.findByIdAndUpdate(providerId, {
        rating: stats[0].averageRating,
        totalRatings: stats[0].totalRatings
      });
    }
  } catch (error) {
    console.error('Error updating provider rating:', error);
  }
}

export default router;
