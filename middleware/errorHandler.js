// Custom error classes
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.status = 400;
    }
}

class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
        this.status = 401;
    }
}

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.status = 404;
    }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    // Log error details
    console.error('Error occurred:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: Object.values(err.errors).map(e => e.message)
        });
    }

    // Handle mongoose cast errors (invalid IDs)
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID format',
            details: err.message
        });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
        return res.status(409).json({
            error: 'Duplicate Entry',
            details: `${Object.keys(err.keyValue)} already exists`
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
            details: err.message
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired',
            details: err.message
        });
    }

    // Handle custom error types
    if (err instanceof ValidationError ||
        err instanceof AuthenticationError ||
        err instanceof NotFoundError) {
        return res.status(err.status).json({
            error: err.name,
            details: err.message
        });
    }

    // Handle unknown errors
    const status = err.status || 500;
    const message = status === 500 ? 'Internal Server Error' : err.message;

    res.status(status).json({
        error: err.name || 'Error',
        details: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export { 
    errorHandler,
    ValidationError,
    AuthenticationError,
    NotFoundError
};
