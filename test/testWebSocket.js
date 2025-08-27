import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:5000/socket.io/?EIO=4&transport=websocket');

ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Send registration message
  const registerMsg = {
    type: 'register',
    userId: '67c7df4f234d217f6cb0e359'  // Provider ID
  };
  
  ws.send(JSON.stringify(registerMsg));
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
});

ws.on('close', () => {
  console.log('Disconnected');
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
