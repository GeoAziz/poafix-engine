import { getProviderEarnings as earningsControllerGetProviderEarnings } from './earnings.controller.js';
import ProviderDocument from '../models/provider_document.js';

export const getProviderEarnings = async (req, res) => {
  try {
    const result = await earningsControllerGetProviderEarnings(req, res);
    // If the delegated controller already sent a response, do not send another
    if (!res.headersSent) {
      res.json(result);
    }
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

export const getProviderDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const documents = await ProviderDocument.find({ providerId: id });
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { 
  User, 
  Client, 
  ServiceProvider as Provider,  // Import ServiceProvider as Provider
  Job, 
  ServiceRequest, 
  Transaction,
  ClientReview 
} from '../models/index.js';
import { Booking } from '../models/booking.model.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Add admin authentication logic here
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDashboardData = async (req, res) => {
  try {
    // Count only active clients
  const activeClients = await User.countDocuments({ isActive: true });
    // Count only verified and available providers
    const activeProviders = await Provider.countDocuments({ isVerified: true, isAvailable: true });
    // Count jobs with status 'in_progress' only (Job model does not have 'active')
    const activeJobs = await Job.countDocuments({ status: 'in_progress' });
    // Sum revenue from all jobs
    const revenueAgg = await Job.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    res.json({
      activeClients,
      activeProviders,
      activeJobs,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const revenueData = await getRevenueAnalytics();
    const userGrowth = await getUserGrowthAnalytics();
    const serviceTypes = await getServiceTypeAnalytics();

    res.json({
      revenue: revenueData,
      userGrowth,
      serviceTypes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRevenueData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await Job.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getServiceTypeAnalytics = async (req, res) => {
  try {
    const data = await Provider.aggregate([
      {
        $group: {
          _id: "$serviceType",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" }
        }
      }
    ]);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateReport = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.body;
    let reportData;

    switch (reportType) {
      case 'revenue':
        reportData = await generateRevenueReport(startDate, endDate);
        break;
      case 'providers':
        reportData = await generateProvidersReport();
        break;
      case 'users':
        reportData = await generateUsersReport(startDate, endDate);
        break;
      default:
        throw new Error('Invalid report type');
    }

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Client Management
export const getAllClients = async (req, res) => {
  try {
    console.log('Fetching all clients...');
    const clients = await Client.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${clients.length} clients`);
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
};

export const blockClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { reason } = req.body;
    const adminId = req.user?._id;

    console.log('🔒 Block Client Request:', {
      clientId,
      reason,
      adminId,
      requestBody: req.body,
      requestParams: req.params,
      adminUser: req.user
    });

    if (!clientId) {
      console.error('❌ Missing clientId in request');
      return res.status(400).json({ 
        success: false, 
        message: 'Client ID is required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      console.error('❌ Invalid clientId format:', clientId);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid client ID format' 
      });
    }

    const client = await Client.findByIdAndUpdate(
      clientId,
      {
        isBlocked: true,
        blockReason: reason,
        blockedAt: new Date(),
        blockedBy: adminId
      },
      { new: true }
    );

    console.log('📝 Database update result:', client);

    if (!client) {
      console.error('❌ Client not found with ID:', clientId);
      return res.status(404).json({ 
        success: false, 
        message: 'Client not found' 
      });
    }

    try {
      // Create block notification
      const notification = await Notification.create({
        type: 'ACCOUNT_BLOCKED',
        title: 'Account Blocked',
        message: `Your account has been blocked. Reason: ${reason}`,
        recipient: clientId,
        recipientModel: 'client',
        data: {
          userId: clientId,
          reason,
          blockedBy: adminId
        }
      });

      console.log('📢 Notification created:', notification);
    } catch (notifError) {
      console.error('⚠️ Notification creation failed:', notifError);
      // Don't fail the whole request if notification fails
    }

    console.log('✅ Client blocked successfully:', client._id);
    
    res.json({
      success: true,
      message: 'Client blocked successfully',
      data: client
    });
  } catch (error) {
    console.error('❌ Block client error:', {
      error: error.message,
      stack: error.stack,
      clientId: req.params.clientId
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to block client',
      error: error.message 
    });
  }
};

export const unblockClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const adminId = req.user._id;

    const client = await Client.findByIdAndUpdate(
      clientId,
      {
        isBlocked: false,
        blockReason: null,
        blockedAt: null,
        blockedBy: null
      },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Create unblock notification
    await Notification.create({
      type: 'ACCOUNT_UNBLOCKED',
      title: 'Account Unblocked', 
      message: 'Your account has been unblocked',
      recipient: clientId,
      recipientModel: 'client',
      data: {
        userId: clientId,
        unblocked_by: adminId
      }
    });

    return res.json({
      success: true,
      message: 'Client unblocked successfully',
      client
    });
  } catch (error) {
    console.error('Error unblocking client:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const getActiveClients = async (req, res) => {
  try {
    console.log('Fetching active clients...');
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const clients = await Client.find({
      $or: [
        { isOnline: true },
        { "lastActive": { "$gte": fifteenMinutesAgo } }
      ]
    }).select('-password');
    
    console.log(`Found ${clients.length} active clients`);
    res.json(clients);
  } catch (error) {
    console.error('Error fetching active clients:', error);
    res.status(500).json({ message: 'Error fetching active clients', error: error.message });
  }
};

export const getBlockedClients = async (req, res) => {
  try {
    console.log('Fetching blocked clients...');
    const clients = await Client.find({
      isBlocked: true
    }).select('-password');
    
    console.log(`Found ${clients.length} blocked clients`);
    res.json(clients);
  } catch (error) {
    console.error('Error fetching blocked clients:', error);
    res.status(500).json({ message: 'Error fetching blocked clients', error: error.message });
  }
};

export const getRecentClients = async (req, res) => {
  try {
    console.log('Fetching recent clients...');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const clients = await Client.find({
      lastActive: { $gte: twentyFourHoursAgo }
    }).select('-password');
    
    console.log(`Found ${clients.length} recent clients`);
    res.json(clients);
  } catch (error) {
    console.error('Error fetching recent clients:', error);
    res.status(500).json({ message: 'Error fetching recent clients', error: error.message });
  }
};

// Add these new methods to handle client profile functionality
export const getClientProfile = async (req, res) => {
  try {
    const { clientId } = req.params;
    console.log('📊 Fetching profile for client:', clientId);

    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(clientId);

    // Get client data with proper population
    const client = await User.findById(objectId).select('-password').lean();

    if (!client) {
      console.log('❌ Client not found:', clientId);
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Use Booking model for actual bookings
    const [serviceRequests, reviews] = await Promise.all([
      Booking.find({ clientId: objectId })
        .sort({ createdAt: -1 })
        .populate('providerId', 'name')
        .lean(),
      ClientReview.find({ clientId: objectId })
        .sort({ createdAt: -1 })
        .populate('providerId', 'name')
        .lean()
    ]);

    console.log('📊 Found service requests:', serviceRequests.length);
    console.log('📊 Found reviews:', reviews.length);

    // Calculate statistics from actual data
    const stats = {
      totalRequests: serviceRequests.length,
      completedRequests: serviceRequests.filter(r => r.status === 'completed').length,
      averageRating: reviews.length > 0
        ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length
        : 0
    };

    console.log('📈 Profile stats:', stats);

    return res.status(200).json({
      success: true,
      data: {
        client,
        serviceRequests,
        reviews,
        stats
      }
    });
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Provider Management
export const getAllProviders = async (req, res) => {
  try {
    const providers = await Provider.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching providers', error: error.message });
  }
};

export const suspendProvider = async (id, reason) => {
  try {
    const provider = await Provider.findByIdAndUpdate(
      id,
      {
        isSuspended: true,
        suspensionReason: reason,
        suspendedAt: new Date()
      },
      { new: true }
    );

    if (!provider) {
      throw new Error('Provider not found');
    }

    return {
      success: true,
      message: 'Provider suspended successfully',
      provider
    };
  } catch (error) {
    console.error('Error in suspendProvider:', error);
    throw error;
  }
};

export const unsuspendProvider = async (id) => {
  try {
    const current = await Provider.findById(id);
    if (!current) {
      throw new Error('Provider not found');
    }
    console.log(`[DEBUG] Provider state before unsuspend: isSuspended=${current.isSuspended}`);

    // Always attempt to unsuspend, idempotent
    const provider = await Provider.findByIdAndUpdate(
      id,
      {
        isSuspended: false,
        $unset: {
          suspensionReason: "",
          suspendedAt: ""
        }
      },
      { new: true }
    );

    console.log(`[DEBUG] Provider state after unsuspend: isSuspended=${provider.isSuspended}`);

    return {
      success: true,
      message: 'Provider reactivated successfully',
      provider
    };
  } catch (error) {
    console.error('Error in unsuspendProvider:', error);
    throw error;
  }
};

export const getVerifiedProviders = async (req, res) => {
  try {
    console.log('Fetching verified providers...');
    const providers = await Provider.find({
      isVerified: true
    }).sort({ businessName: 1 });
    
    console.log(`Found ${providers.length} verified providers`);
    res.json(providers);
  } catch (error) {
    console.error('Error fetching verified providers:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getPendingProviders = async (req, res) => {
  try {
    console.log('Fetching pending providers...');
    const providers = await Provider.find({
      isVerified: false,
      isSuspended: false
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${providers.length} pending providers`);
    res.json(providers);
  } catch (error) {
    console.error('Error fetching pending providers:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getSuspendedProviders = async (req, res) => {
  try {
    console.log('Fetching suspended providers...');
    const providers = await Provider.find({
      isSuspended: true
    }).sort({ suspendedAt: -1 });
    
    console.log(`Found ${providers.length} suspended providers`);
    res.json(providers);
  } catch (error) {
    console.error('Error fetching suspended providers:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getTopRatedProviders = async (req, res) => {
  try {
    console.log('Fetching top rated providers...');
    const providers = await Provider.find({
      rating: { $gte: 4.5 },
      isVerified: true
    }).sort({ rating: -1 });
    
    console.log(`Found ${providers.length} top rated providers`);
    res.json(providers);
  } catch (error) {
    console.error('Error fetching top rated providers:', error);
    res.status(500).json({ error: error.message });
  }
};
