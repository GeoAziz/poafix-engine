import mongoose from 'mongoose';
import { ServiceProvider } from '../models/ServiceProvider.js';

async function ensureIndexes() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/home_service_db');
        console.log('Connected to MongoDB');

        // Create new 2dsphere index
        await ServiceProvider.collection.createIndex(
            { location: "2dsphere" },
            { background: true }
        );
        console.log('Created 2dsphere index');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Done');
    }
}

ensureIndexes();
