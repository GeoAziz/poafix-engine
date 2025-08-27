// Dashboard stats endpoint
import * as dashboardService from '../services/dashboardService.js';

export async function getDashboardStats(req, res) {
  try {
    const providerId = req.params.providerId;
    const stats = await dashboardService.getProviderDashboardStats(providerId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
// Update provider's serviceOffered array
export const updateProviderServices = async (req, res) => {
  try {
    const providerId = req.params.id;
    const { serviceOffered } = req.body;
    // Validate: serviceOffered should be an array of objects
    if (!Array.isArray(serviceOffered)) {
      return res.status(400).json({ error: 'serviceOffered must be an array' });
    }
    // Optionally, validate each item is an object with at least a name
    const valid = serviceOffered.every(s => typeof s === 'object' && s.name);
    if (!valid) {
      return res.status(400).json({ error: 'Each service must be an object with a name' });
    }
    const updated = await Provider.findByIdAndUpdate(
      providerId,
      { serviceOffered },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json({ success: true, data: updated.serviceOffered });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
import { Provider } from '../models/provider.model.js';
import { Booking } from '../models/booking.model.js';
import { ServiceArea } from '../models/serviceArea.js';  // Updated import path
import { Certification } from '../models/certification.model.js';
import Review from '../models/Review.js';
import { Availability } from '../models/Availability.js';

export const updateLocation = async (req, res) => {
  try {
    // Accept both { coordinates } and { location: { coordinates } }
    let coordinates = req.body.coordinates;
    if (!coordinates && req.body.location && req.body.location.coordinates) {
      coordinates = req.body.location.coordinates;
    }
    const isAvailable = req.body.isAvailable;
    const providerId = req.params.id || req.user?.userId;

    console.log('Updating location for provider:', providerId);
    console.log('Coordinates:', coordinates);
    console.log('isAvailable:', isAvailable);

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates format'
      });
    }

    const [longitude, latitude] = coordinates;

    const updatedProvider = await Provider.findByIdAndUpdate(
      providerId,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        isAvailable: isAvailable,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!updatedProvider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: updatedProvider.location,
        isAvailable: updatedProvider.isAvailable
      }
    });

  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
};

export const getNearbyProviders = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000, serviceOffered } = req.query;
    
    console.log('[Controller] Finding providers with params:', {
      latitude, longitude, radius, serviceOffered
    });

    const providers = await ServiceProvider.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: 'distance',
          maxDistance: parseFloat(radius),
          spherical: true,
          query: {
            $and: [
              {
                $or: [
                  { serviceType: serviceOffered },
                  { serviceOffered: serviceOffered }
                ]
              },
              {
                $or: [
                  { isAvailable: true },
                  { available: true }
                ]
              }
            ]
          }
        }
      },
      {
        $project: {
          password: 0,
          __v: 0,
          // Normalize fields to match frontend expectations
          businessName: 1,
          name: 1,
          rating: 1,
          location: 1,
          isAvailable: { 
            $cond: { 
              if: { $eq: ["$isAvailable", null] }, 
              then: "$available", 
              else: "$isAvailable" 
            } 
          },
          _id: 1,
          phoneNumber: 1,
          email: 1,
          address: 1,
          pricing: 1,
          distance: 1
        }
      }
    ]);

    console.log(`[Controller] Found ${providers.length} providers`);
    
    return res.status(200).json({
      success: true,
      providers: providers
    });

  } catch (error) {
    console.error('[Controller] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllProviders = async (req, res) => {
  // Implement get all providers logic
  res.json({ message: 'Get all providers' });
};

export const getProviderBookings = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { status } = req.query;

    console.log('Get provider bookings:', {
      providerId,
      requestUser: req.user,
      status
    });

    // Accept both userId and id in JWT payload for provider
    if (!req.user || (req.user.id !== providerId && req.user.userId !== providerId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to provider bookings'
      });
    }

    // Build query
    let query = { providerId: providerId };
    if (status) {
      query.status = status;
    }

    // Get bookings with populated client data
    const bookings = await Booking.find(query)
      .populate('client', 'name email phoneNumber')
      .sort({ createdAt: -1 });

    console.log(`Found ${bookings.length} bookings for provider ${providerId}`);

    // Format response
    res.json({
      success: true,
      count: bookings.length,
      bookings: bookings.map(booking => ({
        _id: booking._id,
        client: booking.client,
        serviceType: booking.serviceType,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        amount: booking.amount,
        location: booking.location,
        payment: booking.payment,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};
  // Get upcoming appointments for provider
  export const getUpcomingAppointments = async (req, res) => {
    try {
      const providerId = req.params.providerId;
      // Find bookings with status and future schedule
      const upcoming = await Booking.find({
        providerId,
        status: { $in: ['pending', 'accepted', 'in_progress', 'confirmed'] },
        schedule: { $gte: new Date() }
      })
        .populate('clientId', 'name email phoneNumber')
        .sort({ schedule: 1 });
      res.json({
        success: true,
        count: upcoming.length,
        appointments: upcoming.map(b => ({
          _id: b._id,
          client: b.clientId,
          serviceType: b.serviceType,
          status: b.status,
          schedule: b.schedule,
          address: b.address,
          description: b.description
        }))
      });
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch upcoming appointments', error: error.message });
    }
  };

  // Get recent activities for provider
  export const getRecentActivities = async (req, res) => {
    try {
      const providerId = req.params.providerId;
      // Find completed/cancelled bookings
      const recentBookings = await Booking.find({
        providerId,
        status: { $in: ['completed', 'cancelled'] }
      })
        .populate('clientId', 'name email phoneNumber')
        .sort({ updatedAt: -1 })
        .limit(10);

      // Find recent jobs (if needed)
      // const recentJobs = await Job.find({ providerId, status: { $in: ['completed', 'cancelled'] } })
      //   .populate('clientId', 'name email phoneNumber')
      //   .sort({ updatedAt: -1 })
      //   .limit(10);

      res.json({
        success: true,
        count: recentBookings.length,
        activities: recentBookings.map(b => ({
          _id: b._id,
          client: b.clientId,
          serviceType: b.serviceType,
          status: b.status,
          schedule: b.schedule,
          address: b.address,
          description: b.description,
          updatedAt: b.updatedAt
        }))
      });
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch recent activities', error: error.message });
    }
  };

export const getProviderProfile = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    // If serviceOffered contains strings, convert to objects
    let offered = provider.serviceOffered || [];
    offered = offered.map(s =>
      typeof s === 'string'
        ? { name: s, description: '', price: '', duration: '' }
        : s
    );
    res.json({ data: { ...provider.toObject(), serviceOffered: offered } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Provider updates booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const providerId = req.user.id || req.user.userId;
    // Only allow valid status transitions
  const allowedStatuses = ['pending', 'accepted', 'rejected', 'cancelled', 'completed', 'in_progress'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    // Find booking and verify provider
    const booking = await Booking.findOne({ _id: bookingId, providerId });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found or not authorized' });
    }
    booking.status = status;
    await booking.save();
    return res.json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
