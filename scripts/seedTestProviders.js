import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is not defined in .env file');
  process.exit(1);
}

// Since we can't use require for importing the model, we'll define the schema here
const providerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  businessName: String,
  serviceType: String,
  phoneNumber: String,
  email: String,
  rating: Number,
  isAvailable: Boolean,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: String,
  isVerified: Boolean,
  servicesCompleted: Number,
  experience: Number,
  pricing: {
    basePrice: Number,
    pricePerKm: Number
  }
});

providerSchema.index({ location: '2dsphere' });

const Provider = mongoose.model('Provider', providerSchema);

// More test providers with varied locations around Nairobi
const testProviders = [
  {
    name: "John Doe Moving",
    businessName: "JD Professional Movers",
    serviceType: "moving",
    phoneNumber: "+254700123456",
    email: "john@jdmovers.com",
    rating: 4.5,
    isAvailable: true,
    location: {
      type: "Point",
      coordinates: [36.8337083, -1.3095883]
    },
    address: "Nairobi CBD",
    isVerified: true,
    servicesCompleted: 50,
    experience: 5,
    pricing: {
      basePrice: 2000,
      pricePerKm: 100
    }
  },
  {
    name: "Alice Moving Services",
    businessName: "Quick Movers Ltd",
    serviceType: "moving",
    phoneNumber: "+254711234567",
    email: "alice@quickmovers.com",
    rating: 4.8,
    isAvailable: true,
    location: {
      type: "Point",
      coordinates: [36.8237083, -1.3195883]
    },
    address: "Westlands, Nairobi",
    isVerified: true,
    servicesCompleted: 75,
    experience: 3,
    pricing: {
      basePrice: 1800,
      pricePerKm: 90
    }
  },
  // Add more test providers with different locations
  {
    name: "Fast Movers Kenya",
    businessName: "Fast Movers Ltd",
    serviceType: "moving",
    phoneNumber: "+254722345678",
    email: "info@fastmovers.co.ke",
    rating: 4.2,
    isAvailable: true,
    location: {
      type: "Point",
      coordinates: [36.8437083, -1.2995883]
    },
    address: "Kilimani, Nairobi",
    isVerified: true,
    servicesCompleted: 120,
    experience: 7,
    pricing: {
      basePrice: 2200,
      pricePerKm: 110
    }
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully');

    // Drop existing providers
    console.log('Clearing existing providers...');
    await mongoose.connection.collection('providers').drop().catch(err => {
      if (err.code !== 26) console.error('Error dropping collection:', err);
      // Error code 26 means collection doesn't exist, which is fine
    });

    // Create indexes
    console.log('Creating geospatial index...');
    await mongoose.connection.collection('providers').createIndex({ location: "2dsphere" });

    // Insert new providers
    console.log('Inserting test providers...');
    const result = await mongoose.connection.collection('providers').insertMany(testProviders);
    console.log(`Successfully inserted ${result.insertedCount} providers`);

    // Verify the data
    const count = await mongoose.connection.collection('providers').countDocuments();
    console.log(`Total providers in database: ${count}`);

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
