import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Client } from '../models/Client.js';
import { ServiceProvider } from '../models/ServiceProvider.js';
import { Provider } from '../models/provider.js';
import { authController } from '../controllers/authController.js';

const router = express.Router();

// Register client
router.post('/signup/client', async (req, res) => {
  try {
    const { name, email, password, phoneNumber, address } = req.body;
    console.log('Client signup request:', req.body); // Debug log

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Name, email, and password are required'
      });
    }

    // Check if user exists
    const existingUser = await Client.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new client with default location if not provided
    const client = new Client({
      name,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber || '0000000000', // Default phone number if not provided
      address: address || 'Default Address',
      location: {
        type: 'Point',
        coordinates: [36.8219, -1.2921] // Default coordinates (Nairobi)
      }
    });

    await client.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: client._id, userType: 'client' },
      process.env.JWT_SECRET || 'your-fallback-secret',
      { expiresIn: '1h' }
    );

    res.status(201).json({
      success: true,
      message: 'Client registered successfully',
      token,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        userType: 'client',
        phoneNumber: client.phoneNumber,
        address: client.address
      }
    });
  } catch (error) {
    console.error('Client signup error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ error: 'Failed to create client account' });
  }
});

// Service Provider Signup
router.post('/signup/provider', async (req, res) => {
  try {
    console.log('DEBUG: Provider signup request body:', req.body);
    const {
      name,
      email,
      password,
      phoneNumber,
      businessName,
      businessAddress,
      serviceOffered,
      serviceType,
      location
    } = req.body;

    // Check existing provider
    const existingProvider = await ServiceProvider.findOne({ 
      $or: [{ email }, { businessName }] 
    });

    if (existingProvider) {
      const field = existingProvider.email === email ? 'email' : 'businessName';
      return res.status(400).json({
        error: `${field === 'email' ? 'Email' : 'Business name'} already registered`
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(String(password), 10);

    // Create provider with hashed password
    const provider = new ServiceProvider({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      businessName,
      businessAddress,
      serviceOffered,
      serviceType,
      location: {
        type: 'Point',
        coordinates: location.coordinates
      }
    });

    await provider.save();

    // Create token
    const token = jwt.sign(
      { userId: provider._id, userType: 'provider' },
      process.env.JWT_SECRET || 'your-fallback-secret',
      { expiresIn: '24h' }
    );

    const providerResponse = provider.toObject();
    delete providerResponse.password;

    res.status(201).json({
      success: true,
      message: 'Provider registered successfully',
      token,
      provider: providerResponse
    });

  } catch (error) {
    console.error('Provider signup error:', error);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    res.status(500).json({ error: error.message, details: error.errors });
  }
});

// Add debug route (remove in production)
router.get('/debug/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const provider = await ServiceProvider.findOne({ email });
        if (provider) {
            return res.json({
                found: true,
                email: provider.email,
                passwordHash: provider.password,
                // don't send other sensitive data
            });
        }
        return res.status(404).json({ found: false });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Debug route to reset provider password (remove in production)
router.post('/debug/reset-password', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const provider = await ServiceProvider.findOne({ email });
        if (!provider) {
            return res.status(404).json({ error: 'Provider not found' });
        }

        provider.password = hashedPassword;
        await provider.save();

        return res.json({
            success: true,
            message: 'Password updated',
            debug: {
                originalPassword: password,
                hashedPassword: hashedPassword
            }
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Unified login endpoint
router.post('/login', authController.login);

// Request password reset
router.post('/password-reset/request', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await Client.findOne({ email }) || await ServiceProvider.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-fallback-secret',
            { expiresIn: '1h' }
        );

        // TODO: Send reset email
        // For now, just return the token
        res.json({ message: 'Reset instructions sent', resetToken });
    } catch (error) {
        res.status(500).json({ error: 'Password reset failed', details: error.message });
    }
});

// Export as named export 'authRoutes' and default export
export const authRoutes = router;
export default router;
