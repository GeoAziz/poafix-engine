import express from 'express';
import { PestControlService } from '../models/PestControlService.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        let services = await PestControlService.find();
        
        if (services.length === 0) {
            const defaultServices = [
                {
                    name: "Cockroach Control",
                    description: "Complete cockroach elimination service",
                    iconUrl: "https://img.icons8.com/color/96/cockroach.png",
                    color: "#F44336",
                    basePrice: 80.00,
                    severityLevels: true
                },
                {
                    name: "Rodent Control",
                    description: "Comprehensive rodent extermination",
                    iconUrl: "https://img.icons8.com/color/96/rat.png",
                    color: "#795548",
                    basePrice: 120.00,
                    severityLevels: true
                },
                {
                    name: "Termite Treatment",
                    description: "Professional termite elimination",
                    iconUrl: "https://img.icons8.com/color/96/termite.png",
                    color: "#FF9800",
                    basePrice: 200.00,
                    severityLevels: true
                },
                {
                    name: "Bed Bug Control",
                    description: "Complete bed bug removal",
                    iconUrl: "https://img.icons8.com/color/96/bed-bug.png",
                    color: "#E91E63",
                    basePrice: 150.00,
                    severityLevels: true
                },
                {
                    name: "Mosquito Control",
                    description: "Mosquito prevention and control",
                    iconUrl: "https://img.icons8.com/color/96/mosquito.png",
                    color: "#4CAF50",
                    basePrice: 90.00,
                    severityLevels: true
                }
            ];

            services = await PestControlService.insertMany(defaultServices);
        }

        res.json(services);
    } catch (error) {
        console.error('Error fetching pest control services:', error);
        res.status(500).json({
            error: 'Failed to fetch pest control services',
            details: error.message
        });
    }
});

export const pestControlRoutes = router;
