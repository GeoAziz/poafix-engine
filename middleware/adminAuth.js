import jwt from 'jsonwebtoken';
import { Admin } from '../models/index.js';

const adminAuth = async (req, res, next) => {
  try {
    console.log('Checking authentication...');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      throw new Error('Authentication required');
    }

    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret');
    
    console.log('Finding admin...', decoded);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      console.log('Admin not found');
      throw new Error('Authentication failed');
    }

    // Add admin info to request
    req.admin = admin;
    req.token = token;

    console.log('Authentication successful for admin:', admin.email);
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

export const verifyAdmin = (req, res, next) => {
  if (!req.admin.permissions.includes('full_access')) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

export default adminAuth;
