import { Server } from 'socket.io';

export class WebSocketService {
  static io;
  static userSockets = new Map();
  static initialized = false;

  static initialize(server) {
    if (this.initialized) return;

    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH"]
      },
      path: '/socket.io', // Explicit path instead of /ws
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      connectTimeout: 45000,
      allowEIO3: true
    });
    this.initialized = true;

    this.io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      socket.on('register', (userId) => {
        console.log('User registered socket:', { userId, socketId: socket.id });
        this.userSockets.set(userId, socket);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        // Remove socket mapping
        for (const [userId, userSocket] of this.userSockets.entries()) {
          if (userSocket === socket) {
            console.log('Removing socket mapping for user:', userId);
            this.userSockets.delete(userId);
            break;
          }
        }
      });
    });

    console.log('WebSocket service initialized');
  }

  static emitToUser(userId, event, data) {
    try {
      if (!this.io) {
        console.warn('Socket.io not initialized');
        return;
      }

      console.log('Emitting event:', {
        userId,
        event,
        data
      });

      this.io.to(userId.toString()).emit(event, data);
    } catch (error) {
      console.error('WebSocket emit error:', error);
    }
  }

  static emitToAll(event, data) {
    try {
      if (!this.io) {
        console.warn('Socket.io not initialized');
        return;
      }
      this.io.emit(event, data);
    } catch (error) {
      console.error('WebSocket broadcast error:', error);
    }
  }

  static notifyUser(userId, data) {
    const socket = this.userSockets.get(userId);
    if (socket) {
      console.log('Sending notification to user:', { userId, type: data.type });
      socket.emit('notification', data);
    } else {
      console.log('User not connected - storing notification:', { userId, type: data.type });
      // You could store undelivered notifications in the database here
    }
  }

  static broadcastToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  static getConnectedUsers() {
    return Array.from(this.userSockets.keys());
  }
}
