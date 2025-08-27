import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Transaction } from '../models/transaction.js';

const router = express.Router();

// Protected routes using auth middleware
router.use(authenticateToken);

// Get transactions for a provider
router.get('/', async (req, res) => {
  try {
    const providerId = req.query.providerId;
    console.log('Fetching transactions for provider:', providerId);

    const transactions = await Transaction.find({ providerId })
      .sort({ timestamp: -1 });

    console.log('Found transactions:', transactions.length);
    res.json({ 
      success: true,
      data: transactions 
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
