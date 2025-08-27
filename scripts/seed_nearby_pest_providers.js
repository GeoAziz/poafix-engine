import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ServiceProvider } from '../models/ServiceProvider.js';

// Client's exact location
const CLIENT_LOCATION = [36.8337083, -1.3095883];

// Helper to get coordinates at specific distance
const getCoordinatesAtDistance = (baseCoords, distanceKm, angle) => {
    // 0.009 degrees = roughly 1km at equator
    const latOffset = Math.cos(angle) * (distanceKm * 0.009);
    const lngOffset = Math.sin(angle) * (distanceKm * 0.009);
    return [
        baseCoords[0] + lngOffset,
        baseCoords[1] + latOffset
    ];
};

const pestControlProviders = [
    {
        name: "Lucy Wambui",
        businessName: "PestAway Express",
        email: "lucy@pestawayexpress.com",
        password: "password123",
        phoneNumber: "+254722001001",
        businessAddress: "Lang'ata Road, Nairobi",
        serviceOffered: "pest_control",
        experience: 5,
        skills: ["Residential Pest Control", "Fumigation", "Rodent Control"],
        location: {
            type: "Point",
            coordinates: getCoordinatesAtDistance(CLIENT_LOCATION, 0.2, 0) // 200m East
        }
    },
    {
        name: "Daniel Mwangi",
        businessName: "SafeHome Pest Solutions",
        email: "daniel@safehome.com",
        password: "password123",
        phoneNumber: "+254722001002",
        businessAddress: "Mbagathi Way, Nairobi",
        serviceOffered: "pest_control",
        experience: 8,
        skills: ["Commercial Pest Control", "Termite Treatment", "Bed Bug Control"],
        location: {
            type: "Point",
            coordinates: getCoordinatesAtDistance(CLIENT_LOCATION, 0.3, Math.PI/3) // 300m Northeast
        }
    },
    {
        name: "Faith Njeri",
        businessName: "EcoPest Kenya",
        email: "faith@ecopest.co.ke",
        password: "password123",
        phoneNumber: "+254722001003",
        businessAddress: "Ngong Road, Nairobi",
        serviceOffered: "pest_control",
        experience: 6,
        skills: ["Organic Pest Control", "Preventive Treatment", "Mosquito Control"],
        location: {
            type: "Point",
            coordinates: getCoordinatesAtDistance(CLIENT_LOCATION, 0.15, -Math.PI/4) // 150m Southeast
        }
    },
    {
        name: "James Omondi",
        businessName: "City Pest Masters",
        email: "james@pestmasters.co.ke",
        password: "password123",
        phoneNumber: "+254722001004",
        businessAddress: "South C, Nairobi",
        serviceOffered: "pest_control",
        experience: 7,
        skills: ["Emergency Pest Control", "Cockroach Control", "Spider Treatment"],
        location: {
            type: "Point",
            coordinates: getCoordinatesAtDistance(CLIENT_LOCATION, 0.25, Math.PI/2) // 250m North
        }
    }
];

async function seedNearbyPestProviders() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/home_service_db');
        console.log('Connected to MongoDB');

        // Clear existing pest control providers
        const deleteResult = await ServiceProvider.deleteMany({
            serviceOffered: 'pest_control'
        });
        console.log(`Deleted ${deleteResult.deletedCount} existing pest control providers`);

        // Create new providers
        for (let provider of pestControlProviders) {
            try {
                const hashedPassword = await bcrypt.hash(provider.password, 10);
                const newProvider = await ServiceProvider.create({
                    ...provider,
                    password: hashedPassword,
                    isAvailable: true,
                    isVerified: true,
                    rating: 4.0 + Math.random(),
                    servicesCompleted: Math.floor(Math.random() * 50) + 20
                });

                // Calculate actual distance
                const R = 6371; // Earth's radius in km
                const lat1 = CLIENT_LOCATION[1] * Math.PI/180;
                const lat2 = provider.location.coordinates[1] * Math.PI/180;
                const dLat = (provider.location.coordinates[1] - CLIENT_LOCATION[1]) * Math.PI/180;
                const dLon = (provider.location.coordinates[0] - CLIENT_LOCATION[0]) * Math.PI/180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(lat1) * Math.cos(lat2) *
                        Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distance = R * c * 1000; // Convert to meters

                console.log(`Created pest control provider: ${provider.businessName}`);
                console.log(`Location: ${provider.location.coordinates}`);
                console.log(`Distance from client: ${distance.toFixed(0)} meters`);
            } catch (e) {
                console.error(`Error creating provider ${provider.businessName}:`, e.message);
            }
        }

        console.log('\nTo test, use this curl command:');
        console.log(`curl "http:// 192.168.0.102/api/providers/nearby?lat=${CLIENT_LOCATION[1]}&lng=${CLIENT_LOCATION[0]}&service=pest_control&radius=5000"`);

    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

seedNearbyPestProviders();
