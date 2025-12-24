const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;
const userSockets = new Map(); // Map userId to socket.id

/**
 * Initialize Socket.IO server
 * @param {http.Server} server - HTTP server instance
 */
const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket
      socket.userId = user._id.toString();
      socket.user = user;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`✅ User connected: ${socket.user.name} (${userId})`);

    // Store socket connection
    userSockets.set(userId, socket.id);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Send connection success
    socket.emit('connected', {
      message: 'Connected to notification server',
      userId: userId
    });

    // Handle manual notification request
    socket.on('request:notifications', () => {
      console.log(`User ${userId} requested notifications`);
      // Trigger notification fetch (handled by frontend)
      socket.emit('notification:update', {
        type: 'fetch',
        message: 'Notifications updated'
      });
    });

    // Handle mark as read
    socket.on('notification:mark-read', (data) => {
      console.log(`User ${userId} marked notification ${data.notificationId} as read`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.name} (${userId})`);
      userSockets.delete(userId);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('✅ Socket.IO initialized successfully');
  return io;
};

/**
 * Get Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

/**
 * Emit notification to specific user
 * @param {String} userId - User ID
 * @param {String} event - Event name
 * @param {Object} data - Event data
 */
const emitToUser = (userId, event, data) => {
  try {
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit event');
      return false;
    }

    const userIdStr = userId.toString();
    io.to(`user:${userIdStr}`).emit(event, data);
    
    console.log(`📤 Emitted '${event}' to user ${userIdStr}`);
    return true;
  } catch (error) {
    console.error('Error emitting to user:', error);
    return false;
  }
};

/**
 * Emit notification to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {String} event - Event name
 * @param {Object} data - Event data
 */
const emitToUsers = (userIds, event, data) => {
  try {
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit event');
      return false;
    }

    userIds.forEach(userId => {
      emitToUser(userId, event, data);
    });

    return true;
  } catch (error) {
    console.error('Error emitting to users:', error);
    return false;
  }
};

/**
 * Send new notification event
 * @param {String} userId - User ID
 * @param {Object} notification - Notification object
 */
const sendNewNotification = (userId, notification) => {
  return emitToUser(userId, 'notification:new', {
    notification,
    timestamp: new Date()
  });
};

/**
 * Send notification count update
 * @param {String} userId - User ID
 * @param {Number} unreadCount - Unread count
 */
const sendUnreadCountUpdate = (userId, unreadCount) => {
  return emitToUser(userId, 'notification:unread-count', {
    unreadCount,
    timestamp: new Date()
  });
};

/**
 * Send notification marked as read event
 * @param {String} userId - User ID
 * @param {String} notificationId - Notification ID
 */
const sendNotificationRead = (userId, notificationId) => {
  return emitToUser(userId, 'notification:read', {
    notificationId,
    timestamp: new Date()
  });
};

/**
 * Send all notifications marked as read event
 * @param {String} userId - User ID
 */
const sendAllNotificationsRead = (userId) => {
  return emitToUser(userId, 'notification:all-read', {
    timestamp: new Date()
  });
};

/**
 * Send notification deleted event
 * @param {String} userId - User ID
 * @param {String} notificationId - Notification ID
 */
const sendNotificationDeleted = (userId, notificationId) => {
  return emitToUser(userId, 'notification:deleted', {
    notificationId,
    timestamp: new Date()
  });
};

/**
 * Broadcast system announcement to all connected users
 * @param {Object} announcement - Announcement data
 */
const broadcastAnnouncement = (announcement) => {
  try {
    if (!io) {
      console.warn('Socket.IO not initialized');
      return false;
    }

    io.emit('system:announcement', announcement);
    console.log('📢 Broadcasted system announcement');
    return true;
  } catch (error) {
    console.error('Error broadcasting announcement:', error);
    return false;
  }
};

/**
 * Get online users count
 */
const getOnlineUsersCount = () => {
  return userSockets.size;
};

/**
 * Check if user is online
 * @param {String} userId - User ID
 */
const isUserOnline = (userId) => {
  return userSockets.has(userId.toString());
};

/**
 * Get all online user IDs
 */
const getOnlineUserIds = () => {
  return Array.from(userSockets.keys());
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToUsers,
  sendNewNotification,
  sendUnreadCountUpdate,
  sendNotificationRead,
  sendAllNotificationsRead,
  sendNotificationDeleted,
  broadcastAnnouncement,
  getOnlineUsersCount,
  isUserOnline,
  getOnlineUserIds
};
