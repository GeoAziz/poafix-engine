import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  autoConnect: true
});

const providerId = '67c7df4f234d217f6cb0e359'; // Sarah's ID

socket.on('connect', () => {
  console.log('Provider connected to WebSocket server');
  socket.emit('register', providerId);
  console.log('Registered provider:', providerId);
});

socket.on('notification', (data) => {
  console.log('Provider received notification:', {
    type: data.type,
    message: data.data?.message || 'No message',
    booking: data.data?.bookingId || 'No booking ID'
  });
});

socket.on('disconnect', () => {
  console.log('Provider disconnected from WebSocket server');
});

process.stdin.resume();
