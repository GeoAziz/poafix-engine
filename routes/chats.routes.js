import express from 'express';
import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import { Booking } from '../models/index.js';
import authMiddleware from '../middleware/auth.middleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/chat';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and audio files
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|wav|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get all chats for the authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType || 'client';
    
    let query = {};
    if (userType === 'client') {
      query.clientId = userId;
    } else {
      query.providerId = userId;
    }

    const chats = await Chat.find(query)
      .populate('bookingId', 'serviceType schedule status')
      .sort({ updatedAt: -1 })
      .lean();

    // Get unread count for each chat
    for (let chat of chats) {
      const unreadCount = await Message.getUnreadCount(chat._id, userId);
      chat.unreadCount = unreadCount;
    }

    res.json({
      success: true,
      data: chats
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create or get existing chat
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      bookingId,
      clientId,
      clientName,
      providerId,
      providerName,
      serviceType
    } = req.body;

    // Check if chat already exists for this booking
    let chat = await Chat.findOne({ bookingId });

    if (!chat) {
      // Verify booking exists
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      // Create new chat
      chat = new Chat({
        bookingId,
        clientId,
        clientName,
        providerId,
        providerName,
        serviceType
      });

      await chat.save();

      // Send welcome message
      const welcomeMessage = new Message({
        chatId: chat._id,
        senderId: 'system',
        senderName: 'PoaFix',
        senderType: 'system',
        receiverId: clientId,
        receiverName: clientName,
        content: `Chat created for ${serviceType} service. You can now communicate with your service provider.`,
        type: 'system'
      });

      await welcomeMessage.save();
    }

    res.status(201).json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get messages for a specific chat
router.get('/:chatId/messages', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    // Verify user has access to this chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    if (chat.clientId.toString() !== userId && chat.providerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const skip = (page - 1) * limit;
    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Reverse to get chronological order
    messages.reverse();

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send a message
router.post('/:chatId/messages', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const {
      content,
      type = 'text',
      receiverId,
      attachments = [],
      replyToMessageId
    } = req.body;

    const userId = req.user.id;
    const userName = req.user.name || 'User';
    const userType = req.user.userType || 'client';

    // Verify chat exists and user has access
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    if (chat.clientId.toString() !== userId && chat.providerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Determine receiver info
    let receiverName;
    if (userType === 'client') {
      receiverName = chat.providerName;
    } else {
      receiverName = chat.clientName;
    }

    // Create message
    const message = new Message({
      chatId,
      senderId: userId,
      senderName: userName,
      senderType: userType,
      receiverId: receiverId || (userType === 'client' ? chat.providerId : chat.clientId),
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
      senderId: userId,
      senderType: userType
    };
    chat.updatedAt = new Date();
    
    // Update unread count
    if (userType === 'client') {
      chat.unreadCount.provider += 1;
    } else {
      chat.unreadCount.client += 1;
    }

    await chat.save();

    // Emit real-time message via WebSocket (handled in WebSocket service)
    if (req.io) {
      req.io.to(chatId).emit('new_message', message);
      req.io.emit('chat_updated', chat);
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Upload file for chat
router.post('/:chatId/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Verify chat access
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    if (chat.clientId.toString() !== userId && chat.providerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;

    res.json({
      success: true,
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark messages as read
router.patch('/:chatId/messages/:messageId/read', authMiddleware, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      chatId: chatId,
      receiverId: userId
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    await message.markAsRead();

    // Update chat unread count
    const chat = await Chat.findById(chatId);
    if (chat) {
      const userType = req.user.userType || 'client';
      if (userType === 'client') {
        chat.unreadCount.client = Math.max(0, chat.unreadCount.client - 1);
      } else {
        chat.unreadCount.provider = Math.max(0, chat.unreadCount.provider - 1);
      }
      await chat.save();
    }

    // Emit read status via WebSocket
    if (req.io) {
      req.io.to(chatId).emit('message_read', {
        messageId: messageId,
        readBy: userId
      });
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark entire chat as read
router.patch('/:chatId/read', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType || 'client';

    // Mark all unread messages as read
    await Message.updateMany(
      {
        chatId: chatId,
        receiverId: userId,
        isRead: false
      },
      {
        isRead: true,
        status: 'read'
      }
    );

    // Update chat unread count
    const chat = await Chat.findById(chatId);
    if (chat) {
      if (userType === 'client') {
        chat.unreadCount.client = 0;
      } else {
        chat.unreadCount.provider = 0;
      }
      await chat.save();

      // Emit chat update via WebSocket
      if (req.io) {
        req.io.emit('chat_updated', chat);
      }
    }

    res.json({
      success: true,
      message: 'Chat marked as read'
    });
  } catch (error) {
    console.error('Error marking chat as read:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search messages
router.get('/:chatId/messages/search', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q: query, limit = 20 } = req.query;
    const userId = req.user.id;

    // Verify chat access
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    if (chat.clientId.toString() !== userId && chat.providerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const messages = await Message.find({
      chatId: chatId,
      $text: { $search: query }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Archive chat
router.patch('/:chatId/archive', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    if (chat.clientId.toString() !== userId && chat.providerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    chat.status = 'archived';
    await chat.save();

    res.json({
      success: true,
      message: 'Chat archived successfully'
    });
  } catch (error) {
    console.error('Error archiving chat:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
