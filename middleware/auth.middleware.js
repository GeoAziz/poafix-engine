import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    console.log('Auth headers:', req.headers);

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization header'
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request (use id and type for compatibility)
    req.user = {
      id: decoded.userId || decoded.id,
      type: decoded.userType === 'service-provider' ? 'Provider' : decoded.userType || decoded.role
    };
    // For controller compatibility
    req.userId = req.user.id;
    req.userType = req.user.type;

    console.log('Auth successful:', {
      id: req.user.id,
      type: req.user.type,
      userId: req.userId,
      userType: req.userType
    });

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      details: error.message
    });
  }
};

export default authMiddleware;
