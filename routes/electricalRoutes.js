import express from 'express';
import { ElectricalService } from '../models/ElectricalService.js';

const router = express.Router();

// Get all electrical services
router.get('/', async (req, res) => {
    try {
        const services = await ElectricalService.find();
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch electrical services' });
    }
});

// Add a new electrical service (admin only)
router.post('/', async (req, res) => {
    try {
        const service = new ElectricalService(req.body);
        await service.save();
        res.status(201).json(service);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create service' });
    }
});

export const electricalRoutes = router;
