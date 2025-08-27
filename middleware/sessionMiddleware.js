import { updateUserActivity } from '../services/sessionService.js';
import { logUserActivity } from '../models/activityLog.js';
import { User } from '../models/User.js';

export const trackUserActivity = async (req, res, next) => {
  try {
    if (req.user?.id) {
      await updateUserActivity(req.user.id);
      await logUserActivity(req.user.id, 'API_ACCESS', {
        method: req.method,
        path: req.path
      }, req);
      console.log(`[SessionMiddleware] User ${req.user.id} activity tracked and isOnline set true.`);
    }
    if (req.user && req.user.id) {
      await User.findByIdAndUpdate(req.user.id, {
        $set: { lastActive: new Date() }
      });
      console.log(`[SessionMiddleware] Updated lastActive for user ${req.user.id}`);
    }
  } catch (error) {
    console.error('Activity tracking error:', error);
  } finally {
    next();
  }
};
