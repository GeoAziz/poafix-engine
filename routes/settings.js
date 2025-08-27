import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Setting from '../models/setting.js';

const router = express.Router();

// Use authenticateToken middleware
router.use(authenticateToken);

// Get settings
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.find({});
    res.json({ 
      success: true, 
      data: settings 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update setting
router.patch('/:id', async (req, res) => {
  try {
    const setting = await Setting.findByIdAndUpdate(
      req.params.id, 
      req.body,
      { new: true }
    );
    res.json({ 
      success: true, 
      data: setting 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
