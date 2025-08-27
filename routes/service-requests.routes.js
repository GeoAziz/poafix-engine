import express from 'express';
import { createRequestValidation, updateStatusValidation } from '../middleware/service-request-validation.middleware.js';
import {
  createServiceRequest,
  updateRequestStatus,
  getClientRequests,
  getProviderRequests
} from '../controllers/service-request.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// Debug logging middleware
router.use((req, res, next) => {
  console.log('[ServiceRequest] Route accessed:', {
    method: req.method,
    path: req.originalUrl,
    body: req.body,
    userId: req.user?.id,
    userType: req.user?.type
  });
  next();
});

// Mount routes
router.post('/', authMiddleware, createRequestValidation, createServiceRequest);
router.patch('/:id/status', authMiddleware, updateStatusValidation, updateRequestStatus);
router.get('/client/:clientId', authMiddleware, getClientRequests);
router.get('/provider/:providerId', authMiddleware, getProviderRequests);

export default router;
