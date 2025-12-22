const nodemailer = require('nodemailer');
const User = require('../models/User');
const MoodTracking = require('../models/MoodTracking');
const Notification = require('../models/Notification');
const Task = require('../models/Task');
const StudySessionSchedule = require('../models/StudySessionSchedule');
const Deadline = require('../models/Deadline');
const Subject = require('../models/Subject');
const { sendNewNotification, sendUnreadCountUpdate } = require('./socketService');
const {
  generateTaskReminderMessage,
  generateStudyReminderMessage,
  generateDeadlineReminderMessage,
  generateAchievementMessage,
  formatTimeUntil
} = require('./personalizedMessageService');

// Create email transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email credentials not configured');
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send mood check-in reminder email
const sendMoodReminderEmail = async (user) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('Email service not configured');
    return false;
  }

  try {
    const mailOptions = {
      from: `"S-Techdy" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '🌟 Nhắc nhở: Ghi lại cảm xúc hôm nay!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 20px;
              padding: 40px;
              text-align: center;
              color: white;
            }
            .emoji {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 {
              margin: 0 0 16px 0;
              font-size: 28px;
            }
            p {
              margin: 0 0 24px 0;
              font-size: 16px;
              opacity: 0.95;
            }
            .btn {
              display: inline-block;
              padding: 14px 32px;
              background: white;
              color: #667eea;
              text-decoration: none;
              border-radius: 25px;
              font-weight: 600;
              font-size: 16px;
              transition: transform 0.2s;
            }
            .btn:hover {
              transform: scale(1.05);
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid rgba(255,255,255,0.2);
              font-size: 14px;
              opacity: 0.8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="emoji">😊</div>
            <h1>Xin chào ${user.name}!</h1>
            <p>
              Hôm nay bạn cảm thấy thế nào? Hãy dành vài giây để ghi lại cảm xúc của bạn.
              Theo dõi tâm trạng giúp bạn hiểu rõ hơn về bản thân và cải thiện sức khỏe tinh thần! 💙
            </p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mood" class="btn">
              Ghi lại cảm xúc ngay
            </a>
            <div class="footer">
              <p>S-Techdy - Your Study Companion</p>
              <p style="font-size: 12px;">
                Bạn nhận được email này vì đã bật thông báo nhắc nhở trong cài đặt.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Mood reminder email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending mood reminder email:', error);
    return false;
  }
};

// Create in-app notification
const createNotification = async (userId, title, message, type = 'reminder') => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date()
    });
    
    // Emit realtime notification via Socket.IO
    sendNewNotification(userId, notification);
    
    // Update unread count
    const unreadCount = await Notification.countDocuments({ 
      userId, 
      read: false 
    });
    sendUnreadCountUpdate(userId, unreadCount);
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Check and send mood reminders to users who haven't checked in today
const sendDailyMoodReminders = async () => {
  try {
    console.log('Starting daily mood reminder check...');

    // Get all users with notifications enabled
    const users = await User.find({
      'notificationSettings.studyReminder': true
    });

    console.log(`Found ${users.length} users with notifications enabled`);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let sentCount = 0;
    let notificationCount = 0;

    for (const user of users) {
      // Check if user has already checked in today
      const todayMood = await MoodTracking.findOne({
        userId: user._id,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      // If no mood entry today, send reminder
      if (!todayMood) {
        // Send email if email notifications enabled
        if (user.notificationSettings.dailyEmail) {
          const emailSent = await sendMoodReminderEmail(user);
          if (emailSent) sentCount++;
        }

        // Create in-app notification
        await createNotification(
          user._id,
          '🌟 Nhắc nhở: Ghi lại cảm xúc hôm nay!',
          'Hãy dành vài giây để ghi lại cảm xúc của bạn. Điều này giúp bạn theo dõi sức khỏe tinh thần tốt hơn!',
          'mood_reminder'
        );
        notificationCount++;
      }
    }

    console.log(`Mood reminders sent: ${sentCount} emails, ${notificationCount} notifications`);
    return { emailsSent: sentCount, notificationsCreated: notificationCount };
  } catch (error) {
    console.error('Error in sendDailyMoodReminders:', error);
    throw error;
  }
};

// Send evening reminder (for users who haven't checked in yet)
const sendEveningMoodReminder = async () => {
  console.log('Sending evening mood reminders...');
  return await sendDailyMoodReminders();
};

/**
 * Send task reminders to users
 * Checks for tasks due within next 24 hours
 */
const sendTaskReminders = async () => {
  try {
    console.log('Starting task reminder check...');

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find tasks that are due within 24 hours and not completed
    const tasks = await Task.find({
      status: { $ne: 'done' },
      dueDate: { $gte: now, $lte: tomorrow },
      'reminder.enabled': true
    }).populate('userId');

    console.log(`Found ${tasks.length} tasks needing reminders`);

    let sentCount = 0;

    for (const task of tasks) {
      if (!task.userId) continue;

      // Check if user wants task reminders
      if (!task.userId.notificationSettings?.studyReminder) continue;

      // Check if we already sent a reminder today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingNotification = await Notification.findOne({
        userId: task.userId._id,
        type: 'task_reminder',
        relatedId: task._id,
        createdAt: { $gte: today }
      });

      if (existingNotification) continue;

      // Generate personalized message
      const { title, message, icon } = await generateTaskReminderMessage(task, task.userId);

      // Create notification
      await Notification.create({
        userId: task.userId._id,
        type: 'task_reminder',
        title,
        message,
        icon,
        priority: task.priority === 'high' ? 'high' : 'normal',
        relatedId: task._id,
        relatedType: 'Task',
        actionUrl: `/tasks/${task._id}`,
        actionLabel: 'Xem task'
      });

      sentCount++;

      // Send email if enabled
      if (task.userId.notificationSettings?.dailyEmail) {
        await sendTaskReminderEmail(task, task.userId, message);
      }
    }

    console.log(`Task reminders sent: ${sentCount} notifications`);
    return { notificationsSent: sentCount };
  } catch (error) {
    console.error('Error sending task reminders:', error);
    throw error;
  }
};

/**
 * Send study session reminders
 * Checks for sessions starting within next 30 minutes
 */
const sendStudySessionReminders = async () => {
  try {
    console.log('Starting study session reminder check...');

    const now = new Date();
    const in30Minutes = new Date(now);
    in30Minutes.setMinutes(in30Minutes.getMinutes() + 30);

    // Find study sessions starting soon
    const sessions = await StudySessionSchedule.find({
      startTime: { $gte: now, $lte: in30Minutes },
      isCompleted: false,
      isCancelled: false
    }).populate('userId subjectId');

    console.log(`Found ${sessions.length} upcoming study sessions`);

    let sentCount = 0;

    for (const session of sessions) {
      if (!session.userId) continue;

      // Check if user wants study reminders
      if (!session.userId.notificationSettings?.studyReminder) continue;

      // Check if we already sent a reminder for this session
      const existingNotification = await Notification.findOne({
        userId: session.userId._id,
        type: 'study_reminder',
        relatedId: session._id,
        createdAt: { $gte: new Date(now.getTime() - 3600000) } // Within last hour
      });

      if (existingNotification) continue;

      // Calculate time until session
      const timeUntil = formatTimeUntil(session.startTime);

      // Generate personalized message
      const { title, message, icon } = await generateStudyReminderMessage(
        session,
        session.userId,
        'before_session',
        timeUntil
      );

      // Create notification
      await Notification.create({
        userId: session.userId._id,
        type: 'study_reminder',
        title,
        message,
        icon,
        priority: 'normal',
        relatedId: session._id,
        relatedType: 'StudySession',
        actionUrl: `/study-sessions/${session._id}`,
        actionLabel: 'Xem lịch học',
        metadata: {
          subjectName: session.subjectId?.name || 'Unknown',
          startTime: session.startTime
        }
      });

      sentCount++;

      // Send email if enabled
      if (session.userId.notificationSettings?.dailyEmail) {
        await sendStudySessionReminderEmail(session, session.userId, message);
      }
    }

    console.log(`Study session reminders sent: ${sentCount} notifications`);
    return { notificationsSent: sentCount };
  } catch (error) {
    console.error('Error sending study session reminders:', error);
    throw error;
  }
};

/**
 * Send deadline reminders
 * Checks for deadlines approaching (24h, 3 days, 1 week)
 */
const sendDeadlineReminders = async () => {
  try {
    console.log('Starting deadline reminder check...');

    const now = new Date();
    const in24Hours = new Date(now);
    in24Hours.setHours(in24Hours.getHours() + 24);
    
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);
    
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);

    // Find upcoming deadlines
    const deadlines = await Deadline.find({
      dueDate: { $gte: now, $lte: in7Days },
      isCompleted: false,
      status: { $nin: ['completed', 'cancelled'] }
    }).populate('userId subjectId');

    console.log(`Found ${deadlines.length} upcoming deadlines`);

    let sentCount = 0;

    for (const deadline of deadlines) {
      if (!deadline.userId) continue;

      // Check if user wants deadline reminders
      if (!deadline.userId.notificationSettings?.deadlineReminder) continue;

      const hoursUntil = (deadline.dueDate - now) / (1000 * 60 * 60);
      
      // Determine if we should send a reminder based on time remaining
      let shouldSend = false;
      let reminderType = '';

      if (hoursUntil <= 24) {
        reminderType = '24h';
        shouldSend = true;
      } else if (hoursUntil <= 72 && hoursUntil > 48) {
        reminderType = '3days';
        shouldSend = true;
      } else if (hoursUntil <= 168 && hoursUntil > 144) {
        reminderType = '7days';
        shouldSend = true;
      }

      if (!shouldSend) continue;

      // Check if we already sent this type of reminder
      const existingNotification = await Notification.findOne({
        userId: deadline.userId._id,
        type: 'task_reminder',
        relatedId: deadline._id,
        'metadata.reminderType': reminderType
      });

      if (existingNotification) continue;

      // Generate personalized message
      const { title, message, icon, priority } = await generateDeadlineReminderMessage(
        deadline,
        deadline.userId,
        hoursUntil
      );

      // Create notification
      await Notification.create({
        userId: deadline.userId._id,
        type: 'task_reminder',
        title,
        message,
        icon,
        priority,
        relatedId: deadline._id,
        relatedType: 'Task',
        actionUrl: `/deadlines/${deadline._id}`,
        actionLabel: 'Xem deadline',
        metadata: {
          reminderType,
          hoursUntil: Math.round(hoursUntil),
          deadlineType: deadline.deadlineType
        }
      });

      sentCount++;

      // Send email if enabled and urgent
      if (deadline.userId.notificationSettings?.dailyEmail && hoursUntil <= 24) {
        await sendDeadlineReminderEmail(deadline, deadline.userId, message);
      }
    }

    console.log(`Deadline reminders sent: ${sentCount} notifications`);
    return { notificationsSent: sentCount };
  } catch (error) {
    console.error('Error sending deadline reminders:', error);
    throw error;
  }
};

/**
 * Send task reminder email
 */
const sendTaskReminderEmail = async (task, user, message) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  try {
    const dueDate = new Date(task.dueDate).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const mailOptions = {
      from: `"S-Techdy" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `⏰ Nhắc nhở Task: ${task.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; padding: 40px; color: white; }
            .priority-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
            .high { background: #ff6b6b; }
            .medium { background: #ffa500; }
            .low { background: #51cf66; }
            h1 { margin: 0 0 16px 0; font-size: 24px; }
            .task-info { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin: 20px 0; }
            .btn { display: inline-block; padding: 14px 32px; background: white; color: #667eea; text-decoration: none; border-radius: 25px; font-weight: 600; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="priority-badge ${task.priority}">${task.priority === 'high' ? 'Ưu tiên cao' : task.priority === 'medium' ? 'Ưu tiên vừa' : 'Ưu tiên thấp'}</div>
            <h1>⏰ Task cần hoàn thành!</h1>
            <div class="task-info">
              <h2 style="margin-top: 0;">${task.title}</h2>
              ${task.description ? `<p>${task.description}</p>` : ''}
              <p><strong>📅 Deadline:</strong> ${dueDate}</p>
            </div>
            <p style="font-size: 16px;">${message}</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks" class="btn">Xem task ngay</a>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Task reminder email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending task reminder email:', error);
    return false;
  }
};

/**
 * Send study session reminder email
 */
const sendStudySessionReminderEmail = async (session, user, message) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  try {
    const startTime = new Date(session.startTime).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const mailOptions = {
      from: `"S-Techdy" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `📚 Nhắc nhở: Buổi học ${session.subjectId?.name || 'sắp bắt đầu'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 20px; padding: 40px; color: white; text-align: center; }
            .emoji { font-size: 64px; margin-bottom: 20px; }
            h1 { margin: 0 0 16px 0; font-size: 28px; }
            .session-info { background: rgba(255,255,255,0.2); padding: 20px; border-radius: 12px; margin: 20px 0; }
            .btn { display: inline-block; padding: 14px 32px; background: white; color: #f5576c; text-decoration: none; border-radius: 25px; font-weight: 600; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="emoji">📚</div>
            <h1>Sắp đến giờ học!</h1>
            <div class="session-info">
              <h2 style="margin-top: 0;">${session.subjectId?.name || 'Môn học'}</h2>
              <p><strong>⏰ Thời gian:</strong> ${startTime}</p>
              ${session.location ? `<p><strong>📍 Địa điểm:</strong> ${session.location}</p>` : ''}
            </div>
            <p style="font-size: 16px;">${message}</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/calendar" class="btn">Xem lịch học</a>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Study session reminder email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending study session reminder email:', error);
    return false;
  }
};

/**
 * Send deadline reminder email
 */
const sendDeadlineReminderEmail = async (deadline, user, message) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  try {
    const dueDate = new Date(deadline.dueDate).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const mailOptions = {
      from: `"S-Techdy" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `🚨 Deadline sắp đến: ${deadline.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); border-radius: 20px; padding: 40px; color: white; }
            .urgency-badge { display: inline-block; padding: 8px 16px; background: rgba(255,255,255,0.3); border-radius: 20px; font-weight: 600; margin-bottom: 20px; }
            h1 { margin: 0 0 16px 0; font-size: 26px; }
            .deadline-info { background: rgba(255,255,255,0.15); padding: 20px; border-radius: 12px; margin: 20px 0; }
            .btn { display: inline-block; padding: 14px 32px; background: white; color: #ff6b6b; text-decoration: none; border-radius: 25px; font-weight: 600; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="urgency-badge">⚠️ KHẨN CẤP</div>
            <h1>🚨 Deadline sắp đến!</h1>
            <div class="deadline-info">
              <h2 style="margin-top: 0;">${deadline.title}</h2>
              ${deadline.description ? `<p>${deadline.description}</p>` : ''}
              <p><strong>📅 Hạn chót:</strong> ${dueDate}</p>
              <p><strong>📚 Môn:</strong> ${deadline.subjectId?.name || 'N/A'}</p>
              <p><strong>📋 Loại:</strong> ${deadline.deadlineType || 'N/A'}</p>
            </div>
            <p style="font-size: 16px;">${message}</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/deadlines" class="btn">Xem deadline</a>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Deadline reminder email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending deadline reminder email:', error);
    return false;
  }
};

/**
 * Create achievement notification
 */
const createAchievementNotification = async (userId, achievementType, data) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const { title, message, icon } = await generateAchievementMessage(achievementType, data, user);

    const notification = await Notification.create({
      userId,
      type: achievementType === 'level_up' ? 'level_up' : 
            achievementType === 'streak_milestone' ? 'streak_milestone' : 'achievement',
      title,
      message,
      icon,
      priority: 'high',
      metadata: data
    });

    return notification;
  } catch (error) {
    console.error('Error creating achievement notification:', error);
    return null;
  }
};

module.exports = {
  sendMoodReminderEmail,
  createNotification,
  sendDailyMoodReminders,
  sendEveningMoodReminder,
  sendTaskReminders,
  sendStudySessionReminders,
  sendDeadlineReminders,
  createAchievementNotification
};

