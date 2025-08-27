const mongoose = require('mongoose');
const ServiceProvider = require('../models/ServiceProvider');

async function verifyAndFixData() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/home_service_db');
        console.log('Connected to MongoDB');

        // Get all providers
        const providers = await ServiceProvider.find({});
        console.log(`Found ${providers.length} total providers`);

        // Add test data if none exists
        if (providers.length === 0) {
            console.log('No providers found, adding test data...');
            
            const testProviders = [
                {
                    name: 'NYC Provider 1',
                    location: {
                        type: 'Point',
                        coordinates: [-74.006, 40.7128] // NYC coordinates
                    }
                },
                {
                    name: 'NYC Provider 2',
                    location: {
                        type: 'Point',
                        coordinates: [-74.007, 40.7138] // Nearby
                    }
                }
            ];

            await ServiceProvider.insertMany(testProviders);
            console.log('Added test providers');
        }

        // Verify existing data
        for (const provider of providers) {
            console.log('\nProvider:', provider.name);
            console.log('Location:', JSON.stringify(provider.location, null, 2));
            
            // Verify coordinates are in correct format
            if (provider.location && provider.location.coordinates) {
                const [lng, lat] = provider.location.coordinates;
                console.log(`Coordinates: ${lng}, ${lat}`);
                
                if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
                    console.log('Invalid coordinates detected, fixing...');
                    // Swap coordinates if they appear to be reversed
                    provider.location.coordinates = [lat, lng].map(c => parseFloat(c));
                    await provider.save();
                    console.log('Fixed coordinates');
                }
            }
        }

        // Test the geospatial query
        const testQuery = await ServiceProvider.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [-74.006, 40.7128]
                    },
                    $maxDistance: 5000
                }
            }
        });

        console.log('\nTest query results:');
        testQuery.forEach(provider => {
            console.log(`- ${provider.name}: ${JSON.stringify(provider.location)}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDone');
    }
}

verifyAndFixData();
