import pkg from 'node-cron';
const { schedule } = pkg;

import { Suspension, ServiceProvider, Notification } from '../models/index.js';

const checkSuspensions = async () => {
  try {
    const now = new Date();
    const expiredSuspensions = await Suspension.find({
      active: true,
      endDate: { $lte: now },
      endDate: { $ne: null } // Exclude permanent suspensions
    });

    for (const suspension of expiredSuspensions) {
      // Update suspension status
      await Suspension.findByIdAndUpdate(suspension._id, { active: false });
      
      // Update provider status
      await ServiceProvider.findByIdAndUpdate(suspension.providerId, {
        isSuspended: false,
        currentSuspension: null
      });

      // Create auto-unsuspension notification
      await Notification.create({
        recipientId: suspension.providerId,
        recipientModel: 'ServiceProvider',
        type: 'SUSPENSION_ALERT',
        title: 'Suspension Period Ended',
        message: 'Your suspension period has ended. You can now resume providing services.',
        data: {
          suspensionId: suspension._id,
          endedAt: new Date()
        }
      });

      console.log(`Provider ${suspension.providerId} auto-unsuspended`);
    }
  } catch (error) {
    console.error('Error checking suspensions:', error);
  }
};

// Run every hour
schedule('0 * * * *', checkSuspensions);

console.log('Suspension checker cron job started');
