import ProviderDocument from '../models/provider_document.js';
import { uploadToStorage } from '../utils/storage.js';

class ProviderDocumentController {
  constructor() {
    // Bind methods to instance
    this.getDocuments = this.getDocuments.bind(this);
    this.uploadDocument = this.uploadDocument.bind(this);
    this.verifyDocument = this.verifyDocument.bind(this);
    this.getPendingDocuments = this.getPendingDocuments.bind(this);
  }

  async getDocuments(req, res) {
    try {
      // Only allow providers to fetch their own documents
        const isProvider = req.user && (
          req.user.role === 'provider' || req.user.role === 'Provider' ||
          req.user.userType === 'provider' || req.user.userType === 'Provider' ||
          req.user.userType === 'service-provider' || req.user.userType === 'ServiceProvider'
        );
        // FIX: Use userId instead of id
        const providerId = req.user.userId || req.user.id;
        console.log('[ProviderDoc Debug]', {
          providerId,
          reqUser: req.user,
          paramProviderId: req.params.providerId
        });
        if (!isProvider || providerId !== req.params.providerId) {
          return res.status(403).json({ error: 'Access denied: providers can only view their own documents.' });
        }
      const documents = await ProviderDocument.find({ providerId: req.params.providerId });
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Upload file to cloud storage
      const fileUrl = await uploadToStorage(req.file);

      const document = new ProviderDocument({
        providerId: req.body.providerId,
        documentType: req.body.documentType,
        fileUrl: fileUrl,
        metadata: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        }
      });

      await document.save();
      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async verifyDocument(req, res) {
    try {
      const document = await ProviderDocument.findById(req.params.documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      document.status = req.body.status;
      document.adminComment = req.body.comment;
      if (req.body.status === 'verified') {
        document.verifiedAt = new Date();
      }

      await document.save();
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPendingDocuments(req, res) {
    try {
      console.log('Fetching pending documents');
      const documents = await ProviderDocument.find({ status: 'pending' })
        .populate('providerId', 'businessName email');
      
      console.log(`Found ${documents.length} pending documents`);
      res.json({
        success: true,
        data: documents.map(doc => ({
          id: doc._id,
          providerId: doc.providerId?._id,
          providerName: doc.providerId?.businessName || 'Unknown',
          documentType: doc.documentType,
          fileUrl: doc.fileUrl,
          status: doc.status,
          uploadedAt: doc.uploadedAt,
          metadata: doc.metadata
        }))
      });
    } catch (error) {
      console.error('Error in getPendingDocuments:', error);
      res.status(500).json({ error: error.message });    }  }}export default new ProviderDocumentController();