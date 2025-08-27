import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { 
  getProviderEarnings, 
  requestPayout,
  getPayoutHistory,
  getEarningsStats
} from '../controllers/earnings.controller.js';

const router = express.Router();

router.get('/:providerId/earnings', authMiddleware, getProviderEarnings);
router.get('/:providerId/payouts', authMiddleware, getPayoutHistory);
router.get('/:providerId/stats', authMiddleware, getEarningsStats);
router.post('/:providerId/payouts/request', authMiddleware, requestPayout);

export default router;
