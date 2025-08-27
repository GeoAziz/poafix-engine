const User = require('../../models/user');
const Job = require('../../models/job');

class ActivityHandler {
  constructor(wss) {
    this.wss = wss;
    this.updateInterval = 10000; // 10 seconds
  }

  async broadcastActivityUpdates() {
    try {
      const recentActivities = await this.getRecentActivities();
      
      this.wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'activity_update',
            data: recentActivities
          }));
        }
      });
    } catch (error) {
      console.error('Activity broadcast error:', error);
    }
  }

  async getRecentActivities() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return await Job.aggregate([
      {
        $match: {
          updatedAt: { $gte: fiveMinutesAgo }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          type: '$status',
          userName: { $arrayElemAt: ['$user.name', 0] },
          timestamp: '$updatedAt'
        }
      }
    ]);
  }
}

module.exports = ActivityHandler;
