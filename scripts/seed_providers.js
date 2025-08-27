import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ServiceProvider } from '../models/ServiceProvider.js';

const NAIROBI_CENTER = [36.8219, -1.2921];
const cleaningProviders = [
  {
    name: "John Quick", // Added name field
    businessName: "Quick Clean Services",
    email: "quick@clean.com",
    password: "password123",
    phoneNumber: "+254700000001",
    businessAddress: "Westlands, Nairobi",
    serviceOffered: "cleaning",
    experience: 5,
    location: {
      type: "Point",
      coordinates: [36.8209, -1.2911] // ~200m from center
    }
  },
  {
    name: "Mary Sparkle", // Added name field
    businessName: "Sparkle Home Cleaners",
    email: "sparkle@clean.com",
    password: "password123",
    phoneNumber: "+254700000002",
    businessAddress: "Kilimani, Nairobi",
    serviceOffered: "cleaning",
    experience: 3,
    location: {
      type: "Point",
      coordinates: [36.8229, -1.2931] // ~300m from center
    }
  },
  {
    name: "James Green", // Added name field
    businessName: "Green Clean Pro",
    email: "green@clean.com",
    password: "password123",
    phoneNumber: "+254700000003",
    businessAddress: "Lavington, Nairobi",
    serviceOffered: "cleaning",
    experience: 7,
    location: {
      type: "Point",
      coordinates: [36.8199, -1.2901] // ~500m from center
    }
  }
];

async function seedProviders() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/home_service_db');
    console.log('Connected to MongoDB');

    // Clear existing cleaning service providers
    const deleteResult = await ServiceProvider.deleteMany({ serviceOffered: 'cleaning' });
    console.log(`Deleted ${deleteResult.deletedCount} existing cleaning providers`);
    
    // Hash passwords and create providers
    for (let provider of cleaningProviders) {
      try {
        const hashedPassword = await bcrypt.hash(provider.password, 10);
        const newProvider = await ServiceProvider.create({
          ...provider,
          password: hashedPassword,
          isAvailable: true,
          isVerified: true,
          rating: 4.5 + Math.random() * 0.5,
          servicesCompleted: Math.floor(Math.random() * 100) + 50
        });
        console.log(`Created provider: ${provider.businessName} with ID: ${newProvider._id}`);
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
