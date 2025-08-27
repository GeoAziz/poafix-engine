import express from 'express';
import multer from 'multer';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import controller from '../controllers/provider_document_controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Add debug logging
router.use((req, res, next) => {
  console.log('Provider Documents Route Hit:', {
    path: req.originalUrl,
    method: req.method,
    auth: req.headers.authorization?.substring(0, 20) + '...'
  });
  next();
});

// Mount routes
// Only admin routes use isAdmin
router.get('/pending', authenticateToken, isAdmin, controller.getPendingDocuments);
router.get('/:providerId', authenticateToken, controller.getDocuments);
router.post('/upload', authenticateToken, upload.single('document'), controller.uploadDocument);
router.patch('/:documentId/verify', authenticateToken, isAdmin, controller.verifyDocument);

export default router;