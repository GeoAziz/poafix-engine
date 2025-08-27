import express from 'express';
import { User } from '../../models/User.js';
import { BlockedClient } from '../../models/blocked-client.js';
import { adminAuthMiddleware } from '../../middleware/admin-auth.middleware.js';
import { normalizeUserResponse } from '../../middleware/response-normalizer.middleware.js';

const router = express.Router();

router.get('/', 
  adminAuthMiddleware, 
  normalizeUserResponse, 
  async (req, res) => {
    try {
      const { role } = req.query;
      console.log('📝 Fetching users with role:', role);
      
      // Get both users and blocked records
      const [users, blockedClients] = await Promise.all([
        User.find(role ? 
          { $or: [
            { role: new RegExp(role, 'i') },
            { userType: new RegExp(role, 'i') }
          ]} 
          : {})
          .select('-password -__v')
          .lean(),
        BlockedClient.find({ isActive: true })
          .populate('blockedBy', 'name email')
          .lean()
      ]);

      // Create map of blocked client IDs
      const blockedMap = new Map(
        blockedClients.map(b => [b.clientId.toString(), b])
      );

      // Transform users with block status
      const transformedUsers = users.map(user => ({
        ...user,
        isBlocked: Boolean(blockedMap.get(user._id.toString())),
        blockReason: blockedMap.get(user._id.toString())?.reason || null,
        blockedAt: blockedMap.get(user._id.toString())?.blockedAt || null,
        blockedBy: blockedMap.get(user._id.toString())?.blockedBy || null
      }));

      console.log(`📊 Found ${users.length} users, ${blockedMap.size} blocked`);

      res.json({
        success: true,
        data: transformedUsers
      });
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});

export default router;
