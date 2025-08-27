import express from 'express';
import * as providerController from '../controllers/provider.controller.js';
import { ServiceProvider } from '../models/ServiceProvider.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { getProviderBookings, updateLocation, getProviderProfile, updateBookingStatus } from '../controllers/provider.controller.js';

const router = express.Router();

// Dashboard stats route
router.get('/:providerId/dashboard', providerController.getDashboardStats);

// Bookings routes
router.get('/:providerId/bookings', authMiddleware, getProviderBookings);
router.get('/:providerId/bookings/:status', authMiddleware, getProviderBookings);
// Provider updates booking status
router.patch('/bookings/:bookingId/status', authMiddleware, updateBookingStatus);
// Provider profile endpoint
router.get('/profile/:id', authMiddleware, getProviderProfile);

// Location routes
router.post('/:providerId/update-location', authMiddleware, updateLocation);

router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000, serviceType } = req.query;

    // Log incoming request
    console.log('Nearby providers request:', {
      latitude,
      longitude,
      serviceType,
      radius,
      rawQuery: req.query
    });

    // Validate required parameters
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
        required: { latitude, longitude },
        received: req.query
      });
    }

    // Convert coordinates and radius to numbers
    const coords = [parseFloat(longitude), parseFloat(latitude)];
    const maxDistance = parseInt(radius);

    // Validate coordinates
    if (coords.some(isNaN)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates',
        received: { latitude, longitude },
        parsed: coords
      });
    }

    const query = {
      serviceType: serviceType, // Changed from serviceOffered to serviceType
      isAvailable: true,
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: coords
          },
          $maxDistance: maxDistance
        }
      }
    };

    console.log('MongoDB query:', JSON.stringify(query, null, 2));

    const providers = await ServiceProvider.find(query)
      .select('-password')
      .limit(20);

    console.log(`Found ${providers.length} providers for service: ${serviceType}`);

    return res.json({
      success: true,
      count: providers.length,
      providers: providers
    });

  } catch (error) {
    console.error('Nearby providers error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby providers',
      error: error.message
    });
  }
});

// Add debug endpoint
router.get('/debug', async (req, res) => {
  try {
    const { lat, lng, service } = req.query;
    
    // Get raw collection stats
    const stats = await ServiceProvider.db.collection('providers').stats();
    
    // Get all providers of requested service
    const providers = await ServiceProvider.find({ 
      serviceOffered: service 
    }).lean();

    res.json({
      success: true,
      debug: {
        params: { lat, lng, service },
        parsed: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng)
        },
        collectionStats: {
          count: stats.count,
          size: stats.size,
          indexes: stats.nindexes
        },
        providers: providers.map(p => ({
          id: p._id,
          name: p.businessName,
          coordinates: p.location?.coordinates
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

// Update provider location
router.patch('/:providerId/location', authMiddleware, async (req, res) => {
  try {
    const { providerId } = req.params;
    const { location, isAvailable } = req.body;

    if (!location || !location.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location data'
      });
    }

    const updatedProvider = await Provider.findByIdAndUpdate(
      providerId,
      {
        $set: {
          location: {
            type: 'Point',
            coordinates: location.coordinates
          },
          isAvailable: isAvailable ?? true,
          lastUpdated: new Date()
        }
      },
      { new: true }
    );

    if (!updatedProvider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    res.json({
      success: true,
      provider: updatedProvider
    });
  } catch (error) {
    console.error('Error updating provider location:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating provider location',
      error: error.message
    });
  }
});

// CRITICAL FIX: Update location endpoint
router.post('/:providerId/location', authMiddleware, async (req, res) => {
    try {
        const { providerId } = req.params;
        const { location, isAvailable } = req.body;

        console.log('Location update request:', {
            providerId,
            body: req.body,
            path: req.path,
            url: req.url
        });

        if (!location?.coordinates || !Array.isArray(location.coordinates)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid location format'
            });
        }

        const provider = await ServiceProvider.findByIdAndUpdate(
            providerId,
            { 
                location: {
                    type: 'Point',
                    coordinates: location.coordinates
                },
                isAvailable,
                lastLocationUpdate: new Date()
            },
            { new: true }
        );

        if (!provider) {
            return res.status(404).json({ 
                success: false,
                error: 'Provider not found' 
            });
        }

        res.json({ success: true, provider });
    } catch (error) {
        console.error('Location update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all providers
router.get('/all', async (req, res) => {
  try {
    const providers = await Provider.find().select('-password');
    res.json({
      success: true,
      providers: providers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching providers',
      error: error.message
    });
  }
});

// Make sure to add this default export
export default router;
