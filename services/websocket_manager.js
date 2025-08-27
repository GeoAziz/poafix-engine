const socketIo = require('socket.io');

class WebSocketManager {
    constructor(server) {
        this.io = socketIo(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('subscribe_booking', (bookingId) => {
                socket.join(`booking_${bookingId}`);
                console.log(`Socket ${socket.id} subscribed to booking ${bookingId}`);
            });

            socket.on('unsubscribe_booking', (bookingId) => {
                socket.leave(`booking_${bookingId}`);
                console.log(`Socket ${socket.id} unsubscribed from booking ${bookingId}`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }

    emitBookingUpdate(bookingId, bookingData) {
        this.io.to(`booking_${bookingId}`).emit('booking_update', bookingData);
    }

    emitProviderLocation(bookingId, locationData) {
        this.io.to(`booking_${bookingId}`).emit('provider_location', locationData);
    }
}

module.exports = WebSocketManager;
