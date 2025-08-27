import { Notification, NOTIFICATION_TYPES } from '../models/index.js';
import { io } from '../server.js';

class NotificationService {
  static async createNotification(data) {
    try {
  const { recipient, recipientId, type, title, message, recipientModel = 'Client', data: extraData } = data;
      
      if (!NOTIFICATION_TYPES.includes(type)) {
        throw new Error(`Invalid notification type: ${type}`);
      }

      const notification = new Notification({
  recipient: recipient || recipientId,
        type,
        title,
        message,
        recipientModel,
        data: extraData,
        isRead: false
      });

      await notification.save();

      // Emit socket event
      const socketRecipient = (recipient || recipientId);
      if (socketRecipient) {
        io.to(socketRecipient.toString()).emit('notification', {
          id: notification._id,
          type,
          title,
          message,
          data: extraData,
          timestamp: notification.createdAt
        });
      }

      return notification;
    } catch (error) {
      console.error('Notification creation error:', error);
      throw error;
    }
  }

  static emitUserUpdate(userId, updateType, data) {
    io.emit(`user_${updateType}`, {
      userId,
      ...data,
      timestamp: new Date()
    });
  }

  static async markAsRead(notificationId) {
    try {
      return await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async getUnreadCount(recipientId) {
    try {
      return await Notification.countDocuments({
        recipient: recipientId,
        isRead: false
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  static async createSystemErrorNotification(userId, error) {
    return await this.createNotification({
      recipientId: userId,
      type: NOTIFICATION_TYPES.ERROR,
      title: 'System Error',
      message: error.message || 'An unexpected error occurred',
      data: { stack: error.stack }
    });
  }
}

export default NotificationService;
