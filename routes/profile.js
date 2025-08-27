import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';  // Updated import
import { User } from '../models/User.js';
import { uploadImage } from '../services/storageService.js';
import { getClientProfile, updateClientProfile } from '../controllers/clientProfileController.js';
import { validateProfileUpdate } from '../middleware/profile-validation.middleware.js';

const router = express.Router();

// Fix: Use authMiddleware correctly
router.use(authMiddleware);  // Apply auth middleware to all routes

// Add logging middleware as a function
router.use(function(req, res, next) {
  console.log(`[Profile API] ${req.method} ${req.path} by user ${req.user?.id}`);
  next();
});

// Get user profile
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile with validation
router.put('/', [authMiddleware, validateProfileUpdate], async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Validate communication preference
    if (updates.preferredCommunication && 
        !['SMS', 'Email', 'Both'].includes(updates.preferredCommunication)) {
      return res.status(400).json({
        error: 'Invalid communication preference'
      });
    }

    // Validate timezone
    if (updates.timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: updates.timezone });
      } catch (e) {
        return res.status(400).json({
          error: 'Invalid timezone'
        });
      }
    }

    // Handle profile picture upload
    if (updates.profilePicture) {
      const imageUrl = await uploadImage(updates.profilePicture);
      updates.profilePicUrl = imageUrl;
      delete updates.profilePicture;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get client profile
router.get('/client/:clientId', authMiddleware, async (req, res) => {
  try {
    const profile = await getClientProfile(req.params.clientId);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update client profile
router.put('/client/:clientId', authMiddleware, async (req, res) => {
  try {
    const client = await updateClientProfile(req.params.clientId, req.body, req);
    res.json({ success: true, client });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
