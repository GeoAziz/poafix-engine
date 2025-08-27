
import express from 'express';
const router = express.Router();

// Get provider by ID (for serviceOffered and profile fetch)
router.get('/:id', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    // Ensure serviceOffered is always an array of objects
    let serviceOffered = provider.serviceOffered || [];
    serviceOffered = serviceOffered.map(s => {
      if (typeof s === 'string') {
        return { name: s, description: '', price: '', duration: '' };
      }
      // If already an object, ensure all keys exist
      return {
        name: s.name || '',
        description: s.description || '',
        price: s.price || '',
        duration: s.duration || ''
      };
    });
    const providerObj = provider.toObject();
    providerObj.serviceOffered = serviceOffered;
    res.json({ data: providerObj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

import { updateProviderServices } from '../controllers/provider.controller.js';
import { Provider } from '../models/provider.model.js'; // Changed to named import
import { Service } from '../models/index.js'; // Fixed import to use index
import Rating from '../models/rating.model.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { updateLocation } from '../controllers/provider.controller.js';

// Update provider's serviceOffered array
router.put('/:id/services', updateProviderServices);


// Route to update provider location
router.put('/:id/location', updateLocation);

// Enhanced provider search with filters
router.post('/search/advanced', async (req, res) => {
  try {
    // Debug logs for frontend-backend integration
    console.log('[Backend] /search/advanced called');
    console.log('[Backend] Request headers:', req.headers);
    console.log('[Backend] Request body:', req.body);
    const {
      serviceType,
      location,
      radius = 10,
      minRating = 0,
      maxPrice,
      availability,
      sortBy = 'distance',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = req.body;

    const skip = (page - 1) * limit;
    let matchConditions = { status: 'verified', isAvailable: true };

    // Service type filter
    if (serviceType) {
      matchConditions.serviceType = serviceType;
    }

    // --- FIX: Normalize location keys ---
    let normalizedLocation = null;
    if (location) {
      // Accept both {latitude, longitude} and {lat, lng}
      const latitude = location.latitude ?? location.lat;
      const longitude = location.longitude ?? location.lng;
      if (
        typeof latitude === 'number' && typeof longitude === 'number' &&
        !isNaN(latitude) && !isNaN(longitude)
      ) {
        normalizedLocation = { latitude, longitude };
      }
    }

    // Always use $geoNear as the first stage if location is provided
    let pipeline = [];
    if (normalizedLocation) {
      pipeline.push({
        $geoNear: {
          near: { type: "Point", coordinates: [normalizedLocation.longitude, normalizedLocation.latitude] },
          distanceField: "distance",
          maxDistance: radius * 1000,
          spherical: true,
          query: matchConditions
        }
      });
    } else {
      // fallback: no geo search, just match
      pipeline.push({ $match: matchConditions });
    }

    // Continue pipeline
    pipeline = pipeline.concat([
      // Join with ratings
      {
        $lookup: {
          from: 'ratings',
          localField: '_id',
          foreignField: 'providerId',
          as: 'ratings'
        }
      },
      // Calculate average rating and total reviews
      {
        $addFields: {
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: '$ratings' }, 0] },
              then: { $avg: '$ratings.rating' },
              else: 0
            }
          },
          totalReviews: { $size: '$ratings' },
          // distance is already set by $geoNear if location is provided
        }
      },
      // Apply rating filter
      {
        $match: {
          averageRating: { $gte: minRating }
        }
      }
    ]);

    // Join with services to get pricing if maxPrice filter is applied
    if (maxPrice) {
      pipeline.push(
        {
          $lookup: {
            from: 'services',
            localField: '_id',
            foreignField: 'providerId',
            as: 'services'
          }
        },
        {
          $addFields: {
            minPrice: {
              $min: '$services.price'
            }
          }
        },
        {
          $match: {
            minPrice: { $lte: maxPrice }
          }
        }
      );
    }

    // Availability filter
    if (availability === 'now') {
      const currentTime = new Date();
      const currentDay = currentTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentHour = currentTime.getHours();

      pipeline.push({
        $match: {
          $and: [
            { isAvailable: true },
            { [`availability.${currentDay}.isOpen`]: true },
            { [`availability.${currentDay}.openTime`]: { $lte: currentHour } },
            { [`availability.${currentDay}.closeTime`]: { $gte: currentHour } }
          ]
        }
      });
    }

    // Sorting
    let sortStage = {};
    switch (sortBy) {
      case 'rating':
        sortStage = { averageRating: sortOrder === 'desc' ? -1 : 1 };
        break;
      case 'price':
        sortStage = { minPrice: sortOrder === 'desc' ? -1 : 1 };
        break;
      case 'reviews':
        sortStage = { totalReviews: sortOrder === 'desc' ? -1 : 1 };
        break;
      case 'distance':
      default:
        if (location) {
          sortStage = { distance: 1 };
        } else {
          sortStage = { createdAt: -1 };
        }
        break;
    }

    pipeline.push(
      { $sort: sortStage },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $project: {
          ratings: 0, // Remove ratings array from output
          services: 0 // Remove services array from output
        }
      }
    );

    const providers = await Provider.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = pipeline.slice(0, -3); // Remove sort, skip, limit, project
    countPipeline.push({ $count: 'total' });
    const countResult = await Provider.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    const responseData = {
      success: true,
      data: {
        providers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalProviders: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        filters: {
          serviceType,
          location,
          radius,
          minRating,
          maxPrice,
          availability,
          sortBy,
          sortOrder
        }
      }
    };
    console.log('[Backend] Response:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Compare providers by price for a service
router.post('/compare-prices', async (req, res) => {
  try {
    const { serviceType, location, radius = 10 } = req.body;

    if (!serviceType) {
      return res.status(400).json({
        success: false,
        error: 'Service type is required'
      });
    }

    let matchConditions = {
      isActive: true,
      isVerified: true,
      serviceOffered: { $in: [serviceType] }
    };

    // Location filter if provided
    if (location && location.lat && location.lng) {
      matchConditions.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          $maxDistance: radius * 1000
        }
      };
    }

    const providers = await Provider.aggregate([
      { $match: matchConditions },
      // Join with services
      {
        $lookup: {
          from: 'services',
          let: { providerId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$providerId', '$$providerId'] },
                    { $eq: ['$serviceType', serviceType] }
                  ]
                }
              }
            }
          ],
          as: 'serviceDetails'
        }
      },
      // Join with ratings
      {
        $lookup: {
          from: 'ratings',
          localField: '_id',
          foreignField: 'providerId',
          as: 'ratings'
        }
      },
      // Calculate metrics
      {
        $addFields: {
          price: {
            $cond: {
              if: { $gt: [{ $size: '$serviceDetails' }, 0] },
              then: { $arrayElemAt: ['$serviceDetails.price', 0] },
              else: null
            }
          },
          priceType: {
            $cond: {
              if: { $gt: [{ $size: '$serviceDetails' }, 0] },
              then: { $arrayElemAt: ['$serviceDetails.priceType', 0] },
              else: 'fixed'
            }
          },
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: '$ratings' }, 0] },
              then: { $avg: '$ratings.rating' },
              else: 0
            }
          },
          totalReviews: { $size: '$ratings' },
          distance: location ? {
            $round: [{
              $divide: [
                {
                  $sqrt: {
                    $add: [
                      {
                        $pow: [
                          { $multiply: [
                            { $subtract: [{ $arrayElemAt: ['$location.coordinates', 1] }, location.lat] },
                            111.32
                          ]}, 2
                        ]
                      },
                      {
                        $pow: [
                          { $multiply: [
                            { $subtract: [{ $arrayElemAt: ['$location.coordinates', 0] }, location.lng] },
                            { $multiply: [111.32, { $cos: { $multiply: [location.lat, Math.PI / 180] } }] }
                          ]}, 2
                        ]
                      }
                    ]
                  }
                },
                1
              ]
            }, 2]
          } : 0
        }
      },
      // Only include providers with pricing
      {
        $match: {
          price: { $ne: null }
        }
      },
      // Sort by price
      { $sort: { price: 1 } },
      {
        $project: {
          businessName: 1,
          profileImage: 1,
          price: 1,
          priceType: 1,
          averageRating: 1,
          totalReviews: 1,
          distance: 1,
          phoneNumber: 1,
          availability: 1,
          ratings: 0,
          serviceDetails: 0
        }
      }
    ]);

    // Calculate price statistics
    const prices = providers.map(p => p.price).filter(p => p);
    const priceStats = {
      lowest: prices.length > 0 ? Math.min(...prices) : 0,
      highest: prices.length > 0 ? Math.max(...prices) : 0,
      average: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      median: prices.length > 0 ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] : 0
    };

    res.json({
      success: true,
      data: {
        providers,
        priceStats,
        serviceType,
        searchRadius: radius,
        totalProviders: providers.length
      }
    });
  } catch (error) {
    console.error('Price comparison error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get top-rated providers
router.get('/top-rated', async (req, res) => {
  try {
    const {
      serviceType,
      location,
      radius = 50,
      limit = 10
    } = req.query;

    let matchConditions = { isActive: true, isVerified: true };

    if (serviceType) {
      matchConditions.serviceOffered = { $in: [serviceType] };
    }

    // Location filter
    if (location) {
      const [lat, lng] = location.split(',').map(Number);
      if (lat && lng) {
        matchConditions.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radius * 1000
          }
        };
      }
    }

    const providers = await Provider.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: 'ratings',
          localField: '_id',
          foreignField: 'providerId',
          as: 'ratings'
        }
      },
      {
        $addFields: {
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: '$ratings' }, 0] },
              then: { $avg: '$ratings.rating' },
              else: 0
            }
          },
          totalReviews: { $size: '$ratings' }
        }
      },
      // Only include providers with ratings
      {
        $match: {
          totalReviews: { $gte: 5 }, // At least 5 reviews
          averageRating: { $gte: 4.0 } // At least 4.0 rating
        }
      },
      {
        $sort: {
          averageRating: -1,
          totalReviews: -1
        }
      },
      { $limit: parseInt(limit) },
      {
        $project: {
          businessName: 1,
          serviceOffered: 1,
          profileImage: 1,
          averageRating: 1,
          totalReviews: 1,
          location: 1,
          phoneNumber: 1,
          isAvailable: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get providers available now
router.get('/available-now', async (req, res) => {
  try {
    const {
      serviceType,
      location,
      radius = 20
    } = req.query;

    const currentTime = new Date();
    const currentDay = currentTime.getDay();
    const currentHour = currentTime.getHours();

    let matchConditions = {
      isActive: true,
      isVerified: true,
      isAvailable: true,
      [`availability.${currentDay}.isOpen`]: true,
      [`availability.${currentDay}.openTime`]: { $lte: currentHour },
      [`availability.${currentDay}.closeTime`]: { $gte: currentHour }
    };

    if (serviceType) {
      matchConditions.serviceOffered = { $in: [serviceType] };
    }

    // Location filter
    if (location) {
      const [lat, lng] = location.split(',').map(Number);
      if (lat && lng) {
        matchConditions.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radius * 1000
          }
        };
      }
    }

    const providers = await Provider.find(matchConditions)
      .select('businessName serviceOffered profileImage phoneNumber location averageRating totalReviews')
      .limit(20);

    res.json({
      success: true,
      data: providers,
      currentTime: {
        day: currentDay,
        hour: currentHour
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
