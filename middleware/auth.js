import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  try {
    // Accept both 'Authorization' and 'auth' headers
    let authHeader = req.headers.authorization;
    if (!authHeader && req.headers.auth) {
      authHeader = `Bearer ${req.headers.auth}`;
    }
    console.log('Auth check:', {
      hasAuth: !!authHeader,
      path: req.path,
      userType: req.headers['user-type']
    });

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'No bearer token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret', (err, decoded) => {
      if (err) {
        console.error('Token verification failed:', err.message);
        return res.status(403).json({ 
          success: false, 
          error: 'Invalid token' 
        });
      }

      // Attach decoded user info to request
      req.user = {
        userId: decoded.id || decoded.userId,
        role: decoded.role,
        userType: decoded.userType || req.headers['user-type']
      };

      console.log('Auth successful:', req.user);
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Default export
const auth = { authenticateToken, isAdmin };
export default auth;
