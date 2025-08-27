import { Notification } from '../models/index.js';
import { WebSocketService } from '../services/websocket.service.js';

export const createNotification = async (req, res) => {
  try {
    const notification = new Notification(req.body);
    const savedNotification = await notification.save();

    // Send real-time notification
    WebSocketService.notifyUser(req.body.recipientId, {
      type: 'NEW_NOTIFICATION',
      data: savedNotification
    });

    res.status(201).json({
      success: true,
      data: savedNotification
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    console.log('Fetching notifications for user:', {
      userId: req.userId,
      userType: req.userType
    });

    const notifications = await Notification.find({
      $or: [
        { recipientId: req.userId },
        { recipientType: req.userType }
      ]
    }).sort({ createdAt: -1 });

    console.log(`Found ${notifications.length} notifications`);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
