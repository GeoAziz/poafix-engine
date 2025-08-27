import express from 'express';
import { Job } from '../models/job.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { NotificationService } from '../services/notification.service.js';

const router = express.Router();

// Get provider's jobs
router.get('/provider/:providerId', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ providerId: req.params.providerId })
      .populate('bookingId')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update job status
router.patch('/:jobId/status', authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    const job = await Job.findByIdAndUpdate(
      jobId,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    // Create notification
    await NotificationService.createNotification({
      recipientId: job.clientId,
      type: 'JOB_UPDATE',
      title: 'Job Status Updated',
      message: `Your job status has been updated to ${status}`,
      data: { jobId, status }
    });

    // Emit WebSocket event
    if (req.app.get('io')) {
      req.app.get('io').emit('job_status_updated', {
        jobId,
        status,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
