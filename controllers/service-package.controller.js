import ServicePackage from '../models/servicePackage.model.js';

export const getServicePackages = async (req, res) => {
  try {
    const { 
      providerId, 
      category, 
      type, 
      isActive, 
      minPrice, 
      maxPrice,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    const query = {};
    if (providerId) query.providerId = providerId;
    if (category) query.category = category;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (minPrice || maxPrice) {
      query.packagePrice = {};
      if (minPrice) query.packagePrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.packagePrice.$lte = parseFloat(maxPrice);
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    
    const skip = (page - 1) * limit;
    const packages = await ServicePackage.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('providerId', 'businessName rating reviewCount');
    
    const total = await ServicePackage.countDocuments(query);
    
    res.json({
      success: true,
      data: packages,
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

export const getServicePackageById = async (req, res) => {
  try {
    const { packageId } = req.params;
    const servicePackage = await ServicePackage.findById(packageId)
      .populate('providerId', 'businessName rating reviewCount location');
    
    if (!servicePackage) {
      return res.status(404).json({
        success: false,
        error: 'Service package not found'
      });
    }
    
    res.json({
      success: true,
      data: servicePackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createServicePackage = async (req, res) => {
  try {
    const packageData = req.body;
    
    // Calculate original price and discount
    const originalPrice = packageData.services.reduce((total, service) => 
      total + service.totalPrice, 0
    );
    
    packageData.originalPrice = originalPrice;
    packageData.discountAmount = originalPrice - packageData.packagePrice;
    packageData.discountPercentage = ((originalPrice - packageData.packagePrice) / originalPrice) * 100;
    
    const servicePackage = new ServicePackage(packageData);
    await servicePackage.save();
    
    res.status(201).json({
      success: true,
      data: servicePackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateServicePackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    const updates = req.body;
    
    // Recalculate pricing if services changed
    if (updates.services || updates.packagePrice) {
      const originalPrice = updates.services 
        ? updates.services.reduce((total, service) => total + service.totalPrice, 0)
        : (await ServicePackage.findById(packageId)).originalPrice;
      
      updates.originalPrice = originalPrice;
      updates.discountAmount = originalPrice - (updates.packagePrice || (await ServicePackage.findById(packageId)).packagePrice);
      updates.discountPercentage = ((originalPrice - updates.packagePrice) / originalPrice) * 100;
    }
    
    const servicePackage = await ServicePackage.findByIdAndUpdate(
      packageId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!servicePackage) {
      return res.status(404).json({
        success: false,
        error: 'Service package not found'
      });
    }
    
    res.json({
      success: true,
      data: servicePackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteServicePackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    
    const servicePackage = await ServicePackage.findByIdAndUpdate(
      packageId,
      { isActive: false },
      { new: true }
    );
    
    if (!servicePackage) {
      return res.status(404).json({
        success: false,
        error: 'Service package not found'
      });
    }
    
    res.json({
      success: true,
      data: servicePackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};