import { io } from '../server.js';
import { Notification } from '../models/index.js';

export class NotificationService {
  static async createUnsuspensionNotification({ providerId, removedBy, removedAt }) {
    return await NotificationService.createNotification({
      recipientId: providerId,
      recipientModel: 'Provider',
      type: 'UNSUSPENSION_ALERT',
      title: 'Account Unsuspended',
      message: 'Your account has been unsuspended. You can now use the service.',
      data: {
        removedBy,
        removedAt,
        type: 'unsuspension'
      }
    });
  }
  static async createNotification(data) {
    try {
      const { recipientId, recipientModel, type, title, message, data: extraData } = data;
      console.log('=== NotificationService.createNotification ===');
      console.log('Recipient:', recipientId, 'Model:', recipientModel);
      console.log('Type:', type, 'Title:', title, 'Message:', message);
      console.log('Extra Data:', extraData);
      // Create notification in database
      const notification = await Notification.create({
        recipient: recipientId,
        recipientModel,
        type,
        title,
        message,
        data: extraData,
        read: false,
        createdAt: new Date()
      });

      // Emit real-time notification
      io.to(recipientId.toString()).emit('notification', {
        id: notification._id,
        type,
        title,
        message,
        data: extraData,
        timestamp: notification.createdAt
      });
      console.log('Notification emitted via socket:', notification._id);
      return notification;
    } catch (error) {
      console.error('Notification creation error:', error);
      return null;
    }
  }

  static emitUserUpdate(userId, updateType, data) {
    io.emit(`user_${updateType}`, {
      userId,
      ...data,
      timestamp: new Date()
    });
  }
}
