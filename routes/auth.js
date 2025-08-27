const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Client = require('../models/Client');
const ServiceProvider = require('../models/ServiceProvider');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const router = express.Router();

// Sign-up for Client
router.post('/signup/client', async (req, res) => {
  const { name, email, password, phoneNumber, address } = req.body;

  try {
    // Check if client already exists
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ message: 'Client already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new Client object
    const client = new Client({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      address,
    });

    // Save client to the database
    await client.save();
    res.status(201).json({ message: 'Client created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Sign-up for Service Provider
router.post('/signup/service-provider', async (req, res) => {
  const { businessName, email, password, phoneNumber, businessAddress, serviceOffered } = req.body;

  try {
    // Check if service provider already exists
    const existingProvider = await ServiceProvider.findOne({ email });
    if (existingProvider) {
      return res.status(400).json({ message: 'Service provider already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new ServiceProvider object
    const provider = new ServiceProvider({
      businessName,
      email,
      password: hashedPassword,
      phoneNumber,
      businessAddress,
      serviceOffered,
    });

    // Save service provider to the database
    await provider.save();
    res.status(201).json({ message: 'Service provider created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Sign-in for both Client and Service Provider
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for the user in both Client and ServiceProvider models
    let user = await Client.findOne({ email });
    if (!user) {
      user = await ServiceProvider.findOne({ email });
    }

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return token in response
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
