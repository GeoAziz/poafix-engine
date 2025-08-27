import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/nearby', authMiddleware, (req, res) => {
  res.json({ message: 'Nearby locations endpoint' });
});

router.post('/update', authMiddleware, (req, res) => {
  res.json({ message: 'Location update endpoint' });
});

export default router;
