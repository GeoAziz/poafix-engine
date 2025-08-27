import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { User, Client } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Add the verify endpoint
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.userId,
        userType: req.user.userType
      }
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Auth verification failed',
      error: error.message
    });
  }
});

// Add client signup route
router.post('/clients/signup', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phoneNumber,
      address,
      location,
      backupContact,
      preferredCommunication,
      timezone,
      profilePicture
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new client
    const client = new Client({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      address,
      location,
      backupContact,
      preferredCommunication,
      timezone,
      profilePicUrl: null, // Will be updated after image upload
      role: 'client'
    });

    await client.save();

    // Generate token
    const token = jwt.sign(
      { id: client._id, role: 'client' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const clientResponse = client.toObject();
    delete clientResponse.password;

    res.status(201).json({
      success: true,
      token,
      user: clientResponse
    });

  } catch (error) {
    console.error('Client signup error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
