const mongoose = require('mongoose');
const ServiceProvider = require('../models/ServiceProvider');

const testProviders = [
    {
        name: "Nairobi Plumber",
        businessName: "Nairobi Plumbing Services",
        email: "plumber@test.com",
        phoneNumber: "254700000001",
        serviceOffered: "Plumbing",
        location: {
            type: "Point",
            coordinates: [36.8337, -1.3095] // Very close to test coordinates
        }
    },
    {
        name: "Local Electrician",
        businessName: "Quick Electric Kenya",
        email: "electric@test.com",
        phoneNumber: "254700000002",
        serviceOffered: "Electrical",
        location: {
            type: "Point",
            coordinates: [36.8338, -1.3096] // About 100m away
        }
    },
    {
        name: "Nearby Cleaner",
        businessName: "CleanPro Services",
        email: "cleaner@test.com",
        phoneNumber: "254700000003",
        serviceOffered: "Cleaning",
        location: {
            type: "Point",
            coordinates: [36.8336, -1.3094] // About 150m away
        }
    }
];

async function addNearbyProviders() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/home_service_db');
        console.log('Connected to MongoDB');

        // Add the test providers
        await ServiceProvider.insertMany(testProviders);
        console.log('Added test providers');

        // Verify the providers were added
        const providers = await ServiceProvider.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [36.8337083, -1.3095883]
                    },
                    $maxDistance: 1000 // 1km radius
                }
            }
        });

        console.log(`Found ${providers.length} providers within 1km`);
        providers.forEach(p => {
            console.log(`- ${p.name || p.businessName}: ${JSON.stringify(p.location)}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

addNearbyProviders();
