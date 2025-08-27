import jwt from 'jsonwebtoken';
import { Admin } from '../models/index.js';

// Change to named export
export const adminAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('🔐 Validating admin token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin || decoded.role !== 'admin') {
      throw new Error('Not authorized as admin');
    }

    req.admin = admin;
    req.token = token;
    next();
  } catch (error) {
    console.error('Admin auth error:', error.message);
    res.status(401).json({
      success: false,
      error: 'Not authorized to access this resource'
    });
  }
};

// Also export as default for backward compatibility
export default adminAuthMiddleware;
