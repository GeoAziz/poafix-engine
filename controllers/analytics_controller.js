const AnalyticsUtil = require('../utils/analytics');
const Provider = require('../models/provider');
const Job = require('../models/job');

exports.getProviderPerformance = async (req, res) => {
  try {
    const providerStats = await Provider.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: 'providerId',
          as: 'jobs'
        }
      },
      {
        $project: {
          businessName: 1,
          rating: 1,
          jobsCompleted: {
            $size: {
              $filter: {
                input: '$jobs',
                as: 'job',
                cond: { $eq: ['$$job.status', 'completed'] }
              }
            }
          }
        }
      }
    ]);

    res.json(providerStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getServiceTypeDistribution = async (req, res) => {
  try {
    const distribution = await Provider.aggregate([
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
