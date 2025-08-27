import express from 'express';
import NotificationService from '../services/notificationService.js';
import { Notification } from '../models/index.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Debug middleware for this route
router.use((req, res, next) => {
  console.log('📨 Notifications API Request:', {
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    params: req.params,
    auth: req.headers.authorization?.substring(0, 20) + '...'
  });
  next();
});

// Get notifications for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Safely handle recipientModel casing and undefined
    let model = '';
    if (req.user && req.user.type) {
      model = String(req.user.type).toLowerCase();
    } else if (req.query.recipientModel) {
      model = String(req.query.recipientModel).toLowerCase();
    }
    const recipientId = req.user._id || req.user.id;
    const query = {
      recipient: recipientId,
      recipientModel: { $in: [model, model.charAt(0).toUpperCase() + model.slice(1)] }
    };
    console.log('🔎 Notification fetch query:', query);
    console.log('🔎 User context:', req.user);
    const notifications = await Notification.find(query).sort({ createdAt: -1 });

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id);
    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unread count
router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user._id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Create notification
router.post('/', async (req, res) => {
  try {
    const notification = await NotificationService.createNotification(req.body);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
