import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ServiceProvider } from '../models/ServiceProvider.js';

const NAIROBI_CENTER = [36.8219, -1.2921];

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

const providers = [
    // Pest Control Providers
    {
        name: "Alice Kamau",
        businessName: "Pest Away Solutions",
        email: "alice@pestaway.com",
        password: "password123",
        phoneNumber: "+254711000001",
        businessAddress: "Kilimani, Nairobi",
        serviceOffered: "pest_control",
        experience: 6,
        skills: ["Termite Control", "Rodent Control", "Fumigation"],
        location: {
            type: "Point",
            coordinates: getCoordinatesAtDistance(NAIROBI_CENTER, 0.2, 0) // 200m East
        }
    },
    {
        name: "Peter Njoroge",
        businessName: "EcoPest Control",
        email: "peter@ecopest.com",
        password: "password123",
        phoneNumber: "+254711000002",
        businessAddress: "Westlands, Nairobi",
        serviceOffered: "pest_control",
        experience: 8,
        skills: ["Natural Pest Control", "Bed Bug Treatment", "Cockroach Control"],
        location: {
            type: "Point",
            coordinates: getCoordinatesAtDistance(NAIROBI_CENTER, 0.3, Math.PI/2) // 300m North
        }
    },
    
    // Mechanic Providers
    {
        name: "James Ochieng",
        businessName: "Quick Fix Auto",
        email: "james@quickfix.com",
        password: "password123",
        phoneNumber: "+254722000001",
        businessAddress: "South C, Nairobi",
        serviceOffered: "mechanic",
        experience: 10,
        skills: ["Engine Repair", "Transmission", "Diagnostics"],
        location: {
            type: "Point",
            coordinates: getCoordinatesAtDistance(NAIROBI_CENTER, 0.25, Math.PI) // 250m West
        }
    },
    {
        name: "Mohammed Hassan",
        businessName: "Pro Mechanics",
        email: "mohammed@promech.com",
        password: "password123",
        phoneNumber: "+254722000002",
        businessAddress: "South B, Nairobi",
        serviceOffered: "mechanic",
        experience: 7,
        skills: ["Brake Service", "Electrical Systems", "AC Repair"],
        location: {
            type: "Point",
            coordinates: getCoordinatesAtDistance(NAIROBI_CENTER, 0.4, 3*Math.PI/2) // 400m South
        }
    }
];

async function seedProviders() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/home_service_db');
        console.log('Connected to MongoDB');

        // Clear existing providers for these services
        const deleteResult = await ServiceProvider.deleteMany({
            serviceOffered: { $in: ['pest_control', 'mechanic'] }
        });
        console.log(`Deleted ${deleteResult.deletedCount} existing pest control and mechanic providers`);

        // Create new providers
        for (let provider of providers) {
            try {
                const hashedPassword = await bcrypt.hash(provider.password, 10);
                const newProvider = await ServiceProvider.create({
                    ...provider,
                    password: hashedPassword,
                    isAvailable: true,
                    isVerified: true,
                    rating: 4.0 + Math.random(),
                    servicesCompleted: Math.floor(Math.random() * 100) + 20,
                    pricing: {
                        basePrice: provider.serviceOffered === 'pest_control' ? 2500 : 1500,
                        currency: 'KES'
                    }
                });
                console.log(`Created ${provider.serviceOffered} provider: ${provider.businessName}`);
                console.log(`Location: ${provider.location.coordinates}`);
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

seedProviders();
