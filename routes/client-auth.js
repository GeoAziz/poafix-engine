import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    console.log('=== Client Login Debug ===');
    console.log('Request:', { 
      email: req.body.email,
      hasPassword: !!req.body.password 
    });

    // Case insensitive email search
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${req.body.email}$`, 'i') }
    });

    console.log('User lookup result:', {
      found: !!user,
      role: user?.role,
      email: req.body.email
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    console.log('Password validation:', { isMatch });

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phoneNumber, 
      address,
      location 
    } = req.body;

    console.log('Processing client signup:', {
      ...req.body,
      password: '[REDACTED]'
    });

    // Ensure location has proper structure
    const clientData = {
      name,
      email,
      password,
      phoneNumber,
      address,
      role: 'client',
      location: {
        type: 'Point',
        coordinates: location?.coordinates || [36.8219, -1.2921] // Default to Nairobi if not provided
      }
    };

    // Create new client using User model
    const client = new User(clientData);
    await client.save();

    // Generate token
    const token = jwt.sign(
      { id: client._id, role: 'client' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: client._id,
        name: client.name,
        email: client.email,
        role: 'client',
        phoneNumber: client.phoneNumber
      }
    });

  } catch (error) {
    console.error('Client signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: error.message
    });
  }
});

export default router;
