import ServiceHistory from '../models/serviceHistory.model.js';
import { Booking } from '../models/booking.model.js';

export const getServiceHistory = async (req, res) => {
  try {
    const { userId, serviceType, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (userId) query.userId = userId;
    if (serviceType) query.serviceType = serviceType;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.serviceDate = {};
      if (startDate) query.serviceDate.$gte = new Date(startDate);
      if (endDate) query.serviceDate.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    const history = await ServiceHistory.find(query)
      .sort({ completedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('providerId', 'businessName')
      .populate('clientId', 'name');
    
    const total = await ServiceHistory.countDocuments(query);
    
    res.json({
      success: true,
      data: history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getServiceHistoryById = async (req, res) => {
  try {
    const { historyId } = req.params;
    const history = await ServiceHistory.findById(historyId)
      .populate('providerId', 'businessName email phoneNumber')
      .populate('clientId', 'name email phoneNumber');
    
    if (!history) {
      return res.status(404).json({
        success: false,
        error: 'Service history not found'
      });
    }
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createServiceHistory = async (req, res) => {
  try {
    const historyData = req.body;
    const history = new ServiceHistory(historyData);
    await history.save();
    
    res.status(201).json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getServiceHistoryAnalytics = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    
    const matchQuery = {};
    if (userId) matchQuery.userId = userId;
    if (startDate || endDate) {
      matchQuery.completedDate = {};
      if (startDate) matchQuery.completedDate.$gte = new Date(startDate);
      if (endDate) matchQuery.completedDate.$lte = new Date(endDate);
    }
    
    const analytics = await ServiceHistory.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalServices: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageRating: { $avg: '$rating' },
          completedServices: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledServices: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const serviceTypeBreakdown = await ServiceHistory.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: analytics[0] || {},
        serviceTypes: serviceTypeBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};