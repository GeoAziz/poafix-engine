const validateProvider = (req, res, next) => {
    const requiredFields = [
        'name',
        'email',
        'password',
        'phoneNumber',
        'businessName',
        'serviceType',
        'location'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
        return res.status(400).json({
            error: 'Missing required fields',
            requiredFields: missingFields
        });
    }

    // Validate location format
    const location = req.body.location;
    if (!location || 
        !location.type || 
        location.type !== 'Point' || 
        !Array.isArray(location.coordinates) || 
        location.coordinates.length !== 2) {
        return res.status(400).json({
            error: 'Invalid location format',
            expected: {
                type: 'Point',
                coordinates: [longitude, latitude]
            }
        });
    }

    next();
};

module.exports = {
    validateProvider
};
