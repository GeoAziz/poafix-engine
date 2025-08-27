const ErrorLog = require('../models/error_log');
const SystemMetric = require('../models/system_metric');

exports.getErrorMetrics = async (req, res) => {
  try {
    const [recentErrors, errorTrends, criticalIssues] = await Promise.all([
      ErrorLog.find().sort({ timestamp: -1 }).limit(10),
      getErrorTrends(),
      getCriticalIssues()
    ]);

    res.json({
      recentErrors,
      errorTrends,
      criticalIssues,
      summary: await getErrorSummary()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function getErrorTrends() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  return await ErrorLog.aggregate([
    {
      $match: { timestamp: { $gte: thirtyDaysAgo } }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
        },
        count: { $sum: 1 },
        criticalCount: {
          $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] }
        }
      }
    },
    { $sort: { "_id": 1 } }
  ]);
}
