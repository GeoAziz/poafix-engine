import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const clientController = {
    signup: async (req, res) => {
        console.log('Processing client signup:', req.body);
        try {
            const { 
                name, 
                email, 
                password, 
                phoneNumber, 
                address, 
                location,
                backupContact,
                preferredCommunication,
                timezone 
            } = req.body;

            // Check if user exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const user = new User({
                name,
                email,
                password: hashedPassword,
                phoneNumber,
                address,
                backupContact,
                preferredCommunication,
                timezone,
                location: location || {
                    type: 'Point',
                    coordinates: [36.8219, -1.2921]
                }
            });

            await user.save();

            // Generate token
            const token = jwt.sign(
                { 
                    id: user._id,
                    userType: 'client'
                },
                process.env.JWT_SECRET || 'your-fallback-secret',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                token,
                userType: 'client',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    location: user.location
                }
            });
        } catch (error) {
            console.error('Client signup error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            console.log('Client login attempt for:', email);

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                console.log('No user found with email:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Compare passwords directly with bcrypt
            const isMatch = await bcrypt.compare(password, user.password);
            console.log('Password comparison result:', isMatch);

            if (!isMatch) {
                console.log('Password mismatch for user:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate token
            const token = jwt.sign(
                { id: user._id, userType: 'client' },
                process.env.JWT_SECRET || 'your-fallback-secret',
                { expiresIn: '24h' }
            );

            // Send success response
            res.json({
                success: true,
                token,
                userType: 'client',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phoneNumber: user.phoneNumber
                }
            });
        } catch (error) {
            console.error('Client login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed',
                error: error.message
            });
        }
    },

    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select('-password');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch profile',
                error: error.message
            });
        }
    },

    requestService: async (req, res) => {
        try {
            const { serviceType, description, location } = req.body;
            const userId = req.user.id;

            // Add your service request logic here
            res.json({
                success: true,
                message: 'Service request submitted successfully'
            });
        } catch (error) {
            console.error('Service request error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit service request',
                error: error.message
            });
        }
    },

    // Admin: Get client profile by ID
    getClientProfile: async (req, res) => {
        try {
            const { clientId } = req.params;
            const user = await User.findById(clientId)
                .select('name email phoneNumber lastActive backupContact preferredCommunication timezone isOnline isActive address location avatarUrl');
            if (!user) {
                return res.status(404).json({ success: false, message: 'Client not found' });
            }
            console.log('--- Client Profile Data ---');
            console.log('Name:', user.name);
            console.log('Email:', user.email);
            console.log('Phone:', user.phoneNumber);
            console.log('Last Active:', user.lastActive);
            console.log('Backup Contact:', user.backupContact);
            console.log('Preferred Communication:', user.preferredCommunication);
            console.log('Timezone:', user.timezone);
            console.log('isOnline:', user.isOnline);
            console.log('isActive:', user.isActive);
            console.log('Address:', user.address);
            console.log('Location:', user.location);
            console.log('Avatar URL:', user.avatarUrl);
            res.json({ success: true, data: user });
        } catch (error) {
            console.error('Get client profile error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch client profile', error: error.message });
        }
    }
};

export default clientController;
