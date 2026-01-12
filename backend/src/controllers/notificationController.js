const Notification = require('../models/Notification');
const { sendNotificationRead, sendAllNotificationsRead, sendNotificationDeleted, sendUnreadCountUpdate } = require('../services/socketService');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, unreadOnly = false } = req.query;

    const query = { userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông báo',
      error: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    // Emit realtime event
    sendNotificationRead(userId, id);
    
    // Update unread count
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    sendUnreadCountUpdate(userId, unreadCount);

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông báo',
      error: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    // Emit realtime event
    sendAllNotificationsRead(userId);
    sendUnreadCountUpdate(userId, 0);

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông báo',
      error: error.message
    });
  }

};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    // Emit realtime event
    sendNotificationDeleted(userId, id);
    
    // Update unread count
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    sendUnreadCountUpdate(userId, unreadCount);

    res.status(200).json({
      success: true,
      message: 'Đã xóa thông báo'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa thông báo',
      error: error.message
    });
  }

    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa thông báo',
      error: error.message
    });
};  

// @desc    Test send mood reminder
// @route   POST /api/notifications/test-mood-reminder
// @access  Private (for testing)
exports.testMoodReminder = async (req, res) => {
  try {
    const { sendMoodReminderEmail, createNotification } = require('../services/notificationService');
    const user = req.user;

    // Send email
    const emailSent = await sendMoodReminderEmail(user);
    
    // Create notification
    const notification = await createNotification(
      user._id,
      '🌟 Nhắc nhở: Ghi lại cảm xúc hôm nay!',
      'Đây là email test. Hãy dành vài giây để ghi lại cảm xúc của bạn.',
      'mood_checkin'
    );

    res.status(200).json({
      success: true,
      message: 'Đã gửi email và tạo thông báo test',
      emailSent,
      notification
    });
  } catch (error) {
    console.error('Test reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi thông báo test',
      error: error.message
    });
  }
};

// @desc    Test task reminder (for development)
// @route   POST /api/notifications/test-task-reminder
// @access  Private
exports.testTaskReminder = async (req, res) => {
  try {
    const { sendTaskReminders } = require('../services/notificationService');
    const result = await sendTaskReminders();
    
    res.status(200).json({
      success: true,
      message: 'Task reminder test completed',
      result
    });
  } catch (error) {
    console.error('Test task reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi test task reminder',
      error: error.message
    });
  }
};

// @desc    Test study session reminder (for development)
// @route   POST /api/notifications/test-study-reminder
// @access  Private
exports.testStudyReminder = async (req, res) => {
  try {
    const { sendStudySessionReminders } = require('../services/notificationService');
    const result = await sendStudySessionReminders();
    
    res.status(200).json({
      success: true,
      message: 'Study session reminder test completed',
      result
    });
  } catch (error) {
    console.error('Test study reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi test study reminder',
      error: error.message
    });
  }
};

// @desc    Test deadline reminder (for development)
// @route   POST /api/notifications/test-deadline-reminder
// @access  Private
exports.testDeadlineReminder = async (req, res) => {
  try {
    const { sendDeadlineReminders } = require('../services/notificationService');
    const result = await sendDeadlineReminders();
    
    res.status(200).json({
      success: true,
      message: 'Deadline reminder test completed',
      result
    });
  } catch (error) {
    console.error('Test deadline reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi test deadline reminder',
      error: error.message
    });
  }
};

// @desc    Get mood analysis for current user
// @route   GET /api/notifications/mood-analysis
// @access  Private
exports.getMoodAnalysis = async (req, res) => {
  try {
    const { analyzeMoodTrend, getCurrentEmotionalState, analyzeBestStudyTime } = require('../services/moodAnalysisService');
    const userId = req.user._id;

    const [weekTrend, emotionalState, bestStudyTime] = await Promise.all([
      analyzeMoodTrend(userId, 7),
      getCurrentEmotionalState(userId),
      analyzeBestStudyTime(userId)
    ]);

    res.status(200).json({
      success: true,
      data: {
        weekTrend,
        emotionalState,
        bestStudyTime
      }
    });
  } catch (error) {
    console.error('Get mood analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi phân tích mood',
      error: error.message
    });
  }
};

// @desc    Create achievement notification
// @route   POST /api/notifications/achievement
// @access  Private
exports.createAchievement = async (req, res) => {
  try {
    const { createAchievementNotification } = require('../services/notificationService');
    const { achievementType, data } = req.body;
    
    if (!achievementType) {
      return res.status(400).json({
        success: false,
        message: 'Achievement type is required'
      });
    }

    const notification = await createAchievementNotification(
      req.user._id,
      achievementType,
      data || {}
    );

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Achievement notification created'
    });
  } catch (error) {
    console.error('Create achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo achievement notification',
      error: error.message
    });
  }
};

