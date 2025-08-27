import { EventEmitter } from 'events';

class EventManager extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(20); // Increase max listeners if needed
    }

    // Payment events
    onPaymentInitiated(callback) {
        this.on('payment:initiated', callback);
    }

    onPaymentCompleted(callback) {
        this.on('payment:completed', callback);
    }

    onPaymentFailed(callback) {
        this.on('payment:failed', callback);
    }

    // Booking events
    onBookingCreated(callback) {
        this.on('booking:created', callback);
    }

    onBookingUpdated(callback) {
        this.on('booking:updated', callback);
    }

    onBookingCancelled(callback) {
        this.on('booking:cancelled', callback);
    }

    // Provider events
    onProviderLocationUpdate(callback) {
        this.on('provider:location_update', callback);
    }

    onProviderStatusChange(callback) {
        this.on('provider:status_change', callback);
    }

    // Client events
    onClientLocationUpdate(callback) {
        this.on('client:location_update', callback);
    }

    // Notification events
    onNotificationSent(callback) {
        this.on('notification:sent', callback);
    }

    // System events
    onError(callback) {
        this.on('error', callback);
    }
}

// Create a singleton instance
const eventManager = new EventManager();

// Add default error handler to prevent crashes
eventManager.on('error', (error) => {
    console.error('Event Manager Error:', error);
});

// Export the singleton instance
export { eventManager };
