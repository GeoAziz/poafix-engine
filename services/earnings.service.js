import Earning from '../models/earning.model.js';
import Transaction from '../models/transaction.js';
import Payout from '../models/payout.model.js';

class EarningsService {
  async calculateEarnings(providerId) {
    try {
      const transactions = await Transaction.aggregate([
        { 
          $match: { 
            providerId, 
            status: 'completed' 
          }
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$amount' },
            totalTransactions: { $sum: 1 }
          }
        }
      ]);

      const payouts = await Payout.aggregate([
        {
          $match: {
            providerId,
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalPayouts: { $sum: '$amount' }
          }
        }
      ]);

      const total = transactions[0]?.totalEarnings || 0;
      const paidOut = payouts[0]?.totalPayouts || 0;
      const available = total - paidOut;

      return {
        totalEarnings: total,
        availableBalance: available,
        totalPayouts: paidOut
      };
    } catch (error) {
      console.error('Error calculating earnings:', error);
      throw error;
    }
  }
}

export default new EarningsService();
