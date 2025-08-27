import { Booking } from '../models/booking.model.js';
import { User } from '../models/User.js'; // Adjust path if needed
import { Server } from 'socket.io';
import { ServiceProvider } from '../models/ServiceProvider.js';
import { eventManager } from './event_manager.js';

export class RealtimeManager {
    constructor(server) {
        this.server = server;
        this.connectedClients = new Map();
        this.providerSessions = new Map();
    }

    registerClient(clientId, socket) {
        this.connectedClients.set(clientId, socket);
        console.log(`[RealtimeManager] Client ${clientId} registered`);

        // Set isOnline true in DB and log
        User.findByIdAndUpdate(clientId, { $set: { isOnline: true } })
            .then(() => console.log(`[RealtimeManager] Set isOnline: true for client ${clientId}`))
            .catch(err => console.error(`[RealtimeManager] Error setting isOnline true for client ${clientId}:`, err));

        socket.on('disconnect', () => {
            this.connectedClients.delete(clientId);
            console.log(`[RealtimeManager] Client ${clientId} disconnected`);
            // Set isOnline false and update lastActive in DB and log
            User.findByIdAndUpdate(clientId, {
                $set: {
                    isOnline: false,
                    lastActive: new Date()
                }
            })
            .then(() => console.log(`[RealtimeManager] Set isOnline: false and updated lastActive for client ${clientId}`))
            .catch(err => console.error(`[RealtimeManager] Error setting isOnline false for client ${clientId}:`, err));
        });
    }

    registerProvider(providerId, socket) {
        this.providerSessions.set(providerId, {
            socket,
            status: 'online',
            lastSeen: new Date()
        });
        console.log(`Provider ${providerId} registered`);

        socket.on('disconnect', () => {
            const session = this.providerSessions.get(providerId);
            if (session) {
                session.status = 'offline';
                session.lastSeen = new Date();
            }
            console.log(`Provider ${providerId} disconnected`);
        });
    }

    notifyProvider(providerId, event, data) {
        const session = this.providerSessions.get(providerId);
        if (session && session.socket) {
            session.socket.emit(event, data);
            return true;
        }
        return false;
    }

    notifyClient(clientId, event, data) {
        const socket = this.connectedClients.get(clientId);
        if (socket) {
            socket.emit(event, data);
            return true;
        }
        return false;
    }

    broadcastToProviders(event, data) {
        this.providerSessions.forEach((session, providerId) => {
            if (session.status === 'online') {
                session.socket.emit(event, data);
            }
        });
    }

    getProviderStatus(providerId) {
        const session = this.providerSessions.get(providerId);
        return session ? {
            status: session.status,
            lastSeen: session.lastSeen
        } : null;
    }
}
