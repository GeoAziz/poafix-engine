import express from 'express';
import Review from '../models/review.model.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// Create review
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { providerId, bookingId, rating, review } = req.body;
    const newReview = await Review.create({
      providerId,
      bookingId,
      clientId: req.user.id,
      rating,
      review,
      date: new Date()
    });
    
    res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get provider reviews
router.get('/provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const reviews = await Review.find({ providerId })
      .populate('clientId', 'name')
      .sort('-date')
      .lean();

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get review statistics for a provider
router.get('/provider/:providerId/stats', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const stats = await Review.aggregate([
      { $match: { providerId: providerId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratings: { $push: '$rating' }
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
      },
      {
        $project: {
          averageRating: { $round: ['$averageRating', 1] },
          totalReviews: 1,
          ratingBreakdown: 1
        }
      }
    ]);

    const result = stats[0] || {
      averageRating: 0,
      totalReviews: 0,
      ratingBreakdown: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check if user has reviewed a booking
router.get('/booking/:bookingId/check', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const existingReview = await Review.findOne({
      bookingId,
      clientId: req.user.id
    });

    res.json({
      success: true,
      hasReviewed: !!existingReview
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent reviews (for discovery/homepage)
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10, serviceType } = req.query;
    
    const matchConditions = {};
    if (serviceType) {
      matchConditions.serviceType = serviceType;
    }

    const reviews = await Review.find(matchConditions)
      .populate('clientId', 'name')
      .populate('providerId', 'businessName serviceOffered')
      .sort('-date')
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Report a review
router.post('/:reviewId/report', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    // You can create a reports collection or add a flag to the review
    await Review.findByIdAndUpdate(reviewId, {
      $push: {
        reports: {
          reportedBy: req.user.id,
          reason,
          date: new Date()
        }
      }
    });

    res.json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get review analytics for a provider
router.get('/provider/:providerId/analytics', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    // Get rating trends over time
    const trends = await Review.aggregate([
      { $match: { providerId: providerId } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get common themes/keywords
    const commonThemes = await Review.aggregate([
      { $match: { providerId: providerId } },
      {
        $project: {
          words: { $split: [{ $toLower: '$review' }, ' '] }
        }
      },
      { $unwind: '$words' },
      {
        $match: {
          words: { $regex: /^[a-zA-Z]{4,}$/ } // Only words with 4+ letters
        }
      },
      {
        $group: {
          _id: '$words',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Calculate trend direction
    let trendDirection = 'stable';
    let trendChange = 0;
    if (trends.length >= 2) {
      const recent = trends[trends.length - 1].averageRating;
      const previous = trends[trends.length - 2].averageRating;
      trendChange = ((recent - previous) / previous * 100).toFixed(1);
      trendDirection = recent > previous ? 'improved' : recent < previous ? 'declined' : 'stable';
    }

    res.json({
      success: true,
      data: {
        trends: {
          direction: trendDirection,
          change: Math.abs(trendChange),
          monthlyData: trends
        },
        commonThemes: commonThemes.map(theme => ({
          word: theme._id,
          count: theme.count
        })),
        categoryBreakdown: {} // Will be populated if category ratings exist
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search reviews with filters
router.get('/search', async (req, res) => {
  try {
    const {
      q: query,
      minRating,
      maxRating,
      serviceType,
      verified,
      limit = 20
    } = req.query;

    const matchConditions = {};

    if (query) {
      matchConditions.$or = [
        { review: { $regex: new RegExp(query, 'i') } },
        { serviceType: { $regex: new RegExp(query, 'i') } }
      ];
    }

    if (minRating) {
      matchConditions.rating = { $gte: parseFloat(minRating) };
    }

    if (maxRating) {
      if (matchConditions.rating) {
        matchConditions.rating.$lte = parseFloat(maxRating);
      } else {
        matchConditions.rating = { $lte: parseFloat(maxRating) };
      }
    }

    if (serviceType) {
      matchConditions.serviceType = serviceType;
    }

    if (verified === 'true') {
      matchConditions.isVerified = true;
    }

    const reviews = await Review.find(matchConditions)
      .populate('clientId', 'name')
      .populate('providerId', 'businessName serviceOffered')
      .sort('-date')
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Provider respond to review
router.post('/:reviewId/respond', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Verify the provider owns this review
    if (review.providerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to respond to this review'
      });
    }

    review.providerResponse = response;
    review.responseDate = new Date();
    await review.save();

    res.json({
      success: true,
      message: 'Response added successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.post('/:reviewId/like', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // Toggle like
    const likedIndex = review.likedBy?.indexOf(userId) ?? -1;
    if (likedIndex === -1) {
      // Add like
      await Review.findByIdAndUpdate(reviewId, {
        $push: { likedBy: userId },
        $inc: { likes: 1 }
      });
    } else {
      // Remove like
      await Review.findByIdAndUpdate(reviewId, {
        $pull: { likedBy: userId },
        $inc: { likes: -1 }
      });
    }

    res.json({
      success: true,
      message: 'Review like toggled successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
