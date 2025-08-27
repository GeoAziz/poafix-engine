// ...existing imports and middleware...

// Add health check endpoint before other routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ...existing routes and code...