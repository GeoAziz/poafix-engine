const Provider = require('../models/provider');
const Job = require('../models/job');
const User = require('../models/user');

exports.getRealTimeMetrics = async (req, res) => {
  try {
    const [activeUsers, pendingJobs, activeProviders] = await Promise.all([
      User.countDocuments({ 
        lastActive: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
      }),
      Job.countDocuments({ status: 'pending' }),
      Provider.countDocuments({ status: 'active' })
    ]);

    res.json({
      activeUsers,
      pendingJobs,
      activeProviders,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
