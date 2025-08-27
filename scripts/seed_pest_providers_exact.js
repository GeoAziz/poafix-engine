import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ServiceProvider } from '../models/ServiceProvider.js';

// IMPORTANT: These are the exact client coordinates
const CLIENT_COORDS = {
    latitude: -1.3095883,
    longitude: 36.8337083
};

const pestProviders = [
    {
        name: "John Mwangi",
        businessName: "Nairobi Pest Solutions",
        email: "john@nairobipest.com",
        password: "password123",
        phoneNumber: "+254722001001",
        businessAddress: "South C, Nairobi",
        serviceOffered: "pest_control",
        experience: 5,
        skills: ["Pest Control", "Fumigation"],
        location: {
            type: "Point",
            // IMPORTANT: MongoDB expects [longitude, latitude]
            coordinates: [36.8337083, -1.3075883] // 200m North of client
        }
    },
    {
        name: "Jane Kamau",
        businessName: "EcoPest Kenya",
        email: "jane@ecopest.co.ke",
        password: "password123",
        phoneNumber: "+254722001002",
        businessAddress: "Nyayo Estate, Nairobi",
        serviceOffered: "pest_control",
        experience: 7,
        skills: ["Organic Pest Control", "Termite Treatment"],
        location: {
            type: "Point",
            coordinates: [36.8357083, -1.3095883] // 200m East of client
        }
    },
    {
        name: "Peter Omondi",
        businessName: "SafeHome Pest Control",
        email: "peter@safehome.co.ke",
        password: "password123",
        phoneNumber: "+254722001003",
        businessAddress: "Lang'ata, Nairobi",
        serviceOffered: "pest_control",
        experience: 4,
        skills: ["Residential Pest Control", "Rodent Control"],
        location: {
            type: "Point",
            coordinates: [36.8337083, -1.3115883] // 200m South of client
        }
    }
];

async function seedExactPestProviders() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/home_service_db');
        console.log('Connected to MongoDB');

        // Clear existing pest control providers
        const deleteResult = await ServiceProvider.deleteMany({
            serviceOffered: 'pest_control'
        });
        console.log(`Deleted ${deleteResult.deletedCount} existing pest control providers`);

        // Create providers
        for (const provider of pestProviders) {
            try {
                const hashedPassword = await bcrypt.hash(provider.password, 10);
                const newProvider = await ServiceProvider.create({
                    ...provider,
                    password: hashedPassword,
                    isAvailable: true,
                    isVerified: true,
                    rating: 4.5,
                    servicesCompleted: 50
                });

                // Calculate exact distance
                const lat1 = CLIENT_COORDS.latitude;
                const lon1 = CLIENT_COORDS.longitude;
                const lat2 = provider.location.coordinates[1];
                const lon2 = provider.location.coordinates[0];

                const R = 6371e3; // Earth's radius in meters
                const φ1 = lat1 * Math.PI/180;
                const φ2 = lat2 * Math.PI/180;
                const Δφ = (lat2-lat1) * Math.PI/180;
                const Δλ = (lon2-lon1) * Math.PI/180;

                const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                        Math.cos(φ1) * Math.cos(φ2) *
                        Math.sin(Δλ/2) * Math.sin(Δλ/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distance = R * c;

                console.log(`Created pest control provider: ${provider.businessName}`);
                console.log(`Coordinates: [${provider.location.coordinates}]`);
                console.log(`Distance from client: ${distance.toFixed(0)} meters\n`);
            } catch (error) {
                console.error(`Error creating provider ${provider.businessName}:`, error.message);
            }
        }

        // Verify the 2dsphere index
        const indexes = await ServiceProvider.collection.getIndexes();
        console.log('\nCollection indexes:', indexes);

        // Test query
        const testQuery = await ServiceProvider.find({
            serviceOffered: 'pest_control',
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [CLIENT_COORDS.longitude, CLIENT_COORDS.latitude]
                    },
                    $maxDistance: 5000
                }
            }
        });

        console.log('\nTest query results:', testQuery.length, 'providers found');
        console.log('\nTo test with curl:');
        console.log(`curl "http:// 192.168.0.102/api/providers/nearby?lat=${CLIENT_COORDS.latitude}&lng=${CLIENT_COORDS.longitude}&service=pest_control&radius=5000" | json_pp`);

    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

seedExactPestProviders();
