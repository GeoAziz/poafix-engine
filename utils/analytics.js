const Job = require('../models/job');
const User = require('../models/user');
const Provider = require('../models/provider');

class AnalyticsUtil {
  static async generateRevenueReport(startDate, endDate) {
    return await Job.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
  }

  static async getUserMetrics(days = 30) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return await User.aggregate([
      {
        $match: {
          createdAt: { $gte: date }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
  }

  static async getServiceMetrics() {
    return await Provider.aggregate([
      {
        $group: {
          _id: "$serviceType",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" }
        }
      }
    ]);
  }
}

module.exports = AnalyticsUtil;
