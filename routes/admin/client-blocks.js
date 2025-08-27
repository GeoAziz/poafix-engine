import express from 'express';
import mongoose from 'mongoose'; // Add this import
import { User } from '../../models/User.js';  // Change to correct case
import { adminAuthMiddleware } from '../../middleware/admin-auth.middleware.js';
import { NotificationService } from '../../services/notification.service.js';
import { requestDeduplicationMiddleware } from '../../middleware/request-deduplication.middleware.js';
import { BlockedClient } from '../../models/blocked-client.js';

const router = express.Router();

// Single endpoint for blocking clients
router.post(['/block/:clientId', '/block'], 
  adminAuthMiddleware,
  requestDeduplicationMiddleware,
  async (req, res) => {
    try {
      const { reason } = req.body;
      const clientId = req.params.clientId || req.body.clientId;
      
      // First verify client exists
      const client = await User.findById(clientId);
      if (!client) {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }

      // Direct update approach
      const updatedClient = await User.findByIdAndUpdate(
        clientId,
        {
          isBlocked: true,
          blockReason: reason,
          blockedAt: new Date(),
          blockedBy: req.admin._id
        },
        { 
          new: true 
        }
      );

      // Create block record
      const blockRecord = await BlockedClient.create({
        clientId: client._id,
        reason,
        blockedAt: new Date(),
        blockedBy: req.admin._id,
        isActive: true
      });

      // Return success immediately
      res.json({
        success: true,
        message: 'Client blocked successfully',
        data: { 
          client: updatedClient,
          blockRecord
        }
      });

      // Send notification asynchronously
      NotificationService.createNotification({
        recipientId: clientId,
        recipientModel: 'User',
        type: 'ACCOUNT_BLOCKED',
        title: 'Account Blocked',
        message: `Your account has been blocked. Reason: ${reason}`
      }).catch(console.error);

    } catch (error) {
      console.error('Block operation failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
});

// Update the route to return data in the correct format
router.get('/blocked', adminAuthMiddleware, async (req, res) => {
  try {
    console.log('Fetching blocked clients...');
    
    const blockedUsers = await User.find({ 
      isBlocked: true,
      role: 'client'
    }).select('-password');

    // Get active block records for these users
    const blockedRecords = await Promise.all(
      blockedUsers.map(async (user) => {
        const blockRecord = await BlockedClient.findOne({
          clientId: user._id,
          isActive: true
        }).lean();

        return {
          clientId: user,
          reason: blockRecord?.reason || user.blockReason,
          blockedAt: blockRecord?.blockedAt || user.blockedAt,
          blockedBy: blockRecord?.blockedBy || user.blockedBy,
          isActive: true
        };
      })
    );

    // Format response to match expected structure
    res.json({
      success: true,
      data: blockedRecords // Wrap the array in a data property
    });

  } catch (error) {
    console.error('Error fetching blocked clients:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
