import express from 'express';
import { User } from '../../models/index.js';  // Only need User model
import { adminAuthMiddleware } from '../../middleware/admin-auth.middleware.js';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' })
      .select('-password -__v')
      .lean();

    // Transform document to ensure consistent boolean fields and block info
    const transformedClients = clients.map(client => ({
      ...client,
      isBlocked: Boolean(client.blockReason || client.blockedAt),
      isOnline: Boolean(client.isOnline),
      blockReason: client.blockReason || null,
      blockedAt: client.blockedAt || null,
      blockedBy: client.blockedBy || null
    }));

    console.log(`Found ${clients.length} clients`);
    console.log('Blocked clients:', transformedClients.filter(c => c.isBlocked).length);
    
    res.json({
      success: true,
      data: transformedClients
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update blocked clients route to use User model
router.get('/blocked', adminAuthMiddleware, async (req, res) => {
  try {
    console.log('\n🔍 DEBUG: Blocked Clients Request');
    
    // 1. First try to find all blocked users
    const blockedUsers = await User.find({ 
      role: { $regex: /^client$/i }, // Case insensitive match for 'client'
      isBlocked: true 
    })
    .select('name email phoneNumber blockReason blockedAt blockedBy')
    .lean();

    console.log('\nDebug Info:');
    console.log('Query parameters:', {
      role: 'client',
      isBlocked: true
    });
    console.log('Found blocked users:', blockedUsers.length);

    // 2. If no results, try alternate query
    if (blockedUsers.length === 0) {
      console.log('\nTrying raw MongoDB query...');
      const db = mongoose.connection.db;
      const rawUsers = await db.collection('users').find({
        role: { $regex: /^client$/i },
        isBlocked: { $eq: true }
      }).toArray();
      console.log('Raw query found:', rawUsers.length, 'users');
    }

    // 3. Transform and return the data
    const transformedBlockedClients = blockedUsers.map(user => ({
      _id: user._id,
      client: {
        _id: user._id,
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      },
      reason: user.blockReason || '',
      blockedAt: user.blockedAt || new Date(),
      blockedBy: user.blockedBy || null,
      isActive: true
    }));

    console.log(`\nTransformed ${transformedBlockedClients.length} records`);
    if (transformedBlockedClients.length > 0) {
      console.log('Sample record:', JSON.stringify(transformedBlockedClients[0], null, 2));
    }

    res.json(transformedBlockedClients);
  } catch (error) {
    console.error('\n❌ Error in /blocked route:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
