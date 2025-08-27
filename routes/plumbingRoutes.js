import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Define the schema for plumbing services
const plumbingServiceSchema = new mongoose.Schema({
  name: String,
  description: String,
  iconUrl: String,
  color: String,
  basePrice: Number,
  allowMultiple: Boolean
});

// Create the model if it doesn't exist
const PlumbingService = mongoose.models.PlumbingService || 
  mongoose.model('PlumbingService', plumbingServiceSchema, 'plumbingservices');

// GET all plumbing services
router.get('/', async (req, res) => {
  try {
    console.log('Fetching plumbing services...');
    const services = await PlumbingService.find({});
    console.log(`Found ${services.length} plumbing services`);
    res.json(services);
  } catch (error) {
    console.error('Error fetching plumbing services:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as plumbingRoutes };
