const nodemailer = require('nodemailer');
const User = require('../models/User');
const MoodTracking = require('../models/MoodTracking');
const Notification = require('../models/Notification');

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

module.exports = {
  sendMoodReminderEmail,
  createNotification,
  sendDailyMoodReminders,
  sendEveningMoodReminder
};
