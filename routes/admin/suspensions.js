import express from 'express';
import Suspension from '../../models/suspension.js';
import { ServiceProvider } from '../../models/ServiceProvider.js';
import adminAuthMiddleware from '../../middleware/admin-auth.middleware.js';
import { suspensionValidationMiddleware } from '../../middleware/suspension-validation.middleware.js';
import { requestDeduplicationMiddleware } from '../../middleware/request-deduplication.middleware.js';
import { NotificationService } from '../../services/notification.service.js';

const router = express.Router();

// Add middleware chain
router.post('/suspend',
  adminAuthMiddleware,
  requestDeduplicationMiddleware,
  suspensionValidationMiddleware,
  async (req, res) => {
    console.log('🚨 Processing suspension request:', req.body);
    
    let suspension;
    try {
      const { providerId, reason, reasonType, duration } = req.body;

      // Create suspension record
      suspension = new Suspension({
        providerId,
        reason,
        reasonType,
        duration,
        active: true,
        endDate: calculateEndDate(duration),
        createdBy: req.admin._id,
        startDate: new Date()
      });

      await suspension.save();

      // Update provider first
      const updatedProvider = await ServiceProvider.findByIdAndUpdate(
        providerId,
        {
          $set: {
            isSuspended: true,
            isAvailable: false,
            suspendedAt: new Date(),
            currentSuspension: suspension._id
          }
        },
        {
          new: true,
          runValidators: true
        }
      );

      if (!updatedProvider) {
        throw new Error('Provider not found');
      }

      // Create notification with correct type
      const notification = await NotificationService.createNotification({
        recipientId: providerId,
        recipientModel: 'Provider',  // Changed from ServiceProvider to Provider
        type: 'SUSPENSION_ALERT',    // Use consistent type
        title: 'Account Suspended',
        message: `Your account has been suspended. Reason: ${reason}`,
        data: {
          suspensionId: suspension._id,
          duration,
          reason,
          type: 'suspension'
        }
      });

      console.log('✅ Suspension processed successfully:', {
        providerId,
        suspensionId: suspension._id,
        notificationId: notification._id
      });

      return res.status(200).json({
        success: true,
        message: 'Provider suspended successfully',
        data: {
          provider: updatedProvider,
          suspension,
          notification
        }
      });

    } catch (error) {
      console.error('❌ Suspension error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to suspend provider',
        details: error.message
      });
    }
});

// Add middleware chain for unsuspend
router.post('/unsuspend/:providerId',
  adminAuthMiddleware,
  requestDeduplicationMiddleware,
  async (req, res) => {
    try {
      console.log('🔓 Unsuspend request received:', {
        providerId: req.params.providerId,
        admin: req.admin?._id
      });

      const { providerId } = req.params;
      
      // Check if provider exists and is suspended
  const provider = await ServiceProvider.findById(providerId);
      if (!provider) {
        return res.status(404).json({
          success: false,
          error: 'Provider not found'
        });
      }
      console.log(`[ROUTE DEBUG] Provider state before unsuspend: isSuspended=${provider.isSuspended}`);
      // Always proceed, idempotent

      // Update suspension record
      await Suspension.findOneAndUpdate(
        { providerId, active: true },
        { 
          active: false, 
          endDate: new Date(),
          updatedBy: req.admin._id 
        }
      );
  
      // Update provider status

      // Explicitly set suspendedAt to undefined, then save to trigger pre-save hook
  const providerDoc = await ServiceProvider.findById(providerId);
      if (providerDoc) {
        providerDoc.suspendedAt = null;
        providerDoc.currentSuspension = null;
        providerDoc.isAvailable = true;
        console.log('[PRE-SAVE DEBUG] Provider before save:', {
          suspendedAt: providerDoc.suspendedAt,
          isSuspended: providerDoc.isSuspended
        });
        await providerDoc.save();
        console.log('[POST-SAVE DEBUG] Provider after save:', {
          suspendedAt: providerDoc.suspendedAt,
          isSuspended: providerDoc.isSuspended
        });
      }
  const updatedProvider = await ServiceProvider.findById(providerId);

      // Create notification using NotificationService
      const notification = await NotificationService.createUnsuspensionNotification({
        providerId: providerId,
        removedBy: req.admin._id,
        removedAt: new Date()
      });

      console.log('Created unsuspension notification:', notification);
  
      return res.status(200).json({ 
        success: true,
        message: 'Provider unsuspended successfully',
        provider: updatedProvider,
        notification
      });

    } catch (error) {
      console.error('Unsuspension error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to unsuspend provider',
        details: error.message
      });
    }
});

function calculateEndDate(duration) {
  const now = new Date();
  switch (duration) {
    case '24h':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '48h':
      return new Date(now.getTime() + 48 * 60 * 60 * 1000);
    case '1 week':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'Permanent':
      return null;
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

export default router;
