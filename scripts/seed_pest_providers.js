import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ServiceProvider } from '../models/ServiceProvider.js';

const CLIENT_LOCATION = [36.8337083, -1.3095883]; // Client's location

// Helper function to get coordinates at specific distance
const getCoordinatesAtDistance = (baseCoords, distanceKm, angle) => {
    // 0.009 degrees = roughly 1km
    const latOffset = Math.cos(angle) * (distanceKm * 0.009);
    const lngOffset = Math.sin(angle) * (distanceKm * 0.009);
    return [
        baseCoords[0] + lngOffset,
        baseCoords[1] + latOffset
    ];
};

const pestControlProviders = [
    {
        name: "John Njoroge",
        businessName: "Pest Guard Pro",
        email: "john@pestguard.com",
        password: "password123",
        phoneNumber: "+254711222001",
        businessAddress: "South C, Nairobi",
        serviceOffered: "pest_control", // Exact match for the enum value
        experience: 5,
        skills: ["Pest Inspection", "Fumigation", "Rodent Control"],
        location: {
            type: "Point",
            coordinates: getCoordinatesAtDistance(CLIENT_LOCATION, 0.3, 0) // 300m East
        }
    },
    {
        name: "Sarah Wambui",
        businessName: "SafeHome Pest Solutions",
        email: "sarah@safehome.com",
        password: "password123",
        phoneNumber: "+254711222002",
        businessAddress: "Madaraka, Nairobi",
        serviceOffered: "pest_control",
        experience: 7,
        skills: ["Natural Pest Control", "Termite Treatment", "Bed Bug Control"],
        location: {
            type: "Point",
            coordinates: getCoordinatesAtDistance(CLIENT_LOCATION, 0.2, Math.PI/4) // 200m Northeast
        }
    },
    {
        name: "David Kimani",
        businessName: "EcoPest Kenya",
        email: "david@ecopest.com",
        password: "password123",
        phoneNumber: "+254711222003",
        businessAddress: "Nyayo Estate, Nairobi",
        serviceOffered: "pest_control",
        experience: 4,
        skills: ["Commercial Pest Control", "Residential Treatment", "Preventive Services"],
        location: {
            type: "Point",
            coordinates: getCoordinatesAtDistance(CLIENT_LOCATION, 0.4, Math.PI/2) // 400m North
        }
    },
    {
        name: "Mary Akinyi",
        businessName: "Green Pest Solutions",
        email: "mary@greenpest.com",
        password: "password123",
        phoneNumber: "+254711222004",
        businessAddress: "Tassia, Nairobi",
        serviceOffered: "pest_control",
        experience: 6,
        skills: ["Organic Pest Control", "Mosquito Control", "Spider Treatment"],
        location: {
            type: "Point",
            coordinates: getCoordinatesAtDistance(CLIENT_LOCATION, 0.25, -Math.PI/4) // 250m Southeast
        }
    }
];

async function seedPestControlProviders() {
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
                    servicesCompleted: Math.floor(Math.random() * 50) + 20,
                    pricing: {
                        basePrice: 2000 + Math.floor(Math.random() * 1000),
                        currency: 'KES'
                    }
                });
                console.log(`Created pest control provider: ${provider.businessName}`);
                console.log(`Location: ${provider.location.coordinates}`);
                console.log(`Distance from client: ${getDistanceInMeters(CLIENT_LOCATION, provider.location.coordinates)}m`);
            } catch (e) {
                console.error(`Error creating provider ${provider.businessName}:`, e.message);
            }
        }

        console.log('Seeding completed successfully');
    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Helper to calculate distance for verification
function getDistanceInMeters(coord1, coord2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1[1] * Math.PI/180;
    const φ2 = coord2[1] * Math.PI/180;
    const Δφ = (coord2[1]-coord1[1]) * Math.PI/180;
    const Δλ = (coord2[0]-coord1[0]) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

seedPestControlProviders();
