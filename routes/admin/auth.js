import express from 'express';
import { Admin } from '../../models/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    console.log('Admin login attempt for:', req.body.email);
    
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      console.log('No admin found with email:', email);
      return res.status(401).json({ 
        message: 'Authentication failed',
        error: 'Invalid credentials' 
      });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      console.log('Invalid password for admin:', email);
      return res.status(401).json({ 
        message: 'Authentication failed',
        error: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Admin login successful:', email);
    res.json({ 
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      message: 'Authentication failed',
      error: error.message 
    });
  }
});

export default router;
