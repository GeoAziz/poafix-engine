import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  autoConnect: true
});

const clientId = '67c6f29821bed76feb37bcbe'; // Jane's ID

socket.on('connect', () => {
  console.log('Client connected to WebSocket server');
  socket.emit('register', clientId);
  console.log('Registered client:', clientId);
});

socket.on('notification', (data) => {
  console.log('Client received notification:', {
    type: data.type,
    message: data.data?.message || 'No message',
    booking: data.data?.bookingId || 'No booking ID',
    status: data.data?.status || 'No status'
  });
});

socket.on('disconnect', () => {
  console.log('Client disconnected from WebSocket server');
});

process.stdin.resume();
