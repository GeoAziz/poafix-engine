import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ServiceProvider } from '../models/ServiceProvider.js';

const nearbyCoords = [36.9345, -1.2366]; // [longitude, latitude]

const services = [
  { type: 'plumbing', name: 'Plumber Pro' },
  { type: 'electrical', name: 'Electrician Pro' },
  { type: 'cleaning', name: 'Cleaner Pro' },
  { type: 'painting', name: 'Painter Pro' },
  { type: 'pest_control', name: 'PestControl Pro' },
  { type: 'mechanic', name: 'Mechanic Pro' },
];

async function seedNearbyProviders() {
  await mongoose.connect('mongodb://127.0.0.1:27017/home_service_db');
  console.log('Connected to MongoDB');

  for (const svc of services) {
    const provider = new ServiceProvider({
      name: svc.name,
      businessName: `${svc.name} Ltd`,
      serviceType: svc.type,
      serviceOffered: svc.type, // <-- Required!
      phoneNumber: '+254700000000',
      email: `${svc.type}@test.com`,
      password: await bcrypt.hash('test1234', 10), // <-- Required!
      rating: 4.5,
      isAvailable: true,
      location: {
        type: 'Point',
        coordinates: nearbyCoords,
      },
      businessAddress: 'Test Location, Nairobi', // <-- Required!
      address: 'Test Location, Nairobi',
      isVerified: true,
      servicesCompleted: 10,
      experience: 2,
      pricing: {
        basePrice: 1000,
        pricePerKm: 50,
      },
    });
    await provider.save();
    console.log(`Seeded provider for ${svc.type}`);
  }

  await mongoose.disconnect();
  console.log('Done!');
}

seedNearbyProviders();