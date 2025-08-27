import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ServiceProvider } from '../models/ServiceProvider.js';

const NAIROBI_CENTER = [36.8219, -1.2921];

// Helper function to slightly modify coordinates
const getNearbyCoordinates = (baseCoords, offsetKm = 0.5) => {
    // Roughly 0.009 degrees = 1km
    const randomOffset = () => (Math.random() * 0.009 * offsetKm) * (Math.random() < 0.5 ? -1 : 1);
    return [
        baseCoords[0] + randomOffset(),
        baseCoords[1] + randomOffset()
    ];
};

const serviceProviders = [
    // Plumbing Services
    {
        name: "John Kamau",
        businessName: "Swift Plumbing Solutions",
        email: "john@plumbing.com",
        password: "password123",
        phoneNumber: "+254700000001",
        businessAddress: "Westlands, Nairobi",
        serviceOffered: "plumbing",
        experience: 5,
        skills: ["Pipe Repair", "Drainage", "Water Heater Installation"],
        location: {
            type: "Point",
            coordinates: getNearbyCoordinates(NAIROBI_CENTER, 0.3)
        }
    },
    // Electrical Services
    {
        name: "David Omondi",
        businessName: "PowerFix Electric",
        email: "david@electric.com",
        password: "password123",
        phoneNumber: "+254700000002",
        businessAddress: "Kilimani, Nairobi",
        serviceOffered: "electrical",
        experience: 7,
        skills: ["Wiring", "Circuit Repair", "Solar Installation"],
        location: {
            type: "Point",
            coordinates: getNearbyCoordinates(NAIROBI_CENTER, 0.4)
        }
    },
    // Pest Control
    {
        name: "Sarah Wanjiku",
        businessName: "SafeHome Pest Control",
        email: "sarah@pestcontrol.com",
        password: "password123",
        phoneNumber: "+254700000003",
        businessAddress: "Lavington, Nairobi",
        serviceOffered: "pest_control",
        experience: 4,
        skills: ["Fumigation", "Rodent Control", "Termite Treatment"],
        location: {
            type: "Point",
            coordinates: getNearbyCoordinates(NAIROBI_CENTER, 0.2)
        }
    },
    // Painting Services
    {
        name: "Michael Owino",
        businessName: "Fresh Paint Pro",
        email: "michael@painting.com",
        password: "password123",
        phoneNumber: "+254700000004",
        businessAddress: "Karen, Nairobi",
        serviceOffered: "painting",
        experience: 6,
        skills: ["Interior Painting", "Exterior Painting", "Wall Design"],
        location: {
            type: "Point",
            coordinates: getNearbyCoordinates(NAIROBI_CENTER, 0.5)
        }
    },
    // Mechanic Services
    {
        name: "Hassan Ali",
        businessName: "AutoFix Garage",
        email: "hassan@mechanic.com",
        password: "password123",
        phoneNumber: "+254700000005",
        businessAddress: "South B, Nairobi",
        serviceOffered: "mechanic",
        experience: 8,
        skills: ["Engine Repair", "Diagnostics", "Brake Service"],
        location: {
            type: "Point",
            coordinates: getNearbyCoordinates(NAIROBI_CENTER, 0.3)
        }
    }
];

async function seedProviders() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/home_service_db');
        console.log('Connected to MongoDB');

        // Clear existing providers for these services
        const services = ['plumbing', 'electrical', 'pest_control', 'painting', 'mechanic'];
        const deleteResult = await ServiceProvider.deleteMany({
            serviceOffered: { $in: services }
        });
        console.log(`Deleted ${deleteResult.deletedCount} existing providers`);

        // Create new providers
        for (let provider of serviceProviders) {
            try {
                const hashedPassword = await bcrypt.hash(provider.password, 10);
                const newProvider = await ServiceProvider.create({
                    ...provider,
                    password: hashedPassword,
                    isAvailable: true,
                    isVerified: true,
                    rating: 4.0 + Math.random(),
                    servicesCompleted: Math.floor(Math.random() * 100) + 20
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
