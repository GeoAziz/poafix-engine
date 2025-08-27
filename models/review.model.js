import mongoose from 'mongoose';
import { Booking } from './booking.model.js';

const reviewSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    required: true,
    maxLength: 1000
  },
  serviceType: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  
  // Category ratings
  categoryRatings: {
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    timeliness: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5
    }
  },

  // Quick feedback options
  quickFeedback: {
    onTime: {
      type: Boolean,
      default: false
    },
    professional: {
      type: Boolean,
      default: false
    },
    goodValue: {
      type: Boolean,
      default: false
    },
    wouldRecommend: {
      type: Boolean,
      default: false
    },
    cleanWorkArea: {
      type: Boolean,
      default: false
    }
  },

  // Images
  images: [{
    url: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Status and verification
  isVerified: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isHelpful: {
    likes: {
      type: Number,
      default: 0
    },
    dislikes: {
      type: Number,
      default: 0
    },
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },

  // Provider response
  providerResponse: {
    type: String,
    maxLength: 500
  },
  responseDate: {
    type: Date
  },

  // Reporting and moderation
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other']
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },

  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewed: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
reviewSchema.index({ providerId: 1, rating: -1 });
reviewSchema.index({ clientId: 1, date: -1 });
reviewSchema.index({ serviceType: 1, rating: -1 });
reviewSchema.index({ date: -1 });
reviewSchema.index({ isVerified: 1, isPublic: 1 });
reviewSchema.index({ 'isHelpful.likes': -1 });

// Virtual for overall helpfulness score
reviewSchema.virtual('helpfulnessScore').get(function() {
  const total = this.isHelpful.likes + this.isHelpful.dislikes;
  if (total === 0) return 0;
  return (this.isHelpful.likes / total) * 100;
});

// Virtual for average category rating
reviewSchema.virtual('averageCategoryRating').get(function() {
  const ratings = this.categoryRatings;
  if (!ratings) return this.rating;
  
  const values = Object.values(ratings).filter(rating => rating > 0);
  if (values.length === 0) return this.rating;
  
  return values.reduce((sum, rating) => sum + rating, 0) / values.length;
});

// Pre-save middleware to update verification status
reviewSchema.pre('save', function(next) {
  // Auto-verify reviews from verified bookings
  if (this.isNew && this.bookingId) {
    Booking.findById(this.bookingId)
      .then(booking => {
        if (booking && booking.status === 'completed') {
          this.isVerified = true;
        }
        next();
      })
      .catch(next);
  } else {
    next();
  }
});

// Static methods
reviewSchema.statics.getAverageRating = function(providerId) {
  return this.aggregate([
    { $match: { providerId: providerId, isPublic: true } },
    {
      $group: {
        _id: '$providerId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
};

reviewSchema.statics.getCategoryBreakdown = function(providerId) {
  return this.aggregate([
    { $match: { providerId: providerId, isPublic: true } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);
};

// Instance methods
reviewSchema.methods.toggleHelpful = function(userId) {
  const index = this.isHelpful.likedBy.indexOf(userId);
  if (index > -1) {
    this.isHelpful.likedBy.splice(index, 1);
    this.isHelpful.likes = Math.max(0, this.isHelpful.likes - 1);
  } else {
    this.isHelpful.likedBy.push(userId);
    this.isHelpful.likes += 1;
  }
  return this.save();
};

reviewSchema.methods.incrementView = function() {
  this.viewCount += 1;
  this.lastViewed = new Date();
  return this.save();
};

// Prevent duplicate model compilation
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;
