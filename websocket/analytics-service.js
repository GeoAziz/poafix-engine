import { Job, User, Provider } from '../models/index.js';

class AnalyticsService {
  constructor(wss) {
    this.wss = wss;
    this.updateInterval = 5000; // 5 seconds
    this.start();
  }

  async getRealtimeStats() {
    const activeUsers = await User.countDocuments({ lastActive: { 
      $gte: new Date(Date.now() - 15 * 60 * 1000) 
    }});
    
    const pendingJobs = await Job.countDocuments({ status: 'pending' });
    const todayRevenue = await this.getTodayRevenue();

    return {
      activeUsers,
      pendingJobs,
      todayRevenue,
      timestamp: new Date()
    };
  }

  async getTodayRevenue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Job.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    return result[0]?.total || 0;
  }

  broadcastUpdate() {
    this.getRealtimeStats().then(stats => {
      this.wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'analytics_update',
            data: stats
          }));
        }
      });
    });
  }

  start() {
    this.interval = setInterval(() => this.broadcastUpdate(), this.updateInterval);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

export default AnalyticsService;
