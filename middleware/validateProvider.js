export const validateProvider = (req, res, next) => {
  const {
    name,
    email,
    password,
    phoneNumber,
    businessName,
    serviceType
  } = req.body;

  const errors = [];

  if (!name) errors.push('Name is required');
  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');
  if (!phoneNumber) errors.push('Phone number is required');
  if (!businessName) errors.push('Business name is required');
  if (!serviceType) errors.push('Service type is required');

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      errors
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  if (req.body.userType && req.body.userType !== 'service-provider') {
    return res.status(400).json({
      success: false,
      message: 'Invalid userType. Must be "service-provider".'
    });
  }

  next();
};
