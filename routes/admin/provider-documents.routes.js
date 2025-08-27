import express from 'express';
import { ProviderDocument } from '../../models/provider_document.js';
import { adminAuthMiddleware } from '../../middleware/admin-auth.middleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();
const upload = multer({
  dest: 'uploads/documents/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Debug logging
router.use((req, res, next) => {
  console.log('📑 Provider Documents Route Hit:', {
    fullUrl: req.originalUrl,
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query
  });
  next();
});

// Add request logging
router.use((req, res, next) => {
  console.log('📝 Provider Documents Request:', {
    method: req.method,
    path: req.path,
    params: req.params
  });
  next();
});

// Get provider documents
router.get('/:providerId', adminAuthMiddleware, async (req, res) => {
  try {
    console.log('🔍 Fetching documents for provider:', req.params.providerId);
    
    const documents = await ProviderDocument
      .find({ providerId: req.params.providerId })
      .sort('-createdAt')
      .lean();

    console.log(`📄 Found ${documents.length} documents`);

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify document
router.patch('/:documentId/verify', adminAuthMiddleware, async (req, res) => {
  try {
    const document = await ProviderDocument.findByIdAndUpdate(
      req.params.documentId,
      {
        status: 'verified',
        verifiedBy: req.admin.id,
        verifiedAt: new Date(),
        verificationNotes: req.body.notes
      },
      { new: true }
    );

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
