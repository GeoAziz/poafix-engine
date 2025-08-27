import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Admin } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/home_service_db');
    
    // First, delete any existing admin
    await Admin.deleteMany({ email: 'admin@poafix.com' });
    
    // Create new admin with all available permissions
    const admin = new Admin({
      name: 'Super Admin',
      email: 'admin@poafix.com',
      password: 'admin123',
      permissions: ['users', 'providers', 'reports', 'settings']  // Only use valid enum values
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@poafix.com');
    console.log('Password: admin123');
    
    // Verify the password can be compared
    const savedAdmin = await Admin.findOne({ email: 'admin@poafix.com' });
    const isMatch = await savedAdmin.comparePassword('admin123');
    console.log('Password verification test:', isMatch ? 'PASSED' : 'FAILED');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
};

createAdmin();
