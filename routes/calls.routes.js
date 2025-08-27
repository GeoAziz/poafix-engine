import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { Booking } from '../models/index.js';

const router = express.Router();

// Call history model (we'll store call records)
const callHistorySchema = {
  callId: String,
  bookingId: String,
  callerId: String,
  callerName: String,
  callerType: String,
  receiverId: String,
  receiverName: String,
  receiverType: String,
  callType: String, // 'voice' or 'video'
  duration: Number, // in seconds
  status: String, // 'completed', 'missed', 'declined', 'failed'
  startTime: Date,
  endTime: Date,
  quality: Number, // 1-5 rating
  createdAt: Date
};

// Initiate call
router.post('/initiate', authMiddleware, async (req, res) => {
  try {
    const {
      receiverId,
      receiverName,
      isVideoCall = false,
      bookingId
    } = req.body;

    const callerId = req.user.id;
    const callerName = req.user.name || 'User';
    const callerType = req.user.userType || 'client';

    // Verify booking exists if provided
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      // Verify user is part of this booking
      if (booking.clientId.toString() !== callerId && booking.providerId.toString() !== callerId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const channelId = `channel_${callId}`;

    // Emit call initiation via WebSocket
    if (req.io) {
      req.io.to(receiverId).emit('incoming_call', {
        callId,
        channelId,
        callerId,
        callerName,
        callerType,
        receiverId,
        receiverName,
        isVideoCall,
        bookingId,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      data: {
        callId,
        channelId,
        status: 'calling'
      }
    });

  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Accept call
router.post('/accept', authMiddleware, async (req, res) => {
  try {
    const { callId, channelId, callerId } = req.body;
    const receiverId = req.user.id;

    // Emit call acceptance via WebSocket
    if (req.io) {
      req.io.to(callerId).emit('call_accepted', {
        callId,
        channelId,
        receiverId,
        timestamp: new Date()
      });

      // Also notify the channel
      req.io.to(channelId).emit('call_connected', {
        callId,
        participants: [callerId, receiverId]
      });
    }

    res.json({
      success: true,
      message: 'Call accepted'
    });

  } catch (error) {
    console.error('Error accepting call:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Decline call
router.post('/decline', authMiddleware, async (req, res) => {
  try {
    const { callId, callerId, reason = 'declined' } = req.body;
    
    // Emit call decline via WebSocket
    if (req.io) {
      req.io.to(callerId).emit('call_declined', {
        callId,
        reason,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Call declined'
    });

  } catch (error) {
    console.error('Error declining call:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// End call
router.post('/end', authMiddleware, async (req, res) => {
  try {
    const {
      callId,
      channelId,
      duration = 0,
      participants = []
    } = req.body;

    // Emit call end via WebSocket
    if (req.io) {
      req.io.to(channelId).emit('call_ended', {
        callId,
        duration,
        endedBy: req.user.id,
        timestamp: new Date()
      });

      // Notify all participants
      participants.forEach(participantId => {
        if (participantId !== req.user.id) {
          req.io.to(participantId).emit('call_ended', {
            callId,
            duration,
            endedBy: req.user.id
          });
        }
      });
    }

    res.json({
      success: true,
      message: 'Call ended'
    });

  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Report call busy
router.post('/busy', authMiddleware, async (req, res) => {
  try {
    const { callerId } = req.body;
    
    // Emit busy signal via WebSocket
    if (req.io) {
      req.io.to(callerId).emit('call_busy', {
        receiverId: req.user.id,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Busy signal sent'
    });

  } catch (error) {
    console.error('Error sending busy signal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get call history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;

    // This would query a call history collection if we had one
    // For now, return empty array
    const callHistory = [];

    res.json({
      success: true,
      data: callHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        hasMore: false
      }
    });

  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate Agora token (for production use)
router.post('/token', authMiddleware, async (req, res) => {
  try {
    const { channelId, userId } = req.body;
    
    // In production, you would generate an Agora token here
    // For development, we return null (which allows testing)
    const token = null;

    res.json({
      success: true,
      data: {
        token,
        channelId,
        userId: userId || req.user.id,
        expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }
    });

  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
