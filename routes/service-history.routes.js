import express from 'express';
import {
  getServiceHistory,
  getServiceHistoryById,
  createServiceHistory,
  getServiceHistoryAnalytics
} from '../controllers/service-history.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get service history with filters
router.get('/', authMiddleware, getServiceHistory);

// Get service history analytics
router.get('/analytics', authMiddleware, getServiceHistoryAnalytics);

// Get specific service history
router.get('/:historyId', authMiddleware, getServiceHistoryById);

// Create service history (usually done automatically after booking completion)
router.post('/', authMiddleware, createServiceHistory);

export default router;