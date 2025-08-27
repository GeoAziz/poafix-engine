import express from 'express';
import { PaintingService } from '../models/PaintingService.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        let services = await PaintingService.find();
        
        if (services.length === 0) {
            const defaultServices = [
                {
                    name: "Living Room",
                    description: "Professional living room painting service",
                    iconUrl: "https://img.icons8.com/fluency/96/living-room.png",
                    color: "#FF9800",
                    basePrice: 150.00,
                    paintTypes: ['Glossy', 'Matte', 'Satin']
                },
                {
                    name: "Bedroom",
                    description: "Complete bedroom painting service",
                    iconUrl: "https://img.icons8.com/fluency/96/bedroom.png",
                    color: "#2196F3",
                    basePrice: 120.00,
                    paintTypes: ['Glossy', 'Matte', 'Satin']
                },
                {
                    name: "Bathroom",
                    description: "Professional bathroom painting",
                    iconUrl: "https://img.icons8.com/fluency/96/bathroom.png",
                    color: "#4CAF50",
                    basePrice: 100.00,
                    paintTypes: ['Glossy', 'Matte', 'Satin']
                },
                {
                    name: "Kitchen",
                    description: "Kitchen wall painting service",
                    iconUrl: "https://img.icons8.com/fluency/96/kitchen.png",
                    color: "#9C27B0",
                    basePrice: 130.00,
                    paintTypes: ['Glossy', 'Matte', 'Satin']
                },
                {
                    name: "Office",
                    description: "Professional office painting",
                    iconUrl: "https://img.icons8.com/fluency/96/office.png",
                    color: "#F44336",
                    basePrice: 140.00,
                    paintTypes: ['Glossy', 'Matte', 'Satin']
                }
            ];

            services = await PaintingService.insertMany(defaultServices);
        }

        res.json(services);
    } catch (error) {
        console.error('Error fetching painting services:', error);
        res.status(500).json({
            error: 'Failed to fetch painting services',
            details: error.message
        });
    }
});

export const paintingRoutes = router;
