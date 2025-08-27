import express from 'express';
import { User } from '../models/User.js';

const router = express.Router();

// Get user online status and last active
router.get('/:id/status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('isOnline lastActive');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      isOnline: user.isOnline,
      lastActive: user.lastActive
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user status', details: error.message });
  }
});

export default router;
