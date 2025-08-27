// Core dependencies
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { RealtimeManager } from './services/realtime_manager.js';
import { Client } from './models/User.js';

// Import PayPal configuration
import paypalConfig from './config/paypal.config.js';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';
import { WebSocketServer } from 'ws';

// Middleware imports
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import authMiddleware from './middleware/auth.middleware.js';
import { adminAuthMiddleware } from './middleware/admin-auth.middleware.js';
import { normalizeUserResponse } from './middleware/response-normalizer.middleware.js';
import { trackUserActivity } from './middleware/sessionMiddleware.js';

// Services imports
// import { RealtimeManager } from './services/realtime_manager.js';
import { eventManager } from './services/event_manager.js';
import { WebSocketService } from './services/websocket.service.js';

// Models imports
import { Provider, Booking } from './models/index.js';

// Configuration imports
import { connectDB } from './config/db.js';

// Background jobs
import './cron/suspension-checker.js';

// Core Routes
import { authRoutes } from './routes/authRoutes.js';
import providerRoutes from './routes/provider.routes.js';
import providersRoutes from './routes/providers.js';
import { clientsRoutes } from './routes/clientsRoutes.js';
import { plumbingRoutes } from './routes/plumbingRoutes.js';
import { pestControlRoutes } from './routes/pestControlRoutes.js';
import { paintingRoutes } from './routes/paintingRoutes.js';
import { cleaningRoutes } from './routes/cleaningRoutes.js';
import { electricalRoutes } from './routes/electricalRoutes.js';
import { mechanicRoutes } from './routes/mechanicRoutes.js';
import { areaRoutes } from './routes/areaRoutes.js';
import locationRoutes from './routes/location.routes.js';
import paymentRoutes from './routes/payment_routes.js';
import jobRoutes from './routes/job.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import apiRoutes from './routes/api.js';
import transactionsRouter from './routes/transactions.js';
import servicesRouter from './routes/services.js';
import settingsRouter from './routes/settings.js';
import sessionRoutes from './routes/session.js';
import profileRoutes from './routes/profile.js';
import userStatusRoutes from './routes/user_status.routes.js';

// Admin Routes
import adminRoutes from './routes/admin.js';
import clientBlocksRouter from './routes/admin/client-blocks.js';
import suspensionsRouter from './routes/admin/suspensions.js';
import adminProviderRoutes from './routes/admin/provider.routes.js';
import providerDocumentsRoutes from './routes/provider_documents.js';
import adminAuthRoutes from './routes/admin/auth.routes.js';

// Services and Utils
import setupWebSocketServer from './websocket/websocket-server.js';
import AnalyticsService from './websocket/analytics-service.js';

// Utility imports
import { getDistance } from './utils/distance.js';

// Import service request routes
import serviceRequestRoutes from './routes/service-requests.routes.js';

import ratingRoutes from './routes/rating.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import enhancedProviderRoutes from './routes/providers.routes.js';
import chatsRoutes from './routes/chats.routes.js';
import callsRoutes from './routes/calls.routes.js';

import providerEarningsRoutes from './routes/provider-earnings.routes.js';
import serviceHistoryRoutes from './routes/service-history.routes.js';
import recurringBookingRoutes from './routes/recurring-booking.routes.js';
import servicePackageRoutes from './routes/service-package.routes.js';

// Load environment variables from the correct .env file (supports ENV_FILE override)
// ...existing code...

// Define constants at the top
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/home_service_db';
const PORT = process.env.PORT || 5000;

// Define MongoDB options BEFORE using them
const MONGODB_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
  retryReads: true,
  directConnection: true,
  family: 4
};

// Single instance declarations
const app = express();
const server = http.createServer(app);

// Native WebSocket server for Dart clients
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws, req) => {
  console.log('Native WebSocket client connected');
  ws.on('message', (message) => {
    console.log('Received:', message);
    // Handle messages from client
  });
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"]
  }
});
const realtimeManager = new RealtimeManager(io);

// Health check endpoint - NO AUTH REQUIRED
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Initialize WebSocket service with the io instance
WebSocketService.initialize(io);

// Initialize base middleware first
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Request-Id'],
  credentials: true
}));
app.use(express.json());
app.use(requestLogger);

// Mount provider documents route HERE
app.use('/api/provider-documents', providerDocumentsRoutes);

// Add normalizer middleware before routes
app.use(normalizeUserResponse);

// Make WebSocket io available in all routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Debug logging for admin routes - move this BEFORE route mounting
app.use((req, res, next) => {
  if (req.path.startsWith('/admin')) {
    console.log('Admin route accessed:', {
      path: req.path,
      method: req.method,
      headers: req.headers,
      body: req.body
    });
  }
  next();
});

// Core middleware setup (SINGLE INSTANCE)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Request-Id'],
  credentials: true
}));
app.use(express.json());
app.use(requestLogger);

// Add session tracking middleware after auth
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(trackUserActivity);

// Debug middleware (SINGLE INSTANCE)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, {
    headers: {
      auth: req.headers.authorization ? 'Present' : 'Missing'
    }
  });
  next();
});

// Core Routes - SINGLE INSTANCE
app.use('/api/admin/providers', adminProviderRoutes);
app.use('/api/admin/clients', clientBlocksRouter);
app.use('/api/admin/suspensions', suspensionsRouter);
app.use('/api/admin', adminRoutes);

// API Routes - SINGLE INSTANCE
app.use('/api/providers', providerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/providers', providersRoutes); // Mount endpoints for recent activities/upcoming appointments
app.use('/api/service-requests', serviceRequestRoutes);  // Add this line BEFORE other routes
app.use('/api/clients', clientsRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/payments', paymentRoutes(eventManager, paypalConfig));
app.use('/api/plumbing-services', plumbingRoutes);
app.use('/api/pest-control-services', pestControlRoutes);
app.use('/api/painting-services', paintingRoutes);
app.use('/api/cleaning-services', cleaningRoutes);
app.use('/api/electrical-services', electricalRoutes);
app.use('/api/mechanic-services', mechanicRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/services', servicesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/bookings', bookingRoutes);
app.use('/api', apiRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/provider-earnings', providerEarningsRoutes);
app.use('/api/service-history', serviceHistoryRoutes);
app.use('/api/recurring-bookings', recurringBookingRoutes);
app.use('/api/service-packages', servicePackageRoutes);

// Add ratings routes
app.use('/api/ratings', ratingRoutes);

// Add reviews routes
app.use('/api/reviews', reviewRoutes);

// Add enhanced provider search routes (mount at /api/providers)
app.use('/api/providers', enhancedProviderRoutes);

// Add chat routes
app.use('/api/chats', chatsRoutes);

// Add call routes
app.use('/api/calls', callsRoutes);

// Add a test route for bookings
app.get('/api/test/bookings', (req, res) => {
  res.json({
    message: 'Bookings route is working',
    endpoints: {
      get: '/api/bookings',
      post: '/api/bookings'
    }
  });
});

// PayPal redirect routes (must be above 404 handler)
app.get('/paypal/success', (req, res) => {
  const { token, PayerID } = req.query;
  res.send(`
    <html>
      <head>
        <title>Payment Success</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f7f7f7;
            text-align: center;
            padding-top: 60px;
            margin: 0;
          }
          .container {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            display: inline-block;
            padding: 32px 24px;
            margin: 0 16px;
            max-width: 400px;
          }
          .success-icon {
            color: #27ae60;
            font-size: 64px;
            margin-bottom: 16px;
            animation: scaleIn 0.5s ease-out;
          }
          @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }
          .title {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 12px;
            color: #2d3436;
          }
          .desc {
            font-size: 1.1rem;
            color: #444;
            margin-bottom: 24px;
          }
          .instructions {
            color: #888;
            font-size: 1rem;
            margin-bottom: 24px;
            line-height: 1.4;
          }
          .button {
            background: #27ae60;
            color: #fff;
            border: none;
            padding: 14px 32px;
            border-radius: 24px;
            font-size: 1.1rem;
            cursor: pointer;
            margin-top: 18px;
            box-shadow: 0 2px 8px rgba(39,174,96,0.08);
            transition: background 0.2s;
          }
          .button:hover {
            background: #219150;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">&#x2714;</div>
          <div class="title">Payment Successful!</div>
          <div class="desc">Thank you for your payment.</div>
          <div class="instructions">Click below to return to the app and complete your payment process.</div>
          <button class="button" onclick="returnToApp()">Return to App</button>
        </div>
        <script>
          function returnToApp() {
            try {
              window.PaymentChannel.postMessage(JSON.stringify({
                token: '${token}',
                PayerID: '${PayerID}',
                status: 'success'
              }));
            } catch(e) {
              window.location.href = 'poafix://payment/success?token=${token}&PayerID=${PayerID}';
            }
          }
        </script>
      </body>
    </html>
  `);
});

app.get('/paypal/cancel', (req, res) => {
  res.send('<html><body><h2>Payment Cancelled</h2></body></html>');
});

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Add a test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// Debug route for PayPal config
app.get('/api/debug/paypal-config', (req, res) => {
  res.json({
    currentNgrokUrl: paypalConfig.returnUrl.replace('/paypal/success',''),
    paypalEndpoints: {
      success: paypalConfig.returnUrl,
      cancel: paypalConfig.cancelUrl
    },
    status: 'active'
  });
});

// Debug route to test API
app.get('/api/debug', (req, res) => {
    res.json({
        routes: {
            location: '/api/location/nearby',
            auth: '/api/auth',
            clients: '/api/clients',
            notifications: '/api/notifications',
            areas: '/api/areas',
            session: '/api/session/*',
            profile: '/api/profile/*'
        },
        status: 'OK'
    });
});

// Add a debug route to test the API
app.get('/api/debug/routes', (req, res) => {
  res.json({
    message: 'Available routes:',
    routes: {
        providers: {
            nearby: '/api/providers/nearby',
            all: '/api/providers/all'
        },
        sessionRoutes: [
          'POST /api/session/start',
          'POST /api/session/end',
          'PUT /api/session/keep-alive',
          'GET /api/session/status'
        ],
        profileRoutes: [
          'GET /api/profile',
          'PUT /api/profile',
          'GET /api/profile/client/:clientId',
          'PUT /api/profile/client/:clientId'
        ],
        serviceRequests: {
          create: 'POST /api/service-requests',
          update: 'PATCH /api/service-requests/:id/status',
          client: 'GET /api/service-requests/client/:clientId',
          provider: 'GET /api/service-requests/provider/:providerId'
        }
    }
  });
});

// Error handling for 404 - Add this before error handler
app.use((req, res, next) => {
    res.status(404).json({
        error: `Cannot ${req.method} ${req.originalUrl}`,
        availableRoutes: {
            providers: [
                'GET /api/providers/nearby',
                'GET /api/providers/all'
            ]
        }
    });
});

// Debug logs
console.log('Routes initialized: /api/auth, /api/clients, /api/notifications, /api/areas, /api/location');

// Home route
app.get('/paypal/success', (req, res) => {
  const { token, PayerID } = req.query;
  res.send(`
    <html>
      <head>
        <title>Payment Success</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: #f7f7f7; 
            text-align: center; 
            padding-top: 60px;
            margin: 0;
          }
          .container { 
            background: #fff; 
            border-radius: 16px; 
            box-shadow: 0 2px 12px rgba(0,0,0,0.08); 
            display: inline-block; 
            padding: 32px 24px;
            margin: 0 16px;
            max-width: 400px;
          }
          .success-icon { 
            color: #27ae60; 
            font-size: 64px; 
            margin-bottom: 16px;
            animation: scaleIn 0.5s ease-out;
          }
          @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }
          .title { 
            font-size: 2rem; 
            font-weight: bold; 
            margin-bottom: 12px;
            color: #2d3436;
          }
          .desc { 
            font-size: 1.1rem; 
            color: #444; 
            margin-bottom: 24px;
          }
          .instructions { 
            color: #888; 
            font-size: 1rem; 
            margin-bottom: 24px;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">&#x2714;</div>
          <div class="title">Payment Successful!</div>
          <div class="desc">Thank you for your payment.</div>
          <div class="instructions">Redirecting back to app...</div>
        </div>
        <script>
          window.paymentData = { token: '${token}', PayerID: '${PayerID}' };
          function notifyFlutter() {
            if (window.PaymentChannel) {
              window.PaymentChannel.postMessage(JSON.stringify(window.paymentData));
            }
          }
          setTimeout(notifyFlutter, 1500);
        </script>
      </body>
    </html>
  `);
});

app.get('/paypal/cancel', (req, res) => {
  res.send('<html><body><h2>Payment Cancelled</h2></body></html>');
});

app.get('/', (req, res) => {
  res.send('Backend is up and running!');
});

// 📌 **Login Route**
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Query both collections in parallel
        const [client, provider] = await Promise.all([
            Client.findOne({ email }).select('+password').lean(),
            ServiceProvider.findOne({ email }).select('+password').lean()
        ]);

        const user = client || provider;
        const userType = client ? 'client' : 'provider';

        if (!user) {
            console.log('User not found:', email);
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Invalid password for:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, userType }, 
            process.env.JWT_SECRET || 'your-fallback-secret',
            { expiresIn: '24h' }
        );

        // Remove sensitive data
        delete user.password;

        console.log('Login successful for:', email);
        res.json({ success: true, token, userType, user });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// 📌 **New Route: Create a New Service Provider**
app.post('/api/providers', async (req, res) => {
    const { businessName, email, password, phoneNumber, businessAddress, serviceOffered, experience, skills, serviceAreas, idNumber, driverLicenseNumber, insurancePolicyNumber, insuranceProvider, profileImage, location } = req.body;

    // Validate required fields
    if (!businessName || !email || !password || !phoneNumber || !businessAddress || !serviceOffered || !location) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if the location has valid coordinates
    if (!location.coordinates || location.coordinates.length !== 2 || isNaN(location.coordinates[0]) || isNaN(location.coordinates[1])) {
        return res.status(400).json({ error: 'Invalid or missing coordinates in location' });
    }

    try {
        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new provider instance
        const newProvider = new ServiceProvider({
            businessName,
            email,
            password: hashedPassword, // Use hashed password
            phoneNumber,
            businessAddress,
            serviceOffered,
            experience,
            skills,
            serviceAreas,
            idNumber,
            driverLicenseNumber,
            insurancePolicyNumber,
            insuranceProvider,
            profileImage,
            location
        });

        // Save the provider to the database
        await newProvider.save();

        // Respond with success
        res.json({ message: 'Provider created successfully', provider: newProvider });
    } catch (err) {
        // Handle any errors that occur during the process
        res.status(500).json({ error: 'Failed to create provider', details: err.message });
    }
});

// 📌 **Socket.IO: Handle Incoming Connections**
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle the provider's unique connection by their providerId (if needed)
    socket.on('registerProvider', (providerId) => {
        // Register the provider's socket id
        socket.providerId = providerId; // Attach providerId to the socket object
        console.log(`Provider ${providerId} registered with socket ID ${socket.id}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    socket.on('booking_status_update', async (data) => {
      try {
        const { bookingId, status, providerId } = data;
        
        // Update booking in database
        const booking = await Booking.findById(bookingId);
        if (booking && booking.providerId.toString() === providerId) {
          booking.status = status;
          booking.lastUpdated = new Date();
          await booking.save();

          // Broadcast update to all clients
          io.emit('booking_updated', {
            bookingId,
            status,
            providerId,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('WebSocket booking update error:', error);
        socket.emit('booking_update_error', { error: error.message });
      }
    });
});

// 📌 **New Route: Update Client Location**
app.post('/api/clients/update-location', async (req, res) => {
    const { clientId, newLocation } = req.body;

    if (!clientId || !newLocation || !newLocation.coordinates) {
        return res.status(400).json({ error: 'Client ID and new location with coordinates are required' });
    }

    try {
        // Find the client by ID
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Update the client's location
        client.location = newLocation;
        await client.save();

        // Respond with the updated client data
        res.json({ message: 'Client location updated successfully', client });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update client location', details: error.message });
    }
});

// 📌 **New Route: Get Nearby Service Providers for Client**
app.get('/api/clients/nearby-providers', async (req, res) => {
    const { clientId, radius = 5000 } = req.query; // Default radius is 5km

    if (!clientId) {
        return res.status(400).json({ error: 'Client ID is required' });
    }

    try {
        // Find the client and their location
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const { coordinates } = client.location;

        // Find providers nearby
        const nearbyProviders = await ServiceProvider.find({
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates },
                    $maxDistance: parseInt(radius), // radius in meters
                },
            },
        });

        res.json(nearbyProviders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch nearby providers', details: error.message });
    }
});

// Mount plumbing routes
app.use('/api/plumbing-services', plumbingRoutes);

// Add debug endpoint
app.get('/api/debug/plumbing-services', async (req, res) => {
  try {
    const services = await mongoose.connection.db.collection('plumbingservices').find({}).toArray();
    res.json({
      count: services.length,
      services
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this BEFORE the error handlers
app.get('/api/debug/provider-documents', (req, res) => {
  res.json({
    message: 'Provider Documents API is mounted',
    availableRoutes: {
      pending: 'GET /api/provider-documents/pending',
      upload: 'POST /api/provider-documents/upload',
      verify: 'PATCH /api/provider-documents/:id/verify',
      providerRoutes: [
        'GET /api/providers/:providerId/bookings',
        'GET /api/providers/:providerId/bookings/:status',
        'POST /api/providers/:providerId/location'
      ],
      bookingRoutes: [
        'GET /api/bookings',
        'POST /api/bookings',
        'PATCH /api/bookings/:bookingId'
      ]
    }
  });
});

// Add this after mounting the notifications route
app.use('/api/notifications', notificationRoutes);
console.log('Mounted notifications route at: /api/notifications');

// Test the route directly
app.get('/api/test-notifications', (req, res) => {
  res.json({
    message: 'Notifications route test',
    endpoints: {
      get: '/api/notifications',
      patch: '/api/notifications/:id/read'
    }
  });
});

// IMPORTANT: Comment out any duplicate routes and add debug logging
console.log('Setting up routes...');

// Add this BEFORE any other routes
app.use('/api/notifications', notificationRoutes);
console.log('✅ Mounted notifications route at: /api/notifications');

// Debug route to verify mounting
app.get('/api/debug/routes', (req, res) => {
  console.log('Available routes:', app._router.stack.map(r => r.route?.path).filter(Boolean));
  res.json({
    success: true,
    routes: {
      notifications: '/api/notifications',
      notificationsWithId: '/api/notifications/:id',
      notificationsRead: '/api/notifications/:id/read',
      sessionRoutes: [
        'POST /api/session/start',
        'POST /api/session/end',
        'PUT /api/session/keep-alive',
        'GET /api/session/status'
      ],
      profileRoutes: [
        'GET /api/profile',
        'PUT /api/profile',
        'GET /api/profile/client/:clientId',
        'PUT /api/profile/client/:clientId'
      ]
    }
  });
});

// Add this BEFORE any other routes and AFTER middleware
app.get('/api/debug/routes-test', (req, res) => {
  const routes = app._router.stack
    .filter(r => r.route)
    .map(r => ({
      path: r.route.path,
      methods: Object.keys(r.route.methods)
    }));
  
  res.json({
    success: true,
    message: 'Route debugging information',
    totalRoutes: routes.length,
    routes: routes,
    notificationRoutePresent: routes.some(r => r.path.includes('notifications'))
  });
});

// Remove the duplicate PATCH endpoint and add this version BEFORE any error handlers
app.patch('/api/bookings/:bookingId', async (req, res) => {
  try {
    console.log('📝 Booking update request received:', {
      bookingId: req.params.bookingId,
      body: req.body,
      headers: req.headers
    });

    const { bookingId } = req.params;
    const { status, providerId } = req.body;

    // Input validation
    if (!bookingId || !status || !providerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        received: { bookingId, status, providerId }
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        bookingId
      });
    }

    // Update booking
    booking.status = status;
    booking.lastUpdated = new Date();
    await booking.save();

    // Notify via WebSocket
    io.emit('booking_updated', {
      bookingId,
      status,
      providerId,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Booking ${bookingId} updated to ${status}`);

    return res.json({
      success: true,
      message: `Booking ${status} successfully`,
      booking: booking.toJSON()
    });

  } catch (error) {
    console.error('❌ Booking update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update booking',
      details: error.message
    });
  }
});

// Move this before any error handlers and after the PATCH endpoint
app.use('/api/bookings', bookingRoutes);

// Update the booking routes section - add before error handlers
app.patch('/api/bookings/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, providerId } = req.body;

    console.log('Received booking update:', { bookingId, status, providerId });

    // Input validation
    if (!bookingId || !status || !providerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bookingId, status, and providerId are required',
        received: { bookingId, status, providerId }
      });
    }

    // Validate status value
    const validStatuses = ['accepted', 'rejected', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find and update the booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        bookingId
      });
    }

    // Verify provider
    if (booking.providerId.toString() !== providerId) {
      return res.status(403).json({
        success: false,
        error: 'Provider not authorized to update this booking'
      });
    }

    // Update booking
    booking.status = status;
    booking.lastUpdated = new Date();
    await booking.save();

    // Emit WebSocket event
    io.emit('booking_updated', {
      bookingId,
      status,
      providerId,
      timestamp: new Date().toISOString()
    });

    console.log(`Booking ${bookingId} updated successfully to ${status}`);

    return res.json({
      success: true,
      message: `Booking ${status} successfully`,
      booking: booking.toJSON()
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update booking status',
      details: error.message
    });
  }
});

// Move this PATCH endpoint BEFORE the error handlers and AFTER initial middleware
app.patch('/api/bookings/:bookingId', async (req, res) => {
  try {
    console.log('Booking update request:', {
      bookingId: req.params.bookingId,
      body: req.body,
      headers: req.headers
    });

    const { bookingId } = req.params;
    const { status, providerId } = req.body;

    // Input validation
    if (!bookingId || !status || !providerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        received: { bookingId, status, providerId }
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        bookingId
      });
    }

    // Update booking
    booking.status = status;
    booking.lastUpdated = new Date();
    await booking.save();

    // Notify via WebSocket
    io.emit('booking_updated', {
      bookingId,
      status,
      providerId,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `Booking ${status} successfully`,
      booking
    });

  } catch (error) {
    console.error('Booking update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update booking',
      details: error.message
    });
  }
});

// Update the routes debug endpoint to include the new booking route
app.get('/api/debug/routes', (req, res) => {
  res.json({
    success: true,
    routes: {
      bookings: [
        'GET /api/bookings',
        'POST /api/bookings',
        'PATCH /api/bookings/:bookingId'
      ],
      providers: [
        'GET /api/providers/nearby',
        'GET /api/providers/all'
      ],
      sessionRoutes: [
        'POST /api/session/start',
        'POST /api/session/end',
        'PUT /api/session/keep-alive',
        'GET /api/session/status'
      ],
      profileRoutes: [
        'GET /api/profile',
        'PUT /api/profile',
        'GET /api/profile/client/:clientId',
        'PUT /api/profile/client/:clientId'
      ],
      serviceRequests: {
        create: 'POST /api/service-requests',
        update: 'PATCH /api/service-requests/:id/status',
        client: 'GET /api/service-requests/client/:clientId',
        provider: 'GET /api/service-requests/provider/:providerId'
      }
    }
  });
});

// Add provider documents routes before error handlers
app.use('/api/provider-documents', providerDocumentsRoutes);

// Add debug route to verify document routes
app.get('/api/debug/document-routes', (req, res) => {
  res.json({
    success: true,
    routes: {
      documents: [
        'GET /api/provider-documents/:providerId',
        'POST /api/provider-documents/upload',
        'PATCH /api/provider-documents/:documentId/verify'
      ]
    }
  });
});

// Add debug logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`, {
    body: req.body,
    query: req.query,
    params: req.params,
  });
  next();
});

// Mount service request routes (add this before other routes)
app.use('/api/service-requests', serviceRequestRoutes);

// Debug route to verify service request routes
app.get('/api/debug/routes/service-requests', (req, res) => {
  res.json({
    success: true,
    message: 'Service request routes mounted',
    endpoints: {
      create: 'POST /api/service-requests',
      update: 'PATCH /api/service-requests/:id/status',
      getClient: 'GET /api/service-requests/client/:clientId',
      getProvider: 'GET /api/service-requests/provider/:providerId'
    }
  });
});

// Add debug route for admin endpoints
app.get('/api/admin/debug/routes', (req, res) => {
  res.json({
    success: true,
    routes: {
      clients: {
        block: ['POST /api/admin/clients/block', 'POST /api/admin/clients/block/:clientId'],
        unblock: ['POST /api/admin/clients/unblock/:clientId'],
        blocked: ['GET /api/admin/clients/blocked']
      }
    }
  });
});

// Error Handlers - SINGLE INSTANCE
// Health check endpoint - NO AUTH REQUIRED
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
app.use(errorHandler);
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

// Final 404 Handler - SINGLE INSTANCE
app.use((req, res) => {
    res.status(404).json({
        error: `Cannot ${req.method} ${req.originalUrl}`,
        availableRoutes: {
            auth: ['/api/auth/*'],
            providers: ['/api/providers/*'],
            clients: ['/api/clients/*']
        }
    });
});

// MongoDB Connection - SINGLE INSTANCE
mongoose.connect(MONGODB_URI, MONGODB_OPTIONS).catch(console.error);

// Keep server startup at bottom
const startServer = async () => {
    let isConnected = false;
    const MAX_RETRIES = 5;
    const RETRY_INTERVAL = 5000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`\n📡 MongoDB connection attempt ${attempt}/${MAX_RETRIES}`);
        try {
            await mongoose.connect(MONGODB_URI, {
                ...MONGODB_OPTIONS,
                autoIndex: true // Enable this for development
            });
            isConnected = true;
            console.log('✅ MongoDB connected successfully');
            break;
        } catch (error) {
            console.error(`❌ MongoDB connection attempt ${attempt} failed:`, error.message);
            if (attempt === MAX_RETRIES) {
                console.error('\n🚫 Maximum retries reached. Server startup failed.');
                console.error('\nPossible solutions:');
                console.error('1. Verify MongoDB is running: mongod --version');
                console.error('2. Check MongoDB connection string:', MONGODB_URI);
                console.error('3. Verify port 27017 is not blocked');
                console.error('4. Check MongoDB logs for errors');
                process.exit(1);
            }
            console.log(`Retrying in ${RETRY_INTERVAL/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
        }
    }

    if (!isConnected) return;

    // Start HTTP server
    server.listen(PORT, '0.0.0.0', () => {
        const networkInterfaces = os.networkInterfaces();
        const addresses = Object.values(networkInterfaces)
            .flat()
            .filter(iface => !iface.internal && iface.family === 'IPv4')
            .map(iface => iface.address);

        console.log('\n🚀 Server is running and accessible at:');
        console.log(`- Local:            http://localhost:${PORT}`);
        console.log(`- Network IPs:      ${addresses.map(ip => `http://${ip}:${PORT}`).join('\n                  ')}`);
        console.log(`- Android Emulator: http://10.0.2.2:${PORT}`);
        console.log('\n💾 MongoDB Status: Connected');
        console.log(`📡 MongoDB URL: ${MONGODB_URI}\n`);
    });
};

// Update mongoose connection handlers
mongoose.connection.on('error', (err) => {
  console.error('🔴 MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('🟡 MongoDB disconnected, attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('🟢 MongoDB reconnected');
});

mongoose.connection.on('connected', () => {
  console.log('💾 MongoDB Status: Connected');
  console.log('📡 MongoDB URL:', process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/home_service_db');
  
  // Debug model registration
  console.log('Registered Models:', mongoose.modelNames());
});

// REMOVE ALL OTHER server.listen() calls
// REMOVE ALL OTHER startServer() or initializeServer() functions
// REMOVE duplicate CORS configurations
// REMOVE duplicate error handlers

// Keep only these at the very bottom of the file
export { app, server, io };

startServer().catch(console.error);

// Health check endpoint - NO AUTH REQUIRED
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('authenticate', (token) => {
    // Add auth logic here if needed
    console.log('🔐 Socket authenticated:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// --- Real-time client/provider online status tracking ---
io.on('connection', (socket) => {
  console.log('🔌 New socket connected:', socket.id);

  // Listen for client registration (clientId)
  socket.on('registerClient', (clientId) => {
    realtimeManager.registerClient(clientId, socket);
    console.log(`[RealtimeManager] Client ${clientId} registered for real-time tracking.`);
  });

  // Listen for provider registration (providerId)
  socket.on('registerProvider', (providerId) => {
    realtimeManager.registerProvider(providerId, socket);
    console.log(`[RealtimeManager] Provider ${providerId} registered for real-time tracking.`);
  });

  socket.on('disconnect', () => {
    // Handled by RealtimeManager
    console.log(`[RealtimeManager] Socket ${socket.id} disconnected.`);
  });
});

// Update the PayPal route configuration
app.post('/api/payments/paypal/initiate', async (req, res) => {
  try {
    const { paymentId, amount, bookingId, clientId, providerId } = req.body;
    
    console.log('[PayPal] Received payWithPaypal request:', {
      paymentId, amount, bookingId, clientId, providerId
    });

    // Use PayPal configuration from config file
    const { returnUrl, cancelUrl } = paypalConfig;

    // Create PayPal order
    const order = await paypal.createOrder({
      amount,
      returnUrl: paypalConfig.returnUrl,
      cancelUrl: paypalConfig.cancelUrl,
      paymentId,
      bookingId,
      clientId,
      providerId
    });

    console.log('[PayPal] Payment initiation result:', {
      success: true,
      transactionRef: order.id,
      approvalUrl: order.approvalUrl,
      message: 'Redirect client to PayPal for payment.'
    });

    res.json({
      success: true,
      approvalUrl: order.approvalUrl,
      orderId: order.id
    });

  } catch (error) {
    console.error('[PayPal] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PayPal Webhook endpoint
app.post('/api/webhooks/paypal/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('[PayPal Webhook] Event received:', event);

    // Handle payment completed events
    if (event.event_type === 'CHECKOUT.ORDER.APPROVED' || event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = event.resource.id;
      const payerId = event.resource.payer?.payer_id;
      const amount = event.resource.purchase_units?.[0]?.amount?.value;
      const currency = event.resource.purchase_units?.[0]?.amount?.currency_code;

      // Find the payment/booking in your DB using orderId
      // Example: Assume you have a Payment model
      const payment = await Payment.findOne({ paypalOrderId: orderId });
      if (!payment) {
        console.warn('[PayPal Webhook] No payment found for order:', orderId);
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Update payment status to 'completed'
      payment.status = 'completed';
      await payment.save();

      // Find the related booking and client
      const booking = await Booking.findById(payment.bookingId);
      if (!booking) {
        console.warn('[PayPal Webhook] No booking found for payment:', payment._id);
      }
      const clientId = payment.clientId || (booking ? booking.clientId : null);

      // Create payment success notification for the client
      const notification = await Notification.create({
        type: 'payment_success',
        title: 'Payment Successful',
        message: `Payment of ${currency} ${amount} completed successfully`,
        userId: clientId,
        data: {
          bookingId: booking ? booking._id : null,
          paymentId: payment._id,
          orderId,
          payerId,
          amount,
          currency
        }
      });

      // Emit notification instantly via WebSocket
      if (clientId && io) {
        io.emit('notification', {
          userId: clientId,
          notification
        });
      }

      console.log('[PayPal Webhook] Payment completed for order:', orderId);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[PayPal Webhook] Error:', error);
    res.status(500).json({ error: error.message });
  }
});
