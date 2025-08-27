import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { providerController } from '../controllers/providerController.js';
import { clientController } from '../controllers/clientController.js';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'API router is working' });
});

// Debug route to check mount point
router.get('/', (req, res) => {
    res.json({ 
        message: 'API base route',
        availableRoutes: {
            clients: ['/api/clients/signup', '/api/clients/login'],
            providers: ['/api/providers/signup', '/api/providers/login']
        }
    });
});

// Protected routes using auth middleware - Fix this line
router.use('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route' });
});

// Client routes - mounted at /api/clients/*
router.post('/clients/signup', async (req, res) => {
    console.log('Processing client signup:', req.body);
    try {
        await clientController.signup(req, res);
    } catch (error) {
        console.error('Client signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing signup',
            error: error.message
        });
    }
});

router.post('/clients/login', clientController.login);

// Provider routes - direct handler mapping
router.post('/providers/signup', providerController.signup);
router.post('/providers/login', providerController.login);

// Provider routes with existence checks - Fix middleware usage
router.post('/providers/location', authenticateToken, providerController.updateLocation || ((req, res) => {
    res.status(501).json({ message: 'Location update not implemented' });
}));

router.patch('/providers/status', authenticateToken, providerController.updateStatus || ((req, res) => {
    res.status(501).json({ message: 'Status update not implemented' });
}));

router.get('/providers/profile', authenticateToken, providerController.getProfile || ((req, res) => {
    res.status(501).json({ message: 'Get profile not implemented' });
}));

router.get('/providers/jobs', authenticateToken, providerController.getJobs || ((req, res) => {
    res.status(501).json({ message: 'Get jobs not implemented' });
}));

// Client routes with existence checks - Fix middleware usage
router.get('/clients/profile', authenticateToken, clientController.getProfile || ((req, res) => {
    res.status(501).json({ message: 'Get profile not implemented' });
}));

router.post('/clients/request-service', authenticateToken, clientController.requestService || ((req, res) => {
    res.status(501).json({ message: 'Request service not implemented' });
}));

// Protected route example
router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Access granted to protected route' });
});

// Admin route example
router.get('/admin', authenticateToken, isAdmin, (req, res) => {
  res.json({ message: 'Access granted to admin route' });
});

// Export the router
export default router;
