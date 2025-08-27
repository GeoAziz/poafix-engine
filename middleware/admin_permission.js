const Admin = require('../models/admin');

module.exports = (requiredPermission) => async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.adminData.id);
    
    if (!admin) {
      return res.status(401).json({
        message: 'Admin not found'
      });
    }

    if (!admin.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        message: 'Insufficient permissions'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: 'Permission check failed',
      error: error.message
    });
  }
};
