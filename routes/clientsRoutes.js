import express from 'express';
import bcrypt from 'bcryptjs';
import { Client } from '../models/Client.js';
import { Booking } from '../models/booking.model.js';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Missing token' });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

// Client login (static route, must be before dynamic routes)
import { clientController } from '../controllers/clientController.js';
router.post('/login', clientController.login);

// Get all clients (admin only)
router.get('/', async (req, res) => {
    try {
        const clients = await Client.find()
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(clients);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch clients',
            details: error.message
        });
    }
});

// Get client by ID
router.get('/:id', async (req, res) => {
    try {
        const client = await Client.findById(req.params.id)
            .select('-password');
        
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        res.json(client);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch client',
            details: error.message
        });
    }
});

// Create new client
router.post('/', async (req, res) => {
    try {
        const { name, email, password, phoneNumber, address } = req.body;

        // Check if client already exists
        const existingClient = await Client.findOne({ email });
        if (existingClient) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const client = new Client({
            name,
            email,
            password: hashedPassword,
            phoneNumber,
            address
        });

        await client.save();
        
        // Remove password from response
        const clientResponse = client.toObject();
        delete clientResponse.password;

        res.status(201).json({
            message: 'Client created successfully',
            client: clientResponse
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to create client',
            details: error.message
        });
    }
});

// Update client profile
router.patch('/:id', async (req, res) => {
    try {
        const updates = req.body;
        const clientId = req.params.id;

        // Don't allow password update through this route
        delete updates.password;

        const client = await Client.findByIdAndUpdate(
            clientId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json({
            message: 'Client updated successfully',
            client
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to update client',
            details: error.message
        });
    }
});

// Get client bookings
import mongoose from 'mongoose';
router.get('/:id/bookings', async (req, res) => {
    try {
        const clientObjectId = mongoose.Types.ObjectId.isValid(req.params.id)
            ? new mongoose.Types.ObjectId(req.params.id)
            : req.params.id;
        const bookings = await Booking.find({ clientId: clientObjectId })
            .populate('provider', 'businessName phoneNumber serviceOffered')
            .sort({ scheduledDate: -1 });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch client bookings',
            details: error.message
        });
    }
});

// Update client location
router.post('/:id/location', async (req, res) => {
    try {
        const { coordinates, address } = req.body;
        
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
            return res.status(400).json({ error: 'Invalid coordinates format' });
        }

        const client = await Client.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    location: {
                        type: 'Point',
                        coordinates,
                        address
                    }
                }
            },
            { new: true }
        );

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json({
            message: 'Location updated successfully',
            location: client.location
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to update location',
            details: error.message
        });
    }
});

// Update lastActive for a user (protected)
router.post('/update-last-active', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }
        const user = await User.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.lastActive = new Date();
        await user.save();
        console.log('Updated lastActive for user', user._id.toString(), ':', user.lastActive);
        res.json({ message: 'Last active updated', lastActive: user.lastActive });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update last active', details: error.message });
    }
});

// Admin: Get client profile by ID
router.get('/profile/:clientId', async (req, res) => {
    // Call controller method
    return await clientController.getClientProfile(req, res);
});

export { router as clientsRoutes };
