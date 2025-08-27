const SystemMetric = require('../models/system_metric');
const os = require('os');

exports.getSystemMetrics = async (req, res) => {
  try {
    const metrics = {
      cpu: os.loadavg()[0],
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      uptime: os.uptime(),
    };

    const dbMetrics = await SystemMetric.find()
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      current: metrics,
      historical: dbMetrics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logMetric = async (req, res) => {
  try {
    const { endpoint, responseTime, statusCode } = req.body;
    
    const metric = new SystemMetric({
      endpoint,
      responseTime,
      statusCode,
      timestamp: new Date()
    });

    await metric.save();
    res.status(201).json(metric);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
