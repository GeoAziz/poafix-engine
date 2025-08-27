import express from 'express';
import { adminAuthMiddleware } from '../../middleware/admin-auth.middleware.js';

const router = express.Router();

// Add your admin auth routes here
router.post('/login', async (req, res) => {
    // Admin login logic
});

router.get('/verify', adminAuthMiddleware, async (req, res) => {
    // Admin token verification logic
});

export default router;
