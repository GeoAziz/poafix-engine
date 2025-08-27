const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const ServiceProvider = require('../models/ServiceProvider');

const providers = [
    {
        businessName: "Joe's Plumbing",
        email: "joe@test.com",
        password: "test123",
        phoneNumber: "1234567890",
        businessAddress: "123 Main St, New York, NY",
        serviceOffered: "Plumbing",
        location: {
            type: "Point",
            coordinates: [-74.006, 40.7128] // NYC coordinates
        }
    },
    {
        businessName: "Quick Electric",
        email: "quick@test.com",
        password: "test123",
        phoneNumber: "2345678901",
        businessAddress: "456 Broadway, New York, NY",
        serviceOffered: "Electrical",
        location: {
            type: "Point",
            coordinates: [-73.996, 40.7148] // Nearby NYC
        }
    },
    {
        businessName: "Clean Masters",
        email: "clean@test.com",
        password: "test123",
        phoneNumber: "3456789012",
        businessAddress: "789 5th Ave, New York, NY",
        serviceOffered: "Cleaning",
        location: {
            type: "Point",
            coordinates: [-73.986, 40.7138] // Also nearby NYC
        }
    }
];

async function seedProviders() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/home_service_db');
        console.log('Connected to MongoDB');

        // Clear existing providers
        await ServiceProvider.deleteMany({});
        console.log('Cleared existing providers');

        // Hash passwords and create providers
        const hashedProviders = await Promise.all(providers.map(async provider => ({
            ...provider,
            password: await bcrypt.hash(provider.password, 10)
        })));

        // Insert providers
        const result = await ServiceProvider.insertMany(hashedProviders);
        console.log(`Seeded ${result.length} providers`);

        // Create the geospatial index
        await ServiceProvider.collection.createIndex({ location: "2dsphere" });
        console.log('Created geospatial index');

        // Test the geospatial query
        const testQuery = await ServiceProvider.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [-74.006, 40.7128]
                    },
                    $maxDistance: 5000
                }
            }
        });
        console.log(`Test query found ${testQuery.length} nearby providers`);

    } catch (error) {
        console.error('Error seeding providers:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

seedProviders();
