import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { ServiceProvider } from '../models/index.js';
import { getUpcomingAppointments, getRecentActivities } from '../controllers/provider.controller.js';

const router = express.Router();
// Get upcoming appointments for provider
router.get('/:providerId/upcoming-appointments', getUpcomingAppointments);

// Get recent activities for provider
router.get('/:providerId/recent-activities', getRecentActivities);

// Get nearby providers for a specific service
router.get('/nearby', authenticateToken, async (req, res) => {
  try {
    const { service, lat, lng, radius = 10, limit = 20 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusInKm = parseFloat(radius);

    // Find nearby providers for the specific service
    const nearbyProviders = await ServiceProvider.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          distanceField: "distance",
          maxDistance: radiusInKm * 1000, // Convert km to meters
          spherical: true
        }
      },
      {
        $match: {
          serviceType: service,
          status: 'verified',
          isAvailable: true
        }
      },
      {
        $addFields: {
          distanceInKm: { $divide: ['$distance', 1000] }
        }
      },
      {
        $sort: { distance: 1, rating: -1 } // Sort by distance first, then by rating
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 1,
          businessName: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          phone: 1,
          serviceType: 1,
          rating: 1,
          reviewCount: 1,
          hourlyRate: 1,
          experience: 1,
          isAvailable24x7: 1,
          profileImage: 1,
          businessDescription: 1,
          certifications: 1,
          services: 1,
          distance: { $round: ['$distanceInKm', 2] },
          averageResponseTime: 1,
          completedJobs: 1,
          location: 1,
          availability: 1
        }
      }
    ]);

    // Get availability stats
    const availabilityStats = await ServiceProvider.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          distanceField: "distance",
          maxDistance: radiusInKm * 1000,
          spherical: true
        }
      },
      {
        $match: {
          serviceType: service,
          status: 'verified'
        }
      },
      {
        $group: {
          _id: null,
          totalProviders: { $sum: 1 },
          availableNow: {
            $sum: {
              $cond: [{ $eq: ['$isAvailable', true] }, 1, 0]
            }
          },
          averageRating: { $avg: '$rating' },
          averageResponse: { $avg: '$averageResponseTime' },
          available24x7: {
            $sum: {
              $cond: [{ $eq: ['$isAvailable24x7', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    const stats = availabilityStats[0] || {
      totalProviders: 0,
      availableNow: 0,
      averageRating: 4.5,
      averageResponse: 30,
      available24x7: 0
    };

    res.json({
      success: true,
      providers: nearbyProviders,
      total: stats.totalProviders,
      availableNow: stats.availableNow,
      averageRating: Math.round(stats.averageRating * 10) / 10,
      averageResponse: Math.round(stats.averageResponse),
      available24x7: stats.available24x7,
      searchParams: {
        service,
        location: { latitude, longitude },
        radius: radiusInKm,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting nearby providers:', error);
    res.status(500).json({ error: 'Failed to get nearby providers' });
  }
});

// Get provider availability for a service
router.get('/availability', authenticateToken, async (req, res) => {
  try {
    const { service, lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Get real-time availability data
    const availabilityData = await ServiceProvider.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          distanceField: "distance",
          maxDistance: 15000, // 15km
          spherical: true
        }
      },
      {
        $match: {
          serviceType: service,
          status: 'verified'
        }
      },
      {
        $group: {
          _id: null,
          availableNow: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isAvailable', true] },
                    { $eq: ['$status', 'verified'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          availableToday: {
            $sum: {
              $cond: [
                { $ne: ['$status', 'suspended'] },
                1,
                0
              ]
            }
          },
          averageWaitTime: { $avg: '$averageResponseTime' },
          totalProviders: { $sum: 1 }
        }
      }
    ]);

    const data = availabilityData[0] || {
      availableNow: 0,
      availableToday: 0,
      averageWaitTime: 30,
      totalProviders: 0
    };

    // Mock busy hours data (you can enhance this with real scheduling data)
    const busyHours = ['9-11', '14-16', '18-20'];

    res.json({
      success: true,
      availableNow: data.availableNow,
      availableToday: data.availableToday,
      averageWaitTime: Math.round(data.averageWaitTime || 30),
      busyHours,
      totalProviders: data.totalProviders,
      service,
      location: { latitude, longitude }
    });

  } catch (error) {
    console.error('Error getting provider availability:', error);
    res.status(500).json({ error: 'Failed to get provider availability' });
  }
});

// Update user location for better matching
router.put('/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Update user's location in the database
    // This assumes you have a User model with location field
    // You may need to adjust based on your user model structure
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      location: { latitude, longitude },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating user location:', error);
    res.status(500).json({ error: 'Failed to update user location' });
  }
});

export default router;
