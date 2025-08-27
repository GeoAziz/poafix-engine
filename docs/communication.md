# 📡 PoaFix Communication System Documentation

## 🌐 **Overview**
The PoaFix communication system provides comprehensive real-time messaging, voice/video calling, and enhanced notifications between clients and service providers. The system is built using WebSocket for real-time communication and REST APIs for persistent data management.

## 🏗️ **Architecture**

### **Frontend Components**
- **MessagingService**: Core messaging functionality
- **EnhancedCallService**: Voice/video call management
- **WebSocketService**: Real-time communication
- **NotificationService**: Push notifications and alerts

### **Backend Components**
- **WebSocket Server**: Real-time message routing
- **Chat Routes**: REST API for chat management
- **Message Routes**: REST API for message CRUD
- **Call Routes**: REST API for call history
- **Models**: Message, Chat, Notification schemas

## 💬 **In-App Messaging System**

### **Features**
- ✅ Real-time text messaging
- ✅ Image and file sharing
- ✅ Reply to messages
- ✅ Message read receipts
- ✅ Typing indicators
- ✅ Online/offline status
- ✅ Message search
- ✅ Chat history persistence

### **Message Types**
```typescript
enum MessageType {
  text,           // Plain text messages
  image,          // Image attachments
  file,           // File attachments
  audio,          // Voice messages
  video,          // Video messages
  location,       // Location sharing
  system,         // System notifications
  call_invite,    // Call invitations
  payment_request // Payment requests
}
```

### **Message Status**
```typescript
enum MessageStatus {
  sending,    // Message being sent
  sent,       // Message sent to server
  delivered,  // Message delivered to recipient
  read,       // Message read by recipient
  failed      // Message failed to send
}
```

### **Frontend Implementation**

#### **MessagingService API**
```dart
class MessagingService {
  // Chat Management
  Future<List<ChatModel>> getChats()
  Future<ChatModel> createOrGetChat({...})
  
  // Message Management
  Future<List<MessageModel>> getMessages(String chatId)
  Future<MessageModel> sendMessage({...})
  Future<MessageModel> sendImageMessage({...})
  Future<MessageModel> sendFileMessage({...})
  
  // Status Management
  Future<void> markAsRead(String chatId, String messageId)
  Future<void> markChatAsRead(String chatId)
  
  // Real-time Features
  void startTyping(String chatId, String receiverId)
  void stopTyping(String chatId, String receiverId)
  
  // Search
  Future<List<MessageModel>> searchMessages(String query)
}
```

#### **Usage Example**
```dart
// Initialize messaging service
final messagingService = MessagingService();
await messagingService.initialize();

// Create or get chat
final chat = await messagingService.createOrGetChat(
  bookingId: 'booking_123',
  clientId: 'client_456',
  clientName: 'John Doe',
  providerId: 'provider_789',
  providerName: 'ABC Services',
  serviceType: 'Plumbing',
);

// Send text message
await messagingService.sendMessage(
  chatId: chat.id,
  receiverId: 'provider_789',
  content: 'Hello, when can you start the work?',
);

// Send image message
await messagingService.sendImageMessage(
  chatId: chat.id,
  receiverId: 'provider_789',
  imageFile: imageFile,
  caption: 'Here is the problem area',
);

// Listen to incoming messages
messagingService.messageStream.listen((message) {
  print('New message: ${message.content}');
});
```

### **Backend Implementation**

#### **REST API Endpoints**
```javascript
// Chat Management
GET    /api/chats                    // Get user's chats
POST   /api/chats                    // Create new chat
GET    /api/chats/:id                // Get specific chat
PATCH  /api/chats/:id                // Update chat
DELETE /api/chats/:id                // Delete chat

// Message Management
GET    /api/chats/:id/messages       // Get chat messages
POST   /api/chats/:id/messages       // Send message
PATCH  /api/chats/:id/messages/:msgId/read  // Mark as read
DELETE /api/chats/:id/messages/:msgId       // Delete message

// File Upload
POST   /api/chats/:id/upload         // Upload file for chat

// Search
GET    /api/messages/search          // Search all messages
GET    /api/chats/:id/messages/search // Search chat messages
```

#### **WebSocket Events**
```javascript
// Client → Server Events
'send_message'        // Send new message
'mark_as_read'        // Mark message as read
'start_typing'        // Start typing indicator
'stop_typing'         // Stop typing indicator
'join_chat'           // Join chat room
'leave_chat'          // Leave chat room

// Server → Client Events
'new_message'         // New message received
'message_status_update' // Message status changed
'user_typing'         // User typing status
'message_notification' // Message notification
'chat_updated'        // Chat information updated
'user_online_status'  // User online/offline status
```

#### **Database Schema**

**Chat Model**
```javascript
const chatSchema = new mongoose.Schema({
  bookingId: { type: ObjectId, ref: 'Booking', required: true },
  clientId: { type: ObjectId, ref: 'Client', required: true },
  clientName: { type: String, required: true },
  providerId: { type: ObjectId, ref: 'ServiceProvider', required: true },
  providerName: { type: String, required: true },
  serviceType: { type: String, required: true },
  lastMessage: {
    content: String,
    timestamp: Date,
    senderId: ObjectId,
    senderType: String
  },
  unreadCount: {
    client: { type: Number, default: 0 },
    provider: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked', 'completed'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

**Message Model**
```javascript
const messageSchema = new mongoose.Schema({
  chatId: { type: ObjectId, ref: 'Chat', required: true },
  senderId: { type: ObjectId, required: true },
  senderName: { type: String, required: true },
  senderType: { type: String, enum: ['client', 'provider'], required: true },
  receiverId: { type: ObjectId, required: true },
  receiverName: { type: String, required: true },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video', 'location', 'system', 'call_invite', 'payment_request'],
    default: 'text'
  },
  attachments: [String],
  replyToMessageId: { type: ObjectId, ref: 'Message' },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  isDelivered: { type: Boolean, default: false },
  deliveredAt: Date,
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  createdAt: { type: Date, default: Date.now }
});
```

## 📞 **Voice/Video Calling System**

### **Features**
- ✅ Voice-only calls
- ✅ Video calls with camera controls
- ✅ Call invitation system
- ✅ Call history tracking
- ✅ Missed call notifications
- ✅ Call quality indicators
- ✅ Speaker/mute controls
- ✅ Camera switching (front/back)

### **Technology Stack**
- **Agora RTC**: WebRTC implementation
- **WebSocket**: Call signaling
- **REST API**: Call history and management

### **Call Flow**
```
1. Caller initiates call → WebSocket 'initiate_call'
2. Server routes to receiver → 'incoming_call' event
3. Receiver accepts/declines → 'accept_call'/'decline_call'
4. Agora channel joined → Voice/Video stream established
5. Call ends → 'end_call' event → History saved
```

### **Frontend Implementation**

#### **EnhancedCallService API**
```dart
class EnhancedCallService {
  // Call Management
  Future<void> initiateCall({
    required String receiverId,
    required String receiverName,
    required bool isVideoCall,
    String? bookingId,
  })
  
  Future<void> endCall()
  Future<void> joinChannel(String channelId, {int? uid})
  
  // Audio Controls
  Future<void> toggleMute()
  Future<void> toggleSpeaker()
  
  // Video Controls (for video calls)
  Future<void> toggleVideo()
  Future<void> switchCamera()
  
  // State Management
  Stream<CallState> get callStateStream
  Stream<IncomingCallData> get incomingCallStream
  
  // Getters
  bool get isCallActive
  bool get isMuted
  bool get isVideoEnabled
  bool get isSpeakerEnabled
}
```

#### **Call States**
```dart
enum CallState {
  idle,              // No active call
  calling,           // Outgoing call ringing
  connecting,        // Call being established
  connected,         // Call active
  ended,             // Call ended normally
  declined,          // Call declined by receiver
  busy,              // Receiver is busy
  error,             // Call error occurred
  remoteUserJoined,  // Other party joined
  remoteUserLeft,    // Other party left
  accepted,          // Call accepted
  audioToggled,      // Audio muted/unmuted
  videoToggled,      // Video enabled/disabled
  speakerToggled,    // Speaker on/off
  cameraSwitched     // Camera switched
}
```

### **Backend Implementation**

#### **Call Routes**
```javascript
// Call History
GET    /api/calls                    // Get user's call history
POST   /api/calls                    // Log call record
GET    /api/calls/:id                // Get specific call
PATCH  /api/calls/:id                // Update call status

// Call Management
POST   /api/calls/initiate           // Initiate call
POST   /api/calls/:id/end            // End call
GET    /api/calls/missed             // Get missed calls
```

#### **WebSocket Call Events**
```javascript
// Call Signaling
'initiate_call'       // Start call invitation
'incoming_call'       // Call invitation received
'accept_call'         // Accept incoming call
'decline_call'        // Decline incoming call
'end_call'            // End active call
'call_busy'           // Receiver is busy
'call_accepted'       // Call was accepted
'call_declined'       // Call was declined
'call_ended'          // Call ended by other party
```

## 🔔 **Enhanced Notification System**

### **Notification Types**
```typescript
enum NotificationType {
  // Booking related
  bookingRequest, bookingAccepted, bookingRejected, 
  bookingCancelled, bookingModified, bookingReminder,
  
  // Service related
  serviceStarted, serviceCompleted, serviceOnTheWay,
  serviceDelayed, serviceRescheduled,
  
  // Payment related
  paymentDue, paymentReceived, paymentFailed,
  paymentRefunded, paymentOverdue,
  
  // Communication
  newMessage, missedCall, callRequest,
  
  // Account related
  accountVerified, accountBlocked, profileUpdated,
  
  // Rating & Reviews
  ratingRequest, newReview, ratingReceived,
  
  // System notifications
  systemMaintenance, systemUpdate, appUpdate, emergency,
  
  // Marketing & Promotions
  promotion, newsletter, announcement,
  
  // Location & Tracking
  providerNearby, locationUpdate,
  
  // General
  general, reminder, alert, info
}
```

### **Notification Features**
- ✅ Push notifications (Firebase)
- ✅ In-app notifications
- ✅ Email notifications
- ✅ SMS notifications
- ✅ Action buttons on notifications
- ✅ Rich media notifications (images)
- ✅ Scheduled notifications
- ✅ Notification preferences
- ✅ Notification history

### **Implementation**
```dart
// Create notification
await notificationService.createNotification({
  'recipientId': userId,
  'type': 'BOOKING_ACCEPTED',
  'title': 'Booking Confirmed',
  'message': 'Your plumbing service has been confirmed',
  'data': {
    'bookingId': 'booking_123',
    'providerId': 'provider_456'
  },
  'actions': [
    {
      'id': 'view',
      'title': 'View Details',
      'action': 'navigate',
      'data': {'screen': '/booking/booking_123'}
    },
    {
      'id': 'message',
      'title': 'Message Provider',
      'action': 'open_chat',
      'data': {'providerId': 'provider_456'}
    }
  ]
});
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# JWT for WebSocket authentication
JWT_SECRET=your_jwt_secret_here

# Agora configuration
AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_CERTIFICATE=your_agora_certificate_here

# File upload settings
MAX_FILE_SIZE=10MB
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# WebSocket settings
WEBSOCKET_PORT=5000
WEBSOCKET_CORS_ORIGIN=*
```

### **Required Dependencies**

**Frontend (pubspec.yaml)**
```yaml
dependencies:
  socket_io_client: ^2.0.3
  agora_rtc_engine: ^6.3.0
  image_picker: ^1.0.4
  file_picker: ^6.1.1
  permission_handler: ^11.0.1
  vibration: ^1.8.4
  flutter_ringtone_player: ^4.0.0
```

**Backend (package.json)**
```json
{
  "dependencies": {
    "socket.io": "^4.7.5",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5",
    "mongoose": "^8.0.3"
  }
}
```

## 📱 **Usage Examples**

### **Complete Chat Implementation**
```dart
class ChatScreen extends StatefulWidget {
  final String chatId;
  final String receiverId;
  final String receiverName;
}

class _ChatScreenState extends State<ChatScreen> {
  final MessagingService _messagingService = MessagingService();
  final TextEditingController _messageController = TextEditingController();
  List<MessageModel> _messages = [];
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _setupMessageListener();
    _setupTypingListener();
  }

  void _loadMessages() async {
    final messages = await _messagingService.getMessages(widget.chatId);
    setState(() => _messages = messages);
  }

  void _setupMessageListener() {
    _messagingService.messageStream.listen((message) {
      if (message.chatId == widget.chatId) {
        setState(() => _messages.insert(0, message));
        if (message.senderId != widget.receiverId) {
          _messagingService.markAsRead(widget.chatId, message.id);
        }
      }
    });
  }

  void _sendMessage() async {
    if (_messageController.text.trim().isEmpty) return;
    
    final content = _messageController.text;
    _messageController.clear();
    
    await _messagingService.sendMessage(
      chatId: widget.chatId,
      receiverId: widget.receiverId,
      content: content,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.receiverName),
        actions: [
          IconButton(
            icon: Icon(Icons.call),
            onPressed: () => _initiateCall(false),
          ),
          IconButton(
            icon: Icon(Icons.videocam),
            onPressed: () => _initiateCall(true),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              reverse: true,
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                return MessageBubble(message: _messages[index]);
              },
            ),
          ),
          if (_isTyping) TypingIndicator(),
          MessageInput(
            controller: _messageController,
            onSend: _sendMessage,
            onTyping: _handleTyping,
          ),
        ],
      ),
    );
  }
}
```

## 🔒 **Security Considerations**

### **Authentication**
- JWT tokens for WebSocket authentication
- User permission validation for chat access
- Rate limiting on message sending

### **Data Privacy**
- End-to-end encryption for sensitive messages
- Message retention policies
- User data anonymization options

### **File Upload Security**
- File type validation
- File size limits
- Virus scanning for uploaded files
- Secure file storage with signed URLs

## 📊 **Performance Optimization**

### **Message Pagination**
- Load messages in chunks (50 per page)
- Implement infinite scrolling
- Cache frequently accessed chats

### **WebSocket Optimization**
- Connection pooling
- Automatic reconnection
- Message queuing for offline users

### **File Handling**
- Image compression before upload
- Progressive image loading
- CDN for file delivery

## 🐛 **Error Handling**

### **Connection Errors**
```dart
// Handle WebSocket disconnection
_webSocketService.onDisconnect.listen(() {
  // Show offline indicator
  // Queue messages for later delivery
  // Attempt reconnection
});

// Handle message send failures
try {
  await _messagingService.sendMessage(...);
} catch (e) {
  // Show error indicator
  // Retry mechanism
  // Fallback to SMS/email
}
```

### **Call Failures**
```dart
// Handle call connection issues
_callService.callStateStream.listen((state) {
  switch (state) {
    case CallState.error:
      // Show error dialog
      // Offer retry option
      break;
    case CallState.busy:
      // Show busy message
      // Suggest messaging instead
      break;
  }
});
```

## 📈 **Analytics & Monitoring**

### **Key Metrics**
- Message delivery rates
- Call success rates
- User engagement metrics
- Response time analytics
- Error frequency tracking

### **Logging**
```javascript
// WebSocket event logging
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId} at ${new Date()}`);
  
  socket.on('send_message', (data) => {
    console.log(`Message sent: ${socket.userId} → ${data.receiverId}`);
  });
});
```

## 🚀 **Deployment**

### **Production Checklist**
- [ ] Configure Agora production credentials
- [ ] Set up CDN for file uploads
- [ ] Configure Firebase for push notifications
- [ ] Set up monitoring and logging
- [ ] Test WebSocket scalability
- [ ] Configure SSL certificates
- [ ] Set up database backups

### **Scaling Considerations**
- **Horizontal scaling**: Multiple WebSocket servers with Redis
- **Database optimization**: Message archiving and indexing
- **CDN usage**: Global file delivery
- **Load balancing**: Distribute WebSocket connections

---

## 📞 **Support**

For technical support or questions about the communication system:
- **Documentation**: `/docs/communication.md`
- **API Reference**: `/docs/api.md`
- **WebSocket Events**: `/docs/websocket-events.md`
- **Troubleshooting**: `/docs/troubleshooting.md`