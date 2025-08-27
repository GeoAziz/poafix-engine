import express from 'express';
import { Area } from '../models/Area.js';

const router = express.Router();

// Get all areas
router.get('/', async (req, res) => {
    try {
        let areas = await Area.find();
        
        // If no areas exist, create default ones
        if (areas.length === 0) {
            const defaultAreas = [
                {
                    name: 'Living Room',
                    iconUrl: 'https://cdn-icons-png.flaticon.com/128/3030/3030335.png',
                    color: '#FF9800',
                    allowMultiple: true
                },
                {
                    name: 'Kitchen',
                    iconUrl: 'https://cdn-icons-png.flaticon.com/128/1245/1245264.png',
                    color: '#4CAF50',
                    allowMultiple: false
                },
                {
                    name: 'Bedroom',
                    iconUrl: 'https://cdn-icons-png.flaticon.com/128/3030/3030336.png',
                    color: '#2196F3',
                    allowMultiple: true
                },
                {
                    name: 'Bathroom',
                    iconUrl: 'https://cdn-icons-png.flaticon.com/128/3030/3030347.png',
                    color: '#9C27B0',
                    allowMultiple: true
                },
                {
                    name: 'Office',
                    iconUrl: 'https://cdn-icons-png.flaticon.com/128/3030/3030334.png',
                    color: '#F44336',
                    allowMultiple: true
                }
            ];

            areas = await Area.insertMany(defaultAreas);
        }

        console.log('Fetched areas:', areas);
        res.json(areas);
    } catch (error) {
        console.error('Error in areas route:', error);
        res.status(500).json({ 
            error: 'Failed to fetch areas',
            details: error.message 
        });
    }
});

// Add new area (admin only)
router.post('/', async (req, res) => {
    try {
        const area = new Area(req.body);
        await area.save();
        res.status(201).json(area);
    } catch (error) {
        res.status(400).json({ 
            error: 'Failed to create area',
            details: error.message 
        });
    }
});

export const areaRoutes = router;
