import express from 'express';
import { providerController } from '../controllers/providerController.js';
import { authMiddleware } from '../middleware/auth.js';
import { Provider } from '../models/provider.js';
import { ServiceProvider } from '../models/ServiceProvider.js';
import { validateProvider } from '../middleware/validateProvider.js';

const router = express.Router();

// Define route handlers with proper functions
router.post('/signup', validateProvider, providerController.signup);
router.post('/login', providerController.login);
router.get('/nearby', async (req, res) => {
  try {
    // Handle both parameter formats
    const lat = req.query.lat || req.query.latitude;
    const lng = req.query.lng || req.query.longitude;
    const serviceType = req.query.service || req.query.serviceType;
    const radius = parseInt(req.query.radius) || 5000; // Default 5km

    console.log('📍 Location search:', { lat, lng, serviceType, radius });

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    // Build aggregation pipeline
    const pipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: 'distance',
          maxDistance: radius,
          spherical: true,
          query: {
            isAvailable: true,
            isVerified: true
          }
        }
      }
    ];

    // Add service type filter if provided
    if (serviceType) {
      pipeline.push({
        $match: {
          serviceOffered: { $regex: new RegExp(serviceType, 'i') }
        }
      });
    }

    // Add rating and review aggregation
    pipeline.push(
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
          averageRating: { $avg: '$ratings.score' },
          totalRatings: { $size: '$ratings' }
        }
      },
      {
        $project: {
          businessName: 1,
          serviceOffered: 1,
          location: 1,
          distance: 1,
          isAvailable: 1,
          isVerified: 1,
          phoneNumber: 1,
          email: 1,
          averageRating: { $round: ['$averageRating', 1] },
          totalRatings: 1,
          basePrice: '$pricing.basePrice'
        }
      },
      {
        $sort: { distance: 1 }
      }
    );

    const providers = await ServiceProvider.aggregate(pipeline);

    console.log(`Found ${providers.length} providers within ${radius}m`);

    res.json({
      success: true,
      data: providers,
      count: providers.length
    });

  } catch (error) {
    console.error('Provider search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enhanced search with filters
router.get('/search', async (req, res) => {
  try {
    const {
      lat,
      lng,
      service,
      q: searchQuery,
      radius = 5000,
      minRating = 0,
      minPrice = 0,
      maxPrice = 10000,
      availableNow,
      verified,
      sortBy = 'distance'
    } = req.query;

    console.log('🔍 Advanced search:', req.query);

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Location coordinates required'
      });
    }

    // Build match conditions
    const matchConditions = {
      isAvailable: availableNow === 'true' ? true : { $in: [true, false] }
    };

    if (verified === 'true') {
      matchConditions.isVerified = true;
    }

    if (service) {
      matchConditions.serviceOffered = { $regex: new RegExp(service, 'i') };
    }

    if (searchQuery) {
      matchConditions.$or = [
        { businessName: { $regex: new RegExp(searchQuery, 'i') } },
        { serviceOffered: { $regex: new RegExp(searchQuery, 'i') } },
        { description: { $regex: new RegExp(searchQuery, 'i') } }
      ];
    }

    // Build aggregation pipeline
    const pipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: 'distance',
          maxDistance: parseInt(radius),
          spherical: true,
          query: matchConditions
        }
      },
      {
        $lookup: {
          from: 'ratings',
          localField: '_id',
          foreignField: 'providerId',
          as: 'ratings'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'providerId',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          averageRating: { $avg: '$ratings.score' },
          totalRatings: { $size: '$ratings' },
          totalReviews: { $size: '$reviews' },
          basePrice: '$pricing.basePrice'
        }
      },
      {
        $match: {
          averageRating: { $gte: parseFloat(minRating) },
          basePrice: { 
            $gte: parseFloat(minPrice),
            $lte: parseFloat(maxPrice)
          }
        }
      },
      {
        $project: {
          businessName: 1,
          serviceOffered: 1,
          location: 1,
          distance: 1,
          isAvailable: 1,
          isVerified: 1,
          phoneNumber: 1,
          email: 1,
          averageRating: { $round: ['$averageRating', 1] },
          totalRatings: 1,
          totalReviews: 1,
          basePrice: 1,
          description: 1,
          profileImage: 1
        }
      }
    ];

    // Add sorting
    const sortOptions = {
      distance: { distance: 1 },
      rating: { averageRating: -1, totalRatings: -1 },
      price_low: { basePrice: 1 },
      price_high: { basePrice: -1 },
      availability: { isAvailable: -1, distance: 1 }
    };

    pipeline.push({
      $sort: sortOptions[sortBy] || { distance: 1 }
    });

    const providers = await ServiceProvider.aggregate(pipeline);

    console.log(`🔍 Found ${providers.length} providers matching search criteria`);

    res.json({
      success: true,
      data: providers,
      count: providers.length,
      searchCriteria: {
        location: { lat, lng },
        service,
        searchQuery,
        radius,
        filters: {
          minRating,
          priceRange: [minPrice, maxPrice],
          availableNow,
          verified
        },
        sortBy
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// The following block is a duplicate and should be removed to fix the syntax error.
router.patch('/location', authMiddleware, providerController.updateLocation);
router.patch('/status', authMiddleware, providerController.updateStatus);

// Add status check route
router.get('/status/:providerId', async (req, res) => {
    try {
        const provider = await Provider.findById(req.params.providerId)
            .select('-password');
        
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found'
            });
        }

        res.json({
            success: true,
            data: {
                id: provider._id,
                isAvailable: provider.isAvailable,
                location: provider.location,
                lastLocationUpdate: provider.lastLocationUpdate
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch provider status',
            error: error.message
        });
    }
});

// All providers - add a proper handler
router.get('/all', async (req, res) => {
    try {
        const providers = await Provider.find()
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: providers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch providers',
            error: error.message
        });
    }
});

// Location update endpoint - note no /api prefix needed here
router.post('/:providerId/location', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { location, isAvailable } = req.body;
    
    console.log('Update location request received:');
    console.log('Provider ID:', providerId);
    console.log('Location:', location);
    console.log('Is Available:', isAvailable);

    if (!location?.coordinates || !Array.isArray(location.coordinates)) {
      return res.status(400).json({ error: 'Invalid location format' });
    }

    const provider = await Provider.findByIdAndUpdate(
      providerId,
      { 
        location,
        isAvailable,
        lastLocationUpdate: new Date()
      },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    console.log('Location updated successfully');
    res.json({ success: true, provider });
  } catch (error) {
    console.error('Error updating provider location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Enhanced search with filters
router.get('/search', async (req, res) => {
  try {
    const {
      lat,
      lng,
      service,
      q: searchQuery,
      radius = 5000,
      minRating = 0,
      minPrice = 0,
      maxPrice = 10000,
      availableNow,
      verified,
      sortBy = 'distance'
    } = req.query;

    console.log('🔍 Advanced search:', req.query);

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Location coordinates required'
      });
    }

    // Build match conditions
    const matchConditions = {
      isAvailable: availableNow === 'true' ? true : { $in: [true, false] }
    };

    if (verified === 'true') {
      matchConditions.isVerified = true;
    }

    if (service) {
      matchConditions.serviceOffered = { $regex: new RegExp(service, 'i') };
    }

    if (searchQuery) {
      matchConditions.$or = [
        { businessName: { $regex: new RegExp(searchQuery, 'i') } },
        { serviceOffered: { $regex: new RegExp(searchQuery, 'i') } },
        { description: { $regex: new RegExp(searchQuery, 'i') } }
      ];
    }

    // Build aggregation pipeline
    const pipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: 'distance',
          maxDistance: parseInt(radius),
          spherical: true,
          query: matchConditions
        }
      },
      {
        $lookup: {
          from: 'ratings',
          localField: '_id',
          foreignField: 'providerId',
          as: 'ratings'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'providerId',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          averageRating: { $avg: '$ratings.score' },
          totalRatings: { $size: '$ratings' },
          totalReviews: { $size: '$reviews' },
          basePrice: '$pricing.basePrice'
        }
      },
      {
        $match: {
          averageRating: { $gte: parseFloat(minRating) },
          basePrice: { 
            $gte: parseFloat(minPrice),
            $lte: parseFloat(maxPrice)
          }
        }
      },
      {
        $project: {
          businessName: 1,
          serviceOffered: 1,
          location: 1,
          distance: 1,
          isAvailable: 1,
          isVerified: 1,
          phoneNumber: 1,
          email: 1,
          averageRating: { $round: ['$averageRating', 1] },
          totalRatings: 1,
          totalReviews: 1,
          basePrice: 1,
          description: 1,
          profileImage: 1
        }
      }
    ];

    // Add sorting
    const sortOptions = {
      distance: { distance: 1 },
      rating: { averageRating: -1, totalRatings: -1 },
      price_low: { basePrice: 1 },
      price_high: { basePrice: -1 },
      availability: { isAvailable: -1, distance: 1 }
    };

    pipeline.push({
      $sort: sortOptions[sortBy] || { distance: 1 }
    });

    const providers = await ServiceProvider.aggregate(pipeline);

    console.log(`🔍 Found ${providers.length} providers matching search criteria`);

    res.json({
      success: true,
      data: providers,
      count: providers.length,
      searchCriteria: {
        location: { lat, lng },
        service,
        searchQuery,
        radius,
        filters: {
          minRating,
          priceRange: [minPrice, maxPrice],
          availableNow,
          verified
        },
        sortBy
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;