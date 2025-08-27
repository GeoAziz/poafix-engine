const mongoose = require('mongoose');
const Provider = require('../models/provider.model.js');

const mongoURI = 'mongodb://127.0.0.1:27017/home_service_db';

const testProviders = [
  {
    name: 'John Doe',
    businessName: 'Quick Movers Nairobi',
    email: 'john@quickmovers.com',
    password: 'hashedpassword123',
    phoneNumber: '+254700000001',
    serviceType: 'moving',
    rating: 4.5,
    available: true,
    location: {
      type: 'Point',
      coordinates: [36.8337083, -1.3095883] // Exact client location
    }
  },
  {
    name: 'Jane Smith',
    businessName: 'Star Movers Kenya',
    email: 'jane@starmovers.com',
    password: 'hashedpassword123',
    phoneNumber: '+254700000002',
    serviceType: 'moving',
    rating: 4.8,
    available: true,
    location: {
      type: 'Point',
      coordinates: [36.8347083, -1.3085883] // 500m NE of client
    }
  },
  {
    name: 'Bob Wilson',
    businessName: 'Expert Movers EA',
    email: 'bob@expertmovers.com',
    password: 'hashedpassword123',
    phoneNumber: '+254700000003',
    serviceType: 'moving',
    rating: 4.2,
    available: true,
    location: {
      type: 'Point',
      coordinates: [36.8327083, -1.3105883] // 500m SW of client
    }
  }
];

async function addTestProviders() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // First, clear existing test providers
    await Provider.deleteMany({ 
      email: { 
        $in: testProviders.map(p => p.email) 
      } 
    });
    console.log('Cleared existing test providers');

    // Add new test providers
    const result = await Provider.insertMany(testProviders);
    console.log('Added test providers:', result);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addTestProviders();
