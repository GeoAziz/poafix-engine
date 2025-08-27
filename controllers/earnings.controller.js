import Earning from '../models/earning.model.js';
import Payout from '../models/payout.model.js';
import { Transaction } from '../models/transaction.js';
import mongoose from 'mongoose';

export const getProviderEarnings = async (req, res) => {
  try {
    const { id } = req.params;
    const objectId = new mongoose.Types.ObjectId(id);
    console.log('[DEBUG] Querying Earning with providerId:', objectId);
    const earnings = await Earning.findOne({ providerId: objectId });
    console.log('[DEBUG] Earnings found:', earnings);
    if (!earnings) {
      return res.status(404).json({
        success: false,
        error: 'Earnings record not found'
      });
    }
    res.json({
      success: true,
      data: earnings
    });
  } catch (error) {
    console.error('[DEBUG] Error in getProviderEarnings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getPayoutHistory = async (req, res) => {
  try {
    const { providerId } = req.params;
    const payouts = await Payout.find({ providerId }).sort('-createdAt');

    res.json({
      success: true,
      data: payouts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getEarningsStats = async (req, res) => {
  try {
    const { providerId } = req.params;
    const stats = await Transaction.aggregate([
      { $match: { providerId: providerId, status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalEarnings: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const requestPayout = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { amount, paymentMethod } = req.body;

    const payout = new Payout({
      providerId,
      amount,
      paymentMethod,
      reference: `PYT${Date.now()}`
    });

    await payout.save();

    res.status(201).json({
      success: true,
      data: payout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
