// Request logging middleware
export const requestLogger = (req, res, next) => {
    try {
        const timestamp = new Date().toISOString();
        const method = req.method;
        const path = req.path;
        const body = req.body || {};
        
        console.log(`[${timestamp}] ${method} ${path}`);
        
        if (Object.keys(body).length > 0) {
            // Only log body if it exists and has properties
            const sanitizedBody = { ...body };
            if (sanitizedBody.password) {
                sanitizedBody.password = '[REDACTED]';
            }
            console.log('Request body:', sanitizedBody);
        }

        // Add request timestamp for potential response time tracking
        req.requestTimestamp = timestamp;
        
        next();
    } catch (error) {
        console.error('Error in request logger:', error);
        next(); // Continue even if logging fails
    }
};
