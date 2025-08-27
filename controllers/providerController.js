import { Provider } from '../models/provider.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const providerController = {
    signup: async (req, res) => {
        console.log('Processing provider signup:', req.body);
        try {
            const {
                name,
                email,
                password,
                phoneNumber,
                address,
                location,
                businessName,
                serviceType,
                backupContact,
                preferredCommunication,
                timezone
            } = req.body;

            // Validate required provider fields
            if (!name || !email || !password || !phoneNumber || !businessName || !serviceType) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            // Check if provider exists
            const existingProvider = await Provider.findOne({ email });
            if (existingProvider) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new provider
            const provider = new Provider({
                name,
                email,
                password: hashedPassword,
                phoneNumber,
                address,
                businessName,
                serviceType,
                backupContact,
                preferredCommunication,
                timezone,
                location: location || {
                    type: 'Point',
                    coordinates: [36.8219, -1.2921] // Default coordinates
                }
            });

            await provider.save();

            // Generate token
            const token = jwt.sign(
                {
                    id: provider._id,
                    userType: 'service-provider',
                    role: 'provider'
                },
                process.env.JWT_SECRET || 'your-fallback-secret',
                { expiresIn: '24h' }
            );

            // Send response
            res.status(201).json({
                success: true,
                token,
                userType: 'service-provider',
                provider: {
                    id: provider._id,
                    name: provider.name,
                    email: provider.email,
                    phoneNumber: provider.phoneNumber,
                    businessName: provider.businessName,
                    serviceType: provider.serviceType,
                    location: provider.location
                }
            });
        } catch (error) {
            console.error('Provider signup error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error creating provider account'
            });
        }
    },

    login: async (req, res) => {
        try {
            console.log('=== Login Debug Start ===');
            console.log('1. Request body:', { 
                email: req.body.email,
                passwordReceived: !!req.body.password 
            });
            
            const { email, password } = req.body;
            
            if (!email || !password) {
                console.log('2. Missing credentials');
                return res.status(400).json({
                    success: false,
                    message: "Missing credentials",
                    error: "Email and password are required"
                });
            }

            const provider = await Provider.findOne({ email }).select('+password');
            console.log('3. Provider found:', {
                found: !!provider,
                hasPassword: provider ? !!provider.password : false
            });

            if (!provider) {
                return res.status(401).json({
                    success: false,
                    message: "Login failed",
                    error: "Invalid credentials"
                });
            }

            if (!provider.password || typeof provider.password !== 'string') {
                console.log('4. Invalid password hash:', {
                    passwordType: typeof provider.password,
                    passwordLength: provider.password ? provider.password.length : 0
                });
                
                // If password is missing, let's set a new one
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                
                await Provider.updateOne(
                    { _id: provider._id },
                    { $set: { password: hashedPassword } }
                );
                
                provider.password = hashedPassword;
            }

            const isMatch = await bcrypt.compare(password, provider.password);
            console.log('5. Password comparison:', { isMatch });

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Login failed",
                    error: "Invalid credentials"
                });
            }

            const token = jwt.sign(
                { id: provider._id, userType: 'service-provider' },
                process.env.JWT_SECRET || 'your-fallback-secret',
                { expiresIn: '24h' }
            );

            console.log('6. Login successful');
            console.log('=== Login Debug End ===');
            
            res.status(200).json({
                success: true,
                message: "Login successful",
                token,
                userType: 'service-provider',
                provider: {
                    id: provider._id,
                    name: provider.name,
                    email: provider.email,
                    businessName: provider.businessName
                }
            });

        } catch (error) {
            console.error('Login error details:', {
                message: error.message,
                stack: error.stack
            });
            res.status(500).json({
                success: false,
                message: "Login failed",
                error: error.message
            });
        }
    },

    updateLocation: async (req, res) => {
        try {
            const { providerId, location, isAvailable, lastUpdated } = req.body;
            console.log('Updating location for provider:', { providerId, location });

            if (!providerId || providerId === 'null') {
                return res.status(400).json({
                    success: false,
                    message: 'Valid providerId is required'
                });
            }

            // Validate location format
            if (!location || !location.coordinates || 
                !Array.isArray(location.coordinates) || 
                location.coordinates.length !== 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid location format'
                });
            }

            const provider = await Provider.findByIdAndUpdate(
                providerId,
                {
                    location,
                    isAvailable,
                    lastLocationUpdate: lastUpdated || Date.now()
                },
                { new: true }
            );

            if (!provider) {
                console.log('Provider not found:', providerId);
                return res.status(404).json({
                    success: false,
                    message: 'Provider not found'
                });
            }

            console.log('Location updated successfully for:', provider._id);
            res.json({
                success: true,
                data: {
                    id: provider._id,
                    location: provider.location,
                    isAvailable: provider.isAvailable
                }
            });
        } catch (error) {
            console.error('Location update error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update location',
                error: error.message
            });
        }
    },

    getNearbyProviders: async (req, res) => {
        try {
            // Extract query parameters directly
            const {
                latitude,
                longitude,
                radius = 5000,
                serviceType
            } = req.query;

            console.log('Received parameters:', {
                latitude,
                longitude,
                radius,
                serviceType,
                rawQuery: req.query
            });

            // Validate required parameters
            if (!latitude || !longitude) {
                return res.status(400).json({
                    success: false,
                    error: 'Latitude and longitude are required',
                    receivedParams: req.query
                });
            }

            // Convert string coordinates to numbers
            const coords = [
                parseFloat(longitude),
                parseFloat(latitude)
            ];

            const query = {
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: coords
                        },
                        $maxDistance: parseInt(radius)
                    }
                },
                isAvailable: true,
                isSuspended: false
            };

            if (serviceType) {
                query.serviceOffered = serviceType.toLowerCase();
            }

            const providers = await Provider.find(query)
                .select('-password')
                .sort('rating')
                .limit(20);

            console.log(`Found ${providers.length} nearby providers`);

            return res.json({
                success: true,
                count: providers.length,
                providers: providers.map(p => ({
                    ...p.toObject(),
                    distance: _calculateDistance(
                        coords,
                        p.location.coordinates
                    )
                }))
            });

        } catch (error) {
            console.error('Get nearby providers error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch nearby providers',
                details: error.message
            });
        }
    },

    _calculateDistance: (coords1, coords2) => {
        const R = 6371e3;
        const φ1 = coords1[1] * Math.PI/180;
        const φ2 = coords2[1] * Math.PI/180;
        const Δφ = (coords2[1]-coords1[1]) * Math.PI/180;
        const Δλ = (coords2[0]-coords1[0]) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    },

    updateStatus: async (req, res) => {
        try {
            const { isAvailable } = req.body;
            const providerId = req.user.id;

            const provider = await Provider.findByIdAndUpdate(
                providerId,
                { isAvailable },
                { new: true }
            );

            res.json({
                success: true,
                data: {
                    id: provider._id,
                    isAvailable: provider.isAvailable
                }
            });
        } catch (error) {
            console.error('Status update error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update status',
                error: error.message
            });
        }
    }
};

export default providerController;
