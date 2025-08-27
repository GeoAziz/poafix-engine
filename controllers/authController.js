import { Provider } from '../models/provider.js';
import { Client } from '../models/Client.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express from 'express';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const router = express.Router();

// Define the login function first
export const login = async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    try {
        // First try Provider collection
        let user = await Provider.findOne({ email });
        let userType = 'provider';

        // If not found in Provider, try Client collection
        if (!user) {
            console.log('Not found in providers, checking clients...');
            user = await Client.findOne({ email });
            userType = 'client';
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            { id: user._id, userType },
            process.env.JWT_SECRET || 'your-fallback-secret',
            { expiresIn: '24h' }
        );

        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            token,
            userType,
            user: userResponse
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

// Sign-up for Client
router.post('/signup/client', async (req, res) => {
  const { name, email, password, phoneNumber, address } = req.body;

  try {
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ success: false, message: 'Client already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const client = new Client({ name, email, password: hashedPassword, phoneNumber, address });
    await client.save();

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Sign-up for Service Provider
router.post('/signup/service-provider', async (req, res) => {
  const { businessName, email, password, phoneNumber, businessAddress, serviceOffered } = req.body;

  try {
    const existingProvider = await ServiceProvider.findOne({ email });
    if (existingProvider) {
      return res.status(400).json({ success: false, message: 'Service provider already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const provider = new ServiceProvider({
      businessName,
      email,
      password: hashedPassword,
      phoneNumber,
      businessAddress,
      serviceOffered,
    });

    await provider.save();
    res.status(201).json({ success: true, message: 'Service provider created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

// Sign-in for both Client and Service Provider
router.post('/signin', login);

// Export the controller object
export const authController = {
    login
};

// Export individual functions
export {
    login as loginHandler
};

// Default export
export default authController;
