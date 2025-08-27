import { Provider } from '../models/index.js';
import Suspension from '../models/suspension.js';

export const suspensionValidationMiddleware = async (req, res, next) => {
  try {
    const { providerId } = req.body;
    
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Check if provider is already suspended when trying to suspend
    if (provider.isSuspended && req.path.includes('/suspend')) {
      const activeSuspension = await Suspension.findOne({
        providerId: provider._id,
        active: true
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: 'Provider is already suspended',
        suspension: activeSuspension
      });
    }

    // Check if provider is not suspended when trying to unsuspend
    if (!provider.isSuspended && req.path.includes('/unsuspend')) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: 'Provider is not suspended'
      });
    }

    req.validatedProvider = provider;
    next();
  } catch (error) {
    console.error('Suspension validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed',
      details: error.message
    });
  }
};

export const checkSuspension = async (req, res, next) => {
  try {
    const providerId = req.params.providerId || req.user?.id;
    
    if (!providerId) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID is required'
      });
    }

    const provider = await Provider.findById(providerId);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Check if provider is suspended using the document field
    if (provider.isSuspended) {
      return res.status(403).json({
        success: false,
        error: 'Account is suspended',
        reason: provider.suspensionReason || 'No reason provided',
        suspendedAt: provider.suspendedAt
      });
    }

    // Add provider to request object
    req.provider = provider;
    next();
  } catch (error) {
    console.error('Suspension check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify provider status'
    });
  }
};
