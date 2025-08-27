import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Service, ServiceProvider } from '../models/index.js';

const router = express.Router();

// Get services with proximity data
router.get('/proximity', authenticateToken, async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusInKm = parseFloat(radius);

    // Aggregate providers by service type within radius
    const servicesWithProximity = await ServiceProvider.aggregate([
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
          status: 'verified',
          isAvailable: true
        }
      },
      {
        $group: {
          _id: '$serviceType',
          nearbyProviders: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          averageResponse: { $avg: '$averageResponseTime' },
          minPrice: { $min: '$hourlyRate' },
          maxPrice: { $max: '$hourlyRate' },
          providers: {
            $push: {
              id: '$_id',
              businessName: '$businessName',
              rating: '$rating',
              distance: '$distance',
              hourlyRate: '$hourlyRate',
              isAvailable24x7: '$isAvailable24x7'
            }
          }
        }
      },
      {
        $project: {
          serviceType: '$_id',
          nearbyProviders: 1,
          averageRating: { $round: ['$averageRating', 1] },
          averageResponse: { $round: ['$averageResponse', 0] },
          basePrice: '$minPrice',
          maxPrice: '$maxPrice',
          providers: { $slice: ['$providers', 10] },
          isAvailable24x7: {
            $anyElementTrue: {
              $map: {
                input: '$providers',
                as: 'provider',
                in: '$$provider.isAvailable24x7'
              }
            }
          }
        }
      }
    ]);

    // Define service categories with metadata
    const serviceCategories = {
      'plumbing': {
        id: 'plumbing',
        name: 'Plumbing',
        icon: 'plumbing',
        color: 'blue',
        description: 'Water pipes, repairs, installations',
        estimatedTime: '2-4 hours',
        popularService: 'Pipe Installation',
        services: [
          'Pipe Installation',
          'Leak Repairs', 
          'Drain Cleaning',
          'Water Heater Service',
          'Toilet Installation'
        ]
      },
      'electrical': {
        id: 'electrical',
        name: 'Electrical',
        icon: 'electrical_services',
        color: 'orange',
        description: 'Wiring, repairs, installations',
        estimatedTime: '1-3 hours',
        popularService: 'Wiring Installation',
        services: [
          'Wiring Installation',
          'Socket Repairs',
          'Light Fixtures',
          'Circuit Breaker',
          'Electrical Inspection'
        ]
      },
      'cleaning': {
        id: 'cleaning',
        name: 'House Cleaning',
        icon: 'cleaning_services',
        color: 'green',
        description: 'Professional home & office cleaning',
        estimatedTime: '2-6 hours',
        popularService: 'Deep Cleaning',
        services: [
          'Deep Cleaning',
          'Regular Cleaning',
          'Move-in/out Cleaning',
          'Office Cleaning',
          'Window Cleaning'
        ]
      },
      'painting': {
        id: 'painting',
        name: 'Painting',
        icon: 'format_paint',
        color: 'purple',
        description: 'Interior & exterior painting services',
        estimatedTime: '4-8 hours',
        popularService: 'Interior Painting',
        services: [
          'Interior Painting',
          'Exterior Painting',
          'Wall Preparation',
          'Color Consultation',
          'Touch-up Services'
        ]
      },
      'pest_control': {
        id: 'pest_control',
        name: 'Pest Control',
        icon: 'pest_control',
        color: 'red',
        description: 'Complete pest elimination services',
        estimatedTime: '1-2 hours',
        popularService: 'General Pest Control',
        services: [
          'General Pest Control',
          'Termite Treatment',
          'Rodent Control',
          'Fumigation',
          'Prevention Treatment'
        ]
      },
      'mechanic': {
        id: 'mechanic',
        name: 'Auto Mechanic',
        icon: 'car_repair',
        color: 'teal',
        description: 'Vehicle repair and maintenance',
        estimatedTime: '2-5 hours',
        popularService: 'Engine Repair',
        services: [
          'Engine Repair',
          'Brake Service',
          'Oil Change',
          'Tire Replacement',
          'Battery Replacement'
        ]
      }
    };

    // Merge proximity data with service metadata
    const services = Object.keys(serviceCategories).map(serviceType => {
      const proximityData = servicesWithProximity.find(s => s.serviceType === serviceType);
      const categoryData = serviceCategories[serviceType];
      
      return {
        ...categoryData,
        providers: proximityData ? proximityData.nearbyProviders : 0,
        nearbyProviders: proximityData ? proximityData.nearbyProviders : 0,
        rating: proximityData ? proximityData.averageRating : 4.5,
        basePrice: proximityData ? proximityData.basePrice : 
                   serviceType === 'cleaning' ? 800 : 
                   serviceType === 'painting' ? 1200 : 
                   serviceType === 'pest_control' ? 1000 :
                   serviceType === 'mechanic' ? 1800 :
                   serviceType === 'electrical' ? 2000 : 1500,
        averageResponse: proximityData ? proximityData.averageResponse : 30,
        isAvailable24x7: proximityData ? proximityData.isAvailable24x7 : false
      };
    });

    res.json({
      success: true,
      services: services.sort((a, b) => b.nearbyProviders - a.nearbyProviders),
      location: {
        latitude,
        longitude,
        radius: radiusInKm
      },
      totalProvidersInArea: servicesWithProximity.reduce((sum, s) => sum + s.nearbyProviders, 0)
    });

  } catch (error) {
    console.error('Error getting services with proximity:', error);
    res.status(500).json({ error: 'Failed to get services with proximity data' });
  }
});

// Use authenticateToken instead of authMiddleware
router.use(authenticateToken);

// Get provider's services
router.get('/provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    console.log('Fetching services for provider:', providerId);
    
    const services = await Service.find({ providerId });
    console.log('Found services:', services.length);
    
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create service
router.post('/', async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
