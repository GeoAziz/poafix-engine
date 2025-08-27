import express from 'express';
import { Booking } from '../models/booking.model.js';
import { ServiceProvider } from '../models/ServiceProvider.js';
import { Client } from '../models/Client.js';

const router = express.Router();

export const bookingRoutes = (eventManager) => {
    // Create a new booking
    router.post('/', async (req, res) => {
        try {
            // Robustly build schedule from either schedule or scheduledDate/scheduledTime
            let schedule = req.body.schedule;
            if (!schedule && req.body.scheduledDate && req.body.scheduledTime) {
                // Combine date and time into ISO string
                const datePart = req.body.scheduledDate.split('T')[0];
                // Try to parse time in 'h:mm AM/PM' or 'HH:mm' format
                let timePart = req.body.scheduledTime;
                if (/am|pm/i.test(timePart)) {
                    // Convert to 24h format
                    const [time, modifier] = timePart.split(' ');
                    let [hours, minutes] = time.split(':').map(Number);
                    if (modifier.toLowerCase() === 'pm' && hours < 12) hours += 12;
                    if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;
                    timePart = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                }
                schedule = new Date(`${datePart}T${timePart}:00`);
            }

            const booking = new Booking({
                providerId: req.body.providerId,
                clientId: req.body.clientId,
                serviceType: req.body.serviceType,
                schedule,
                status: 'pending',
                description: req.body.notes || req.body.description,
                address: req.body.location?.address,
                // Add any other fields as needed
            });

            await booking.save();

            eventManager.emit('booking:created', booking);

            res.status(201).json({
                message: 'Booking created successfully',
                booking
            });
        } catch (error) {
            console.error('Booking creation error:', error);
            res.status(500).json({
                error: 'Failed to create booking',
                details: error.message
            });
        }
    });

    // Get booking by ID
    router.get('/:id', async (req, res) => {
        try {
            const booking = await Booking.findById(req.params.id)
                .populate('client', 'name email phoneNumber')
                .populate('provider', 'businessName phoneNumber serviceOffered');

            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            res.json(booking);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch booking',
                details: error.message
            });
        }
    });

    // Update booking status
    router.patch('/:id/status', async (req, res) => {
        try {
            const { status } = req.body;
            const booking = await Booking.findById(req.params.id);

            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            booking.status = status;
            await booking.save();

            eventManager.emit('booking:updated', {
                bookingId: booking._id,
                status,
                previousStatus: booking.status
            });

            res.json({
                message: 'Booking status updated',
                booking
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to update booking status',
                details: error.message
            });
        }
    });

    // Get provider's bookings
    router.get('/provider/:providerId', async (req, res) => {
        try {
            const bookings = await Booking.find({
                provider: req.params.providerId
            })
            .populate('client', 'name email phoneNumber')
            .sort({ scheduledDate: -1 });

            res.json(bookings);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch provider bookings',
                details: error.message
            });
        }
    });

    // Get client's bookings
    router.get('/client/:clientId', async (req, res) => {
        try {
            const bookings = await Booking.find({
                client: req.params.clientId
            })
            .populate('provider', 'businessName phoneNumber serviceOffered')
            .sort({ scheduledDate: -1 });

            res.json(bookings);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch client bookings',
                details: error.message
            });
        }
    });

    // Add rating to booking
    router.post('/:id/rating', async (req, res) => {
        try {
            const { score, comment } = req.body;
            const booking = await Booking.findById(req.params.id);

            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            booking.rating = {
                score,
                comment,
                createdAt: new Date()
            };
            await booking.save();

            // Update provider's rating
            const provider = await ServiceProvider.findById(booking.provider);
            provider.rating.count += 1;
            provider.rating.average = (
                (provider.rating.average * (provider.rating.count - 1) + score) /
                provider.rating.count
            );
            await provider.save();

            eventManager.emit('booking:rated', {
                bookingId: booking._id,
                providerId: provider._id,
                rating: score
            });

            res.json({
                message: 'Rating added successfully',
                booking
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to add rating',
                details: error.message
            });
        }
    });

    return router;
};

export { bookingRoutes as default };
