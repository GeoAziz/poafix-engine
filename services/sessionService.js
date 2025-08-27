import { User } from '../models/User.js';

export const updateUserActivity = async (userId) => {
  try {
    const result = await User.findByIdAndUpdate(userId, {
      $set: { lastActive: new Date(), isOnline: true }
    });
    console.log(`[Activity] Updated lastActive and isOnline=true for user ${userId}`);
    return result;
  } catch (error) {
    console.error('Error updating user activity:', error);
  }
};

export const getLastActive = async (userId) => {
  try {
    const user = await User.findById(userId).select('lastActive');
    return user?.lastActive;
  } catch (error) {
    console.error('Error getting last active:', error);
    return null;
  }
};
