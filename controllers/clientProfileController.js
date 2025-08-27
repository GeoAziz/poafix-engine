import { User, Client } from '../models/User.js';
import { ActivityLog, logUserActivity } from '../models/activityLog.js';
import { updateUserActivity } from '../services/sessionService.js';
import { ServiceRequest } from '../models/serviceRequest.js';

export const getClientProfile = async (userId) => {
  try {
    const client = await Client.findById(userId)
      .select('-password')
      .lean();
      
    if (!client) throw new Error('Client not found');

    const [serviceRequests, activities] = await Promise.all([
      ServiceRequest.find({ clientId: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      ActivityLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(5)
        .lean()
    ]);

    await updateUserActivity(userId);

    return {
      client: {
        ...client,
        lastActive: client.lastActive || new Date()
      },
      serviceRequests,
      activities
    };
  } catch (error) {
    throw new Error(`Failed to get client profile: ${error.message}`);
  }
};

export const updateClientProfile = async (userId, updateData, req) => {
  try {
    const client = await Client.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    await logUserActivity(userId, 'PROFILE_UPDATE', {
      updatedFields: Object.keys(updateData)
    }, req);

    return client;
  } catch (error) {
    throw new Error(`Failed to update client profile: ${error.message}`);
  }
};
