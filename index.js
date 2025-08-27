import { app, server } from './server.js';

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint - add before other routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'poafix-backend',
    version: '1.0.0'
  });
});

// ...existing routes and middleware...

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`- Local:            http://localhost:${PORT}`);
  console.log(`- Android Emulator: http://10.0.2.2:${PORT}`);
});