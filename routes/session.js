import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { updateUserActivity, getLastActive } from '../services/sessionService.js';
import { logUserActivity } from '../models/activityLog.js';

const router = express.Router();

router.post('/start', authMiddleware, (req, res) => {
  updateUserActivity(req.user.id)
    .then(() => logUserActivity(req.user.id, 'SESSION_START', {}, req))
    .then(() => res.json({ success: true, timestamp: new Date() }))
    .catch(error => res.status(500).json({ error: error.message }));
});

router.post('/end', authMiddleware, (req, res) => {
  logUserActivity(req.user.id, 'SESSION_END', {}, req)
    .then(() => res.json({ success: true, timestamp: new Date() }))
    .catch(error => res.status(500).json({ error: error.message }));
});

router.put('/keep-alive', authMiddleware, (req, res) => {
  updateUserActivity(req.user.id)
    .then(() => res.json({ success: true, timestamp: new Date() }))
    .catch(error => res.status(500).json({ error: error.message }));
});

router.get('/status', authMiddleware, (req, res) => {
  getLastActive(req.user.id)
    .then(lastActive => res.json({
      isActive: true,
      lastActive,
      currentSession: new Date()
    }))
    .catch(error => res.status(500).json({ error: error.message }));
});

export default router;
