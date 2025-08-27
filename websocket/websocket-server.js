import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/message.model.js';
import Chat from '../models/chat.model.js';

function setupWebSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userType = decoded.userType || 'client';
      socket.userName = decoded.name || 'User';
      
      console.log(`User ${socket.userName} (${socket.userType}) connected`);
      next();
    } catch (err) {
      console.log('WebSocket auth error:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.userId})`);

    // Join user to their personal room for direct messages
    socket.join(socket.userId);

    // Handle joining chat rooms
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.userId} joined chat ${chatId}`);
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
      console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const {
          chatId,
          receiverId,
          content,
          type = 'text',
          attachments = [],
          replyToMessageId
        } = data;

        // Verify chat exists and user has access
        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        if (chat.clientId.toString() !== socket.userId && chat.providerId.toString() !== socket.userId) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Determine receiver info
        let receiverName;
        if (socket.userType === 'client') {
          receiverName = chat.providerName;
        } else {
          receiverName = chat.clientName;
        }

        // Create message
        const message = new Message({
          chatId,
          senderId: socket.userId,
          senderName: socket.userName,
          senderType: socket.userType,
          receiverId: receiverId || (socket.userType === 'client' ? chat.providerId : chat.clientId),
          receiverName,
          content,
          type,
          attachments,
          replyToMessageId
        });

        await message.save();

        // Update chat's last message
        chat.lastMessage = {
          content: content,
          timestamp: message.createdAt,
          senderId: socket.userId,
          senderType: socket.userType
        };
        chat.updatedAt = new Date();
        
        // Update unread count
        if (socket.userType === 'client') {
          chat.unreadCount.provider += 1;
        } else {
          chat.unreadCount.client += 1;
        }

        await chat.save();

        // Emit message to chat room
        io.to(chatId).emit('new_message', message);
        
        // Emit to receiver's personal room for notifications
        io.to(message.receiverId.toString()).emit('message_notification', {
          chatId,
          message,
          senderName: socket.userName
        });

        // Emit chat update
        io.emit('chat_updated', chat);

        // Confirm message sent
        socket.emit('message_sent', { messageId: message._id });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message read status
    socket.on('mark_as_read', async (data) => {
      try {
        const { chatId, messageId } = data;

        const message = await Message.findOne({
          _id: messageId,
          chatId: chatId,
          receiverId: socket.userId
        });

        if (message) {
          await message.markAsRead();

          // Update chat unread count
          const chat = await Chat.findById(chatId);
          if (chat) {
            if (socket.userType === 'client') {
              chat.unreadCount.client = Math.max(0, chat.unreadCount.client - 1);
            } else {
              chat.unreadCount.provider = Math.max(0, chat.unreadCount.provider - 1);
            }
            await chat.save();
          }

          // Emit read status to chat
          io.to(chatId).emit('message_status_update', {
            messageId,
            status: 'read',
            readBy: socket.userId
          });
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle typing indicators
    socket.on('start_typing', (data) => {
      const { chatId, receiverId } = data;
      socket.to(chatId).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        typing: true
      });
    });

    socket.on('stop_typing', (data) => {
      const { chatId, receiverId } = data;
      socket.to(chatId).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        typing: false
      });
    });

    // Handle call initiation
    socket.on('initiate_call', (data) => {
      const {
        receiverId,
        receiverName,
        isVideoCall,
        channelId,
        bookingId
      } = data;

      // Emit incoming call to receiver
      io.to(receiverId).emit('incoming_call', {
        callerId: socket.userId,
        callerName: socket.userName,
        callerType: socket.userType,
        isVideoCall,
        channelId,
        bookingId,
        timestamp: new Date()
      });

      console.log(`Call initiated from ${socket.userName} to ${receiverName}`);
    });

    // Handle call acceptance
    socket.on('accept_call', (data) => {
      const { callerId, channelId } = data;

      io.to(callerId).emit('call_accepted', {
        receiverId: socket.userId,
        receiverName: socket.userName,
        channelId
      });

      console.log(`Call accepted by ${socket.userName}`);
    });

    // Handle call decline
    socket.on('decline_call', (data) => {
      const { callerId, reason = 'declined' } = data;

      io.to(callerId).emit('call_declined', {
        receiverId: socket.userId,
        receiverName: socket.userName,
        reason
      });

      console.log(`Call declined by ${socket.userName}`);
    });

    // Handle call end
    socket.on('end_call', (data) => {
      const { channelId, participants = [] } = data;

      // Notify all participants
      participants.forEach(participantId => {
        if (participantId !== socket.userId) {
          io.to(participantId).emit('call_ended', {
            endedBy: socket.userId,
            endedByName: socket.userName
          });
        }
      });

      console.log(`Call ended by ${socket.userName}`);
    });

    // Handle call busy
    socket.on('call_busy', (data) => {
      const { callerId } = data;

      io.to(callerId).emit('call_busy', {
        receiverId: socket.userId,
        receiverName: socket.userName
      });
    });

    // Handle online status
    socket.on('update_online_status', (status) => {
      socket.broadcast.emit('user_online_status', {
        userId: socket.userId,
        userName: socket.userName,
        status: status,
        timestamp: new Date()
      });
    });

    // Handle booking status updates (existing functionality)
    socket.on('booking_status_update', async (data) => {
      try {
        const { bookingId, status, providerId } = data;
        
        // Update booking in database
        const booking = await Booking.findById(bookingId);
        if (booking && booking.providerId.toString() === providerId) {
          booking.status = status;
          await booking.save();

          // Broadcast update
          io.emit('booking_updated', {
            bookingId,
            status,
            providerId
          });
        }
      } catch (error) {
        console.error('WebSocket booking update error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userName} (${socket.userId}) disconnected`);
      
      // Broadcast offline status
      socket.broadcast.emit('user_online_status', {
        userId: socket.userId,
        userName: socket.userName,
        status: 'offline',
        timestamp: new Date()
      });
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Attach io to the server for use in routes
  server.io = io;

  return io;
}

export { setupWebSocketServer as default };
