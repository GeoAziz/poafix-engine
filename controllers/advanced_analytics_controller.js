const Provider = require('../models/provider');
const Job = require('../models/job');
const User = require('../models/user');
const mongoose = require('mongoose');

exports.getAdvancedMetrics = async (req, res) => {
  try {
    const [userRetention, servicePopularity, revenueGrowth] = await Promise.all([
      calculateUserRetention(),
      calculateServicePopularity(),
      calculateRevenueGrowth()
    ]);

    res.json({
      userRetention,
      servicePopularity,
      revenueGrowth,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function calculateUserRetention() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  return await User.aggregate([
    {
      $match: { createdAt: { $gte: thirtyDaysAgo } }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        newUsers: { $sum: 1 },
        returnedUsers: {
          $sum: {
            $cond: [{ $gt: ["$lastLoginDate", "$createdAt"] }, 1, 0]
          }
        }
      }
    },
    { $sort: { "_id": 1 } }
  ]);
}
