import { ServiceRequest } from '../models/serviceRequest.js';

export const createServiceRequest = async (req, res) => {
  try {
    const serviceRequest = new ServiceRequest({
      ...req.body,
      initialRequestTime: new Date(),
      status: 'pending',
      responseStatus: 'awaiting'
    });

    await serviceRequest.save();

    // Ensure we return a valid ID
    res.status(201).json({
      success: true,
      data: {
        ...serviceRequest.toObject(),
        id: serviceRequest._id.toString() // Ensure ID is available
      }
    });
  } catch (error) {
    console.error('Service request creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const serviceRequest = await ServiceRequest.findById(id);
    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        error: 'Service request not found'
      });
    }

    serviceRequest.status = status;
    serviceRequest.providerResponseTime = new Date();
    serviceRequest.responseStatus = status === 'rejected' ? 'rejected' : 'accepted';
    if (rejectionReason) serviceRequest.rejectionReason = rejectionReason;
    if (status === 'completed') serviceRequest.completedAt = new Date();

    await serviceRequest.save();

    res.json({
      success: true,
      data: serviceRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getClientRequests = async (req, res) => {
  try {
    const { clientId } = req.params;
    const requests = await ServiceRequest.find({ clientId })
      .sort('-createdAt')
      .populate('providerId', 'name businessName');

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getProviderRequests = async (req, res) => {
  try {
    const { providerId } = req.params;
    const requests = await ServiceRequest.find({ providerId })
      .sort('-createdAt')
      .populate('clientId', 'name');

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
