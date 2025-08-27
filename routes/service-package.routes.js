import express from 'express';
import {
  getServicePackages,
  getServicePackageById,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage
} from '../controllers/service-package.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get service packages with filters
router.get('/', getServicePackages);

// Get specific service package
router.get('/:packageId', getServicePackageById);

// Create service package (providers only)
router.post('/', authMiddleware, createServicePackage);

// Update service package
router.patch('/:packageId', authMiddleware, updateServicePackage);

// Delete (deactivate) service package
router.delete('/:packageId', authMiddleware, deleteServicePackage);

export default router;