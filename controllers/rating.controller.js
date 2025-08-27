import Rating from '../models/rating.model.js';
import { ServiceProvider, Notification } from '../models/index.js';
import mongoose from 'mongoose';

export const createRating = async (req, res) => {
  try {
    const rating = new Rating({
      ...req.body,
      clientId: req.user.id
    });

    await rating.save();

    // Calculate new provider rating
    const newRating = await Rating.calculateProviderRating(rating.providerId);

    // Update provider's average rating
    await ServiceProvider.findByIdAndUpdate(rating.providerId, {
      rating: newRating.averageRating,
      totalRatings: newRating.totalRatings
    });

    // Create notification for provider
    await Notification.create({
      recipientId: rating.providerId,
      recipientModel: 'Provider',
      type: 'NEW_RATING',
      title: 'New Rating Received',
      message: `You received a ${rating.score}-star rating`,
      data: {
        ratingId: rating._id,
        score: rating.score
      }
    });

    res.status(201).json({
      success: true,
      data: rating
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getProviderRatings = async (req, res) => {
  try {
    const { providerId } = req.params;
    const ratings = await Rating.find({ providerId })
      .populate('clientId', 'name')
      .sort('-createdAt');

    res.json({
      success: true,
      data: ratings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const triggerRating = (req, res) => {
  const { clientId, bookingId } = req.body;

  req.app.get('io').to(clientId).emit('trigger_rating', {
    bookingId,
    providerId: req.user.id,
  });

  res.status(200).json({ success: true, message: 'Rating triggered' });
};

export const getProviderAnalytics = async (req, res) => {
  try {
    const { providerId } = req.params;

    const ratings = await Rating.aggregate([
      { $match: { providerId: mongoose.Types.ObjectId(providerId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$score' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: ratings[0] || { averageRating: 0, totalRatings: 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
