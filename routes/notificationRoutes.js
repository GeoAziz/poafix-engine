import express from 'express';
import { Notification, Client, ServiceProvider } from '../models/index.js';

const router = express.Router();

// Get all notifications for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, skip = 0, read } = req.query;

        const query = { recipient: userId };
        if (read !== undefined) {
            query.read = read === 'true';
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const totalCount = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            read: false
        });

        res.json({
            notifications,
            totalCount,
            unreadCount
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch notifications',
            details: error.message
        });
    }
});

// Mark notification as read
router.patch('/:notificationId/read', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.notificationId,
            { $set: { read: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to update notification',
            details: error.message
        });
    }
});

// Mark all notifications as read for a user
router.post('/user/:userId/mark-all-read', async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { recipient: req.params.userId, read: false },
            { $set: { read: true } }
        );

        res.json({
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to update notifications',
            details: error.message
        });
    }
});

// Send notification to user
router.post('/send', async (req, res) => {
    try {
        const { recipientId, recipientType, type, title, message, data } = req.body;

        // Verify recipient exists
        const Model = recipientType === 'Client' ? Client : ServiceProvider;
        const recipient = await Model.findById(recipientId);

        if (!recipient) {
            return res.status(404).json({ error: 'Recipient not found' });
        }

        const notification = new Notification({
            recipient: recipientId,
            recipientModel: recipientType,
            type,
            title,
            message,
            data
        });

        await notification.save();

        // Get the event manager from the app
        const eventManager = req.app.get('eventManager');
        if (eventManager) {
            eventManager.emit('notification:sent', notification);
        }

        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to send notification',
            details: error.message
        });
    }
});

// Delete notification
router.delete('/:notificationId', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.notificationId);
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to delete notification',
            details: error.message
        });
    }
});

export { router as notificationRoutes };
