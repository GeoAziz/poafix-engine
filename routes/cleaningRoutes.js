import express from 'express';
import { CleaningService } from '../models/CleaningService.js';

const router = express.Router();

// Get all cleaning services
router.get('/', async (req, res) => {
    try {
        let services = await CleaningService.find();
        
        // If no services exist, create default ones
        if (services.length === 0) {
            const defaultServices = [
                {
                    name: "Living Room Cleaning",
                    description: "Complete living room cleaning service",
                    iconUrl: "https://img.icons8.com/fluency/96/living-room.png",
                    color: "#FF9800",
                    basePrice: 50.00,
                    allowMultiple: true
                },
                {
                    name: "Kitchen Deep Clean",
                    description: "Thorough kitchen cleaning and sanitization",
                    iconUrl: "https://img.icons8.com/fluency/96/kitchen.png",
                    color: "#4CAF50",
                    basePrice: 75.00,
                    allowMultiple: false
                },
                {
                    name: "Bathroom Sanitization",
                    description: "Complete bathroom cleaning and sanitization",
                    iconUrl: "https://img.icons8.com/fluency/96/bathroom.png",
                    color: "#2196F3",
                    basePrice: 60.00,
                    allowMultiple: true
                },
                {
                    name: "Bedroom Cleaning",
                    description: "Bedroom cleaning and organization",
                    iconUrl: "https://img.icons8.com/fluency/96/bedroom.png",
                    color: "#9C27B0",
                    basePrice: 45.00,
                    allowMultiple: true
                },
                {
                    name: "Office Cleaning",
                    description: "Professional office space cleaning",
                    iconUrl: "https://img.icons8.com/fluency/96/office.png",
                    color: "#F44336",
                    basePrice: 80.00,
                    allowMultiple: true
                }
            ];

            services = await CleaningService.insertMany(defaultServices);
        }

        res.json(services);
    } catch (error) {
        console.error('Error fetching cleaning services:', error);
        res.status(500).json({
            error: 'Failed to fetch cleaning services',
            details: error.message
        });
    }
});

// New route handler
router.get('/new-route', async (req, res) => {
    try {
        const services = await CleaningService.find();
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export const cleaningRoutes = router;
