import WebSocket from 'ws';
import { io } from 'socket.io-client';

const providerId = '67c7df4f234d217f6cb0e359';
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  query: { userId: providerId }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  
  // Register the provider
  socket.emit('register', {
    userId: providerId,
    userType: 'provider'
  });
  
  console.log('Registered provider:', providerId);
});

socket.on('notification', (data) => {
  console.log('Received notification:', {
    type: data.type,
    title: data.title,
    message: data.message,
    timestamp: new Date().toISOString()
  });
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// Keep the connection alive
setInterval(() => {
  if (socket.connected) {
    socket.emit('ping');
  }
}, 25000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Closing connection...');
  socket.close();
  process.exit();
});
