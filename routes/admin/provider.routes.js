import express from 'express';
import { Provider } from '../../models/provider.model.js';
import { ServiceArea } from '../../models/serviceArea.js';
import { Certification } from '../../models/certification.model.js'; // Add this import
import { adminAuthMiddleware } from '../../middleware/admin-auth.middleware.js';

const router = express.Router();

// Get provider profile
router.get('/:id/profile', adminAuthMiddleware, async (req, res) => {
  try {
    console.log('Fetching provider profile for:', req.params.id);
    
    const [provider, serviceAreas, certifications] = await Promise.all([
      Provider.findById(req.params.id)
        .populate('serviceAreas')
        .populate('certifications')
        .populate({
          path: 'reviews.clientId',
          model: 'Client',
          select: 'name profileImage'
        }),
      ServiceArea.find({ providerId: req.params.id }),
      Certification.find({ providerId: req.params.id })
    ]);

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    console.log('Found service areas:', serviceAreas);
    console.log('Found certifications:', certifications);

    // Calculate working hours availability with default values
    const now = new Date();
    const defaultHours = { start: '09:00', end: '17:00' };
    const todayHours = provider.workingHours?.default || defaultHours;
    const exceptionForToday = provider.workingHours?.exceptions?.find(
      e => e.date && e.date.toDateString() === now.toDateString()
    );

    // Format the response
    const formattedProvider = {
      ...provider.toObject(),
      serviceAreas,
      certifications,
      workingStatus: {
        isInWorkingHours: checkIfInWorkingHours(exceptionForToday || todayHours),
        todayHours: exceptionForToday || todayHours
      },
      statistics: {
        totalJobs: provider.servicesCompleted || 0,
        averageRating: provider.rating || 0,
        responseRate: '95%', // You can calculate this based on actual data
        completionRate: '98%' // You can calculate this based on actual data
      }
    };

    console.log('Provider data:', {
      serviceAreasCount: serviceAreas.length,
      certificationsCount: certifications.length
    });

    res.json({
      success: true,
      data: formattedProvider
    });
  } catch (error) {
    console.error('Error in provider profile route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

function checkIfInWorkingHours({ start, end } = { start: '09:00', end: '17:00' }) {
  try {
    if (!start || !end) {
      console.log('Missing time values, using defaults');
      start = '09:00';
      end = '17:00';
    }

    const now = new Date();
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startTime = new Date(now).setHours(startHour, startMin, 0);
    const endTime = new Date(now).setHours(endHour, endMin, 0);
    
    return now >= startTime && now <= endTime;
  } catch (error) {
    console.error('Error in checkIfInWorkingHours:', error);
    return false; // Default to not in working hours if there's an error
  }
}

export default router;
