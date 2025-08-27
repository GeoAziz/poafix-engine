// ...existing code...

import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin, Provider, Client, User, ServiceRequest, Booking, Payment, ActivityLog, Job } from '../models/index.js';
import * as adminController from '../controllers/adminController.js';
import adminAuth from '../middleware/adminAuth.js';
import auth from '../middleware/auth.js';

const router = express.Router();
// Dashboard jobs endpoint for active jobs count
router.get('/jobs', adminAuth, async (req, res) => {
  try {
    // Count jobs with status 'active' or 'in_progress'
    const activeJobs = await Job.countDocuments({ status: { $in: ['active', 'in_progress'] } });
    res.json({ success: true, activeJobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ...existing code...

// Unified client activity timeline: bookings + payments
router.get('/clients/:clientId/activity-timeline', adminAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Fetch bookings
    const bookings = await Booking.find({ clientId: new mongoose.Types.ObjectId(clientId) })
      .lean()
      .sort({ createdAt: -1 });

    // Fetch payments
    const payments = await Payment.find({ clientId: new mongoose.Types.ObjectId(clientId) })
      .lean()
      .sort({ createdAt: -1 });

    // Transform bookings
    const bookingActivities = bookings.map(b => ({
      type: 'booking',
      action: b.status === 'completed' ? 'BOOKING_COMPLETED' : 'BOOKING_CREATED',
      details: `Service: ${b.serviceType}, Status: ${b.status}, Provider: ${b.providerId?.toString()}`,
      refId: b._id.toString(),
      createdAt: b.createdAt,
    }));

    // Transform payments
    const paymentActivities = payments.map(p => ({
      type: 'payment',
      action: p.status === 'completed' ? 'PAYMENT_COMPLETED' : 'PAYMENT_INITIATED',
      details: `Amount: ${p.amount} ${p.currency || ''}, Method: ${p.method}, Booking: ${p.bookingId?.toString()}`,
      refId: p._id.toString(),
      createdAt: p.createdAt,
    }));

    // Merge and sort all activities by createdAt desc
    const allActivities = [...bookingActivities, ...paymentActivities]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const pagedActivities = allActivities.slice((page - 1) * limit, page * limit);

    res.json({ success: true, data: pagedActivities });
  } catch (error) {
    console.error('Unified activity error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Public admin routes
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email); // Debug log

    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log('Admin not found:', email); // Debug log
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Add debug logs for password comparison
    console.log('Stored hashed password:', admin.password);
    console.log('Attempting password comparison...');
    
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.log('Password mismatch for:', email); // Debug log
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET || 'your-fallback-secret',
      { expiresIn: '24h' }
    );

    // Add token to admin's tokens array
    admin.tokens = admin.tokens || [];
    admin.tokens.push({ token });
    await admin.save();

    console.log('Login successful:', email); // Debug log
    res.json({ 
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Login error:', error); // Debug log
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Protected admin routes
router.use(adminAuth);

// Add debug logging middleware for admin routes
router.use((req, res, next) => {
  console.log(`[Admin API] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Dashboard data
router.get('/dashboard', adminAuth, adminController.getDashboardData);

// Analytics routes
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const analytics = await adminController.getAnalytics(req, res);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics/revenue', adminAuth, async (req, res) => {
  try {
    const revenueData = await adminController.getRevenueData(req, res);
    res.json(revenueData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics/services', adminAuth, async (req, res) => {
  try {
    const servicesData = await adminController.getServiceTypeAnalytics(req, res);
    res.json(servicesData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reports
router.post('/reports', async (req, res) => {
  try {
    const report = await adminController.generateReport(req, res);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Client Management
router.get('/clients', adminAuth, async (req, res) => {
  try {
    console.log('Fetching all users as clients...');
    const clients = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    console.log(`Found ${clients.length} clients`);
    res.json({ success: true, data: clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/clients/active', adminAuth, adminController.getActiveClients);
router.get('/clients/blocked', adminAuth, adminController.getBlockedClients);
router.get('/clients/recent', adminAuth, adminController.getRecentClients);

// Add these new routes for client profile management
router.get('/clients/:clientId/profile', adminAuth, async (req, res) => {
  try {
    console.log('Getting client profile:', req.params.clientId);
    await adminController.getClientProfile(req, res);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
});

// Add these new routes
router.get('/clients/:clientId/service-history', adminAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const services = await ServiceRequest.find({ 
      clientId: new mongoose.Types.ObjectId(clientId) 
    })
    .populate('providerId', 'name')
    .lean()  // Add this to convert to plain object
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));
    
    // Transform the data before sending
    const transformedServices = services.map(service => ({
      ...service,
      _id: service._id.toString(),
      clientId: service.clientId.toString(),
      providerId: {
        _id: service.providerId._id.toString(),
        name: service.providerId.name
      }
    }));
    
    res.json({ success: true, data: transformedServices });
  } catch (error) {
    console.error('Service history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/clients/:clientId/payments', adminAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const payments = await Payment.find({ 
      clientId: new mongoose.Types.ObjectId(clientId) 
    })
    .lean()  // Add this to convert to plain object
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));
    
    // Transform the data before sending
    const transformedPayments = payments.map(payment => ({
      ...payment,
      _id: payment._id.toString(),
      clientId: payment.clientId.toString(),
      bookingId: payment.bookingId ? payment.bookingId.toString() : null,
      providerId: payment.providerId ? payment.providerId.toString() : null,
      amount: payment.amount,
      status: payment.status,
      method: payment.method,
      currency: payment.currency,
      transactionRef: payment.transactionRef || null,
      paypalPaymentUrl: payment.paypalPaymentUrl || null,
      paypalOrderId: payment.paypalOrderId || null,
      paypalPayerId: payment.paypalPayerId || null,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    }));

    res.json({ success: true, data: transformedPayments });
  } catch (error) {
    console.error('Payments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/clients/:clientId/activities', adminAuth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Fetch bookings
    const bookings = await Booking.find({ clientId: new mongoose.Types.ObjectId(clientId) })
      .lean()
      .sort({ createdAt: -1 });

    // Fetch payments
    const payments = await Payment.find({ clientId: new mongoose.Types.ObjectId(clientId) })
      .lean()
      .sort({ createdAt: -1 });

    // Transform bookings
    const bookingActivities = bookings.map(b => ({
      type: 'booking',
      action: b.status === 'completed' ? 'BOOKING_COMPLETED' : 'BOOKING_CREATED',
      details: `Service: ${b.serviceType}, Status: ${b.status}, Provider: ${b.providerId?.toString()}`,
      refId: b._id.toString(),
      createdAt: b.createdAt,
    }));

    // Transform payments
    const paymentActivities = payments.map(p => ({
      type: 'payment',
      action: p.status === 'completed' ? 'PAYMENT_COMPLETED' : 'PAYMENT_INITIATED',
      details: `Amount: ${p.amount} ${p.currency || ''}, Method: ${p.method}, Booking: ${p.bookingId?.toString()}`,
      refId: p._id.toString(),
      createdAt: p.createdAt,
    }));

    // Merge and sort all activities by createdAt desc
    const allActivities = [...bookingActivities, ...paymentActivities]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const pagedActivities = allActivities.slice((page - 1) * limit, page * limit);

    res.json({ success: true, data: pagedActivities });
  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Modify existing block/unblock routes to use updated controller methods
router.post('/clients/:clientId/block', adminAuth, adminController.blockClient);
router.post('/clients/:clientId/unblock', adminAuth, adminController.unblockClient);

router.post('/clients/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const result = await adminController.resetClientPassword(req, res);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Provider Management
router.get('/providers', adminAuth, async (req, res) => {
  try {
    console.log('[Admin API] GET /providers - Fetching all providers...');
    
    const providers = await Provider.find()
      .select('-password')
      .lean();

    console.log(`[Admin API] Found ${providers.length} providers`);
    res.json(providers);
  } catch (error) {
    console.error('[Admin API] Error fetching providers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch providers',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.get('/providers/verified', adminAuth, adminController.getVerifiedProviders);
router.get('/providers/pending', adminAuth, adminController.getPendingProviders);
router.get('/providers/suspended', adminAuth, adminController.getSuspendedProviders);
router.get('/providers/top-rated', adminAuth, adminController.getTopRatedProviders);

router.get('/providers/:id/documents', adminAuth, async (req, res) => {
  try {
    const documents = await adminController.getProviderDocuments(req, res);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Earnings
router.get('/providers/:id/earnings', adminAuth, async (req, res) => {
  try {
    const earnings = await adminController.getProviderEarnings(req, res);
    res.json(earnings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payouts (NEW ROUTE)
import { getPayoutHistory } from '../controllers/earnings.controller.js';
router.get('/providers/:id/payouts', adminAuth, async (req, res) => {
  try {
    // Use ObjectId for providerId param
    req.params.providerId = req.params.id;
    await getPayoutHistory(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/providers/:id/suspend', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    console.log('Suspending provider:', { id, reason });

    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const result = await adminController.suspendProvider(id, reason);
    res.json(result);
  } catch (error) {
    console.error('Suspend provider error:', error);
    res.status(500).json({ error: 'Failed to suspend provider', details: error.message });
  }
});

router.post('/providers/:id/unsuspend', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Unsuspending provider:', id);

    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    console.log(`[ROUTE DEBUG] Provider state before unsuspend: isSuspended=${provider.isSuspended}`);
    // Always call controller, idempotent
    const result = await adminController.unsuspendProvider(id);
    res.json(result);
  } catch (error) {
    console.error('Unsuspend provider error:', error);
    res.status(500).json({ error: 'Failed to unsuspend provider', details: error.message });
  }
});

router.post('/providers/:id/verify', adminAuth, async (req, res) => {
  try {
    const result = await adminController.verifyProvider(req, res);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this debug route
router.get('/debug', async (req, res) => {
  try {
    const clientsCount = await Client.countDocuments();
    const providersCount = await Provider.countDocuments();
    
    res.json({
      status: 'Server is running',
      database: {
        connected: mongoose.connection.readyState === 1,
        clients: clientsCount,
        providers: providersCount
      },
      endpoints: {
        clients: '/api/admin/clients',
        providers: '/api/admin/providers'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add debug route first
router.get('/test', (req, res) => {
  res.json({ message: 'Admin API is working' });
});

export default router;
