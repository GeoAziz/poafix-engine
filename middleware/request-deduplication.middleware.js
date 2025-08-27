const requestCache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

export const requestDeduplicationMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'];

  if (!requestId) {
    console.warn('⚠️ Request received without X-Request-Id header');
    // Don't block the request, just log a warning
    return next();
  }

  // Store request ID with timestamp
  const now = Date.now();
  const key = `${req.path}:${requestId}`;
  
  // Check if request is duplicate (within 5 second window)
  if (requestCache.has(key)) {
    const lastRequest = requestCache.get(key);
    if (now - lastRequest < 5000) { // 5 second window
      console.warn('🔄 Duplicate request detected:', key);
      return res.status(429).json({
        success: false,
        error: 'Duplicate request',
        details: 'Please wait before retrying'
      });
    }
  }

  // Store new request
  requestCache.set(key, now);
  
  // Clean old entries every minute
  if (now - lastCleanup > 60000) {
    cleanupCache();
    lastCleanup = now;
  }

  next();
};

const cleanupCache = () => {
  const now = Date.now();
  for (const [key, timestamp] of requestCache.entries()) {
    if (now - timestamp > CACHE_TTL) {
      requestCache.delete(key);
    }
  }
};
