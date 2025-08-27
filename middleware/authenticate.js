const jwt = require('jsonwebtoken');
require('dotenv').config();  // Load environment variables from .env file

// Fetch JWT secret key from environment variables
const secretKey = process.env.JWT_SECRET;  // Use JWT_SECRET from your .env file

if (!secretKey) {
  throw new Error('JWT_SECRET is not defined in the .env file');
}

// Middleware function to authenticate requests
const authenticate = (req, res, next) => {
  // Get the token from the Authorization header (usually prefixed with "Bearer ")
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, secretKey);

    // Add the decoded user information to the request object
    req.user = decoded;

    // Call the next middleware or route handler
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = authenticate;
