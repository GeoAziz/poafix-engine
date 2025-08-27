// ...existing code...

router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius, serviceType, clientId } = req.query;
    
    console.log('Received nearby providers request:', {
      latitude,
      longitude,
      radius,
      serviceType,
      clientId
    });

    if (!latitude || !longitude || !radius || !serviceType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Validate numeric values
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const maxDistance = parseFloat(radius);

    if (isNaN(lat) || isNaN(lng) || isNaN(maxDistance)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid numeric parameters'
      });
    }

    const query = {
      serviceTypes: serviceType,
      isActive: true, // Only get active providers
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      }
    };

    console.log('Executing MongoDB query:', JSON.stringify(query));

    const providers = await Provider.find(query)
      .select('-password')
      .lean();

    console.log(`Found ${providers.length} providers`);

    return res.json({
      success: true,
      providers: providers,
      meta: {
        count: providers.length,
        radius: maxDistance,
        serviceType
      }
    });

  } catch (error) {
    console.error('Error fetching nearby providers:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching providers',
      error: error.message
    });
  }
});

// ...existing code...
