import express from 'express';
import { ServiceProvider } from '../models/ServiceProvider.js';

const router = express.Router();

router.get('/nearby', async (req, res) => {
    try {
        const { latitude, longitude, radius = 5000, serviceType } = req.query;
        
        console.log(`Received request for providers near [${latitude}, ${longitude}] within ${radius}m`);

        if (!latitude || !longitude) {
            console.log('Missing coordinates in request');
            return res.status(400).json({
                error: 'Missing Parameters',
                details: 'Latitude and longitude are required'
            });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const rad = parseInt(radius);

        // Validate coordinates
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.log('Invalid coordinates:', { lat, lng });
            return res.status(400).json({
                error: 'Invalid Parameters',
                details: 'Invalid coordinates provided'
            });
        }

        const query = {
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: rad
                }
            }
        };

        // Add service type filter if provided
        if (serviceType) {
            query.serviceOffered = serviceType;
        }

        console.log('Executing query:', JSON.stringify(query));

        const providers = await ServiceProvider.find(query).select('-password');
        console.log(`Found ${providers.length} providers`);

        const providersWithDistance = providers.map(provider => {
            const providerObj = provider.toObject();
            const distance = calculateDistance(
                lat,
                lng,
                provider.location.coordinates[1],
                provider.location.coordinates[0]
            );
            return { ...providerObj, distance };
        });

        res.json(providersWithDistance);
    } catch (error) {
        console.error('Error in /nearby endpoint:', error);
        res.status(500).json({
            error: 'Server Error',
            details: error.message
        });
    }
});

// Helper function to calculate distance in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(value) {
    return value * Math.PI / 180;
}

export const locationRoutes = router;
