import express from 'express';
import { 
    createRating, 
    getProviderRatings, 
    getProviderAnalytics,
    triggerRating // Add this import
} from '../controllers/rating.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authMiddleware, createRating);
router.get('/provider/:providerId', authMiddleware, getProviderRatings);
router.post('/trigger', authMiddleware, triggerRating);
router.get('/analytics/:providerId', authMiddleware, getProviderAnalytics);

export default router;
