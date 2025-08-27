import mongoose from 'mongoose';
import Earning from '../models/earning.model.js';
import Provider from '../models/provider.model.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/home_service_db';

async function seedProviderEarnings() {
  await mongoose.connect(MONGODB_URI);
  console.log('🧹 Clearing existing earnings records...');
  await Earning.deleteMany({});
  const providers = await Provider.find();
  console.log(`Found ${providers.length} providers.`);

  for (const provider of providers) {
    const earning = new Earning({
      providerId: provider._id, // Use exact ObjectId from provider
      totalEarnings: Math.floor(Math.random() * 100000),
      availableBalance: 0,
      pendingPayouts: 0,
      totalPayouts: 0,
      monthlyStats: [],
      lastUpdated: new Date()
    });
    await earning.save();
    console.log(`Seeded earnings for provider ${provider.businessName} (${provider._id})`);
  }
  await mongoose.disconnect();
  console.log('✅ Provider earnings seeding complete.');
}

seedProviderEarnings();
