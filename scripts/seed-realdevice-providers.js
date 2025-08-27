import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ServiceProvider } from '../models/index.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/home_service_db';
const REAL_DEVICE_COORDS = [36.9345, -1.2367]; // Update to your actual device location

async function seedRealDeviceProviders() {
  const providerPassword = await bcrypt.hash('provider123', 12);
  const providers = [
    {
      name: 'Real Plumber',
      businessName: 'Plumber Near Device',
      email: 'real.plumber@example.com',
      password: providerPassword,
      phoneNumber: '+254700000101',
      businessAddress: 'Near Device',
      serviceType: 'plumbing',
      serviceOffered: [
        { name: 'Plumbing', description: 'All plumbing services', price: '3500', duration: '2 hours' }
      ],
      experience: 5,
      isAvailable: true,
      isVerified: true,
      status: 'verified',
      rating: 4.8,
      location: { type: 'Point', coordinates: REAL_DEVICE_COORDS },
      createdAt: new Date(),
    },
    {
      name: 'Real Electrician',
      businessName: 'Electrician Near Device',
      email: 'real.electrician@example.com',
      password: providerPassword,
      phoneNumber: '+254700000102',
      businessAddress: 'Near Device',
      serviceType: 'electrical',
      serviceOffered: [
        { name: 'Electrical', description: 'All electrical services', price: '2500', duration: '3 hours' }
      ],
      experience: 6,
      isAvailable: true,
      isVerified: true,
      status: 'verified',
      rating: 4.7,
      location: { type: 'Point', coordinates: REAL_DEVICE_COORDS },
      createdAt: new Date(),
    },
    {
      name: 'Real Cleaner',
      businessName: 'Cleaner Near Device',
      email: 'real.cleaner@example.com',
      password: providerPassword,
      phoneNumber: '+254700000103',
      businessAddress: 'Near Device',
      serviceType: 'cleaning',
      serviceOffered: [
        { name: 'Cleaning', description: 'All cleaning services', price: '2000', duration: '1.5 hours' }
      ],
      experience: 4,
      isAvailable: true,
      isVerified: true,
      status: 'verified',
      rating: 4.6,
      location: { type: 'Point', coordinates: REAL_DEVICE_COORDS },
      createdAt: new Date(),
    },
    {
      name: 'Real Painter',
      businessName: 'Painter Near Device',
      email: 'real.painter@example.com',
      password: providerPassword,
      phoneNumber: '+254700000104',
      businessAddress: 'Near Device',
      serviceType: 'painting',
      serviceOffered: [
        { name: 'Painting', description: 'All painting services', price: '4000', duration: '3 hours' }
      ],
      experience: 7,
      isAvailable: true,
      isVerified: true,
      status: 'verified',
      rating: 4.9,
      location: { type: 'Point', coordinates: REAL_DEVICE_COORDS },
      createdAt: new Date(),
    },
    {
      name: 'Real Pest Controller',
      businessName: 'Pest Control Near Device',
      email: 'real.pestcontrol@example.com',
      password: providerPassword,
      phoneNumber: '+254700000105',
      businessAddress: 'Near Device',
      serviceType: 'pest_control',
      serviceOffered: [
        { name: 'Pest Control', description: 'All pest control services', price: '3000', duration: '2 hours' }
      ],
      experience: 3,
      isAvailable: true,
      isVerified: true,
      status: 'verified',
      rating: 4.5,
      location: { type: 'Point', coordinates: REAL_DEVICE_COORDS },
      createdAt: new Date(),
    },
    {
      name: 'Real Mechanic',
      businessName: 'Mechanic Near Device',
      email: 'real.mechanic@example.com',
      password: providerPassword,
      phoneNumber: '+254700000106',
      businessAddress: 'Near Device',
      serviceType: 'mechanic',
      serviceOffered: [
        { name: 'Mechanic', description: 'All mechanic services', price: '5000', duration: '4 hours' }
      ],
      experience: 8,
      isAvailable: true,
      isVerified: true,
      status: 'verified',
      rating: 4.7,
      location: { type: 'Point', coordinates: REAL_DEVICE_COORDS },
      createdAt: new Date(),
    }
  ];

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove previous test providers at this location
    await ServiceProvider.deleteMany({
      'location.coordinates': REAL_DEVICE_COORDS
    });

    // Insert new providers
    await ServiceProvider.insertMany(providers);
    console.log(`Seeded ${providers.length} real device providers`);
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedRealDeviceProviders();
