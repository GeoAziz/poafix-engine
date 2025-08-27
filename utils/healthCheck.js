import NotificationService from '../services/notificationService';

// ...existing code...

export const checkApiHealth = async (userId) => {
  try {
    const response = await fetch(API_URL + '/health');
    if (!response.ok) {
      throw new Error('API server not reachable');
    }
    return true;
  } catch (error) {
    await NotificationService.createSystemErrorNotification(userId, error);
    return false;
  }
};

// ...existing code...