const cron = require('node-cron');
const StudySessionSchedule = require('../models/StudySessionSchedule');
const User = require('../models/User');
const { sendReminderEmail, sendStartSessionEmail, sendCompletionEmail } = require('./emailService');
const crypto = require('crypto');

// Lưu trữ các session đã gửi reminder và đã xác nhận
const reminderSent = new Map(); // sessionId -> { sent: boolean, confirmed: boolean, token: string }
const startEmailSent = new Set(); // sessionId

// Tạo token bảo mật cho action links
const generateActionToken = (sessionId, userId) => {
  return crypto
    .createHash('sha256')
    .update(`${sessionId}-${userId}-${process.env.JWT_SECRET}`)
    .digest('hex');
};

// Verify action token
const verifyActionToken = (sessionId, userId, token) => {
  const expectedToken = generateActionToken(sessionId, userId);
  return token === expectedToken;
};

// Lấy thời gian hiện tại ở timezone Vietnam
// Note: Server runs with TZ=Asia/Ho_Chi_Minh, so new Date() is already Vietnam time
const getVietnamTime = () => {
  return new Date();
};

// Parse time string (HH:MM) thành Date object
const parseTime = (timeStr, date) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

// Kiểm tra và gửi email nhắc nhở (15 phút trước)
const checkAndSendReminders = async () => {
  try {
    const now = getVietnamTime();
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
    
    // Tìm các session sắp bắt đầu trong vòng 15-16 phút
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await StudySessionSchedule.find({
      date: {
        $gte: today,
        $lt: tomorrow
      },
      status: 'scheduled'
    }).populate('userId subjectId');

    for (const session of sessions) {
      const sessionStart = parseTime(session.startTime, session.date);
      const timeDiff = sessionStart - now;
      
      // Nếu session bắt đầu trong 15-16 phút và chưa gửi reminder
      if (timeDiff > 14 * 60 * 1000 && timeDiff <= 16 * 60 * 1000) {
        const sessionKey = session._id.toString();
        
        if (!reminderSent.has(sessionKey)) {
          const user = session.userId;
          const subject = session.subjectId;
          
          if (user && user.email && subject) {
            const actionToken = generateActionToken(session._id.toString(), user._id.toString());
            
            const sessionData = {
              userName: user.name,
              subjectName: subject.subjectName,
              startTime: session.startTime,
              endTime: session.endTime,
              date: session.date,
              sessionId: session._id.toString()
            };

            const sent = await sendReminderEmail(user.email, sessionData, actionToken);
            
            if (sent) {
              reminderSent.set(sessionKey, {
                sent: true,
                confirmed: false,
                token: actionToken,
                userId: user._id.toString()
              });
              console.log(`📧 Reminder sent for session ${sessionKey} to ${user.email}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error in checkAndSendReminders:', error);
  }
};

// Kiểm tra và gửi email bắt đầu học (cho những người đã confirm)
const checkAndSendStartEmails = async () => {
  try {
    const now = getVietnamTime();
    
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await StudySessionSchedule.find({
      date: {
        $gte: today,
        $lt: tomorrow
      },
      status: 'scheduled'
    }).populate('userId subjectId');

    for (const session of sessions) {
      const sessionStart = parseTime(session.startTime, session.date);
      const timeDiff = sessionStart - now;
      
      // Nếu session đang bắt đầu (trong vòng 1 phút)
      if (timeDiff >= 0 && timeDiff <= 60 * 1000) {
        const sessionKey = session._id.toString();
        
        // Chỉ gửi nếu đã confirm và chưa gửi start email
        const reminderInfo = reminderSent.get(sessionKey);
        if (reminderInfo && reminderInfo.confirmed && !startEmailSent.has(sessionKey)) {
          const user = session.userId;
          const subject = session.subjectId;
          
          if (user && user.email && subject) {
            const sessionData = {
              userName: user.name,
              subjectName: subject.subjectName,
              startTime: session.startTime,
              endTime: session.endTime
            };

            const sent = await sendStartSessionEmail(user.email, sessionData);
            
            if (sent) {
              startEmailSent.add(sessionKey);
              console.log(`🎯 Start email sent for session ${sessionKey} to ${user.email}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error in checkAndSendStartEmails:', error);
  }
};

// Xử lý khi user confirm tham gia
const handleConfirm = (sessionId) => {
  const reminderInfo = reminderSent.get(sessionId);
  if (reminderInfo) {
    reminderInfo.confirmed = true;
    reminderSent.set(sessionId, reminderInfo);
    console.log(`✅ User confirmed session ${sessionId}`);
  }
};

// Xử lý khi user skip
const handleSkip = async (sessionId) => {
  try {
    await StudySessionSchedule.findByIdAndUpdate(sessionId, {
      status: 'missed'
    });
    reminderSent.delete(sessionId);
    console.log(`❌ Session ${sessionId} marked as missed`);
    return true;
  } catch (error) {
    console.error('Error marking session as missed:', error);
    return false;
  }
};

// Bắt đầu cron jobs
const startReminderScheduler = () => {
  // Chạy mỗi phút để kiểm tra
  cron.schedule('* * * * *', () => {
    checkAndSendReminders();
    checkAndSendStartEmails();
    checkAndCompleteEndedSessions();
  });

  console.log('✅ Session reminder scheduler started');
  console.log('📧 Checking for reminders every minute');
};

// Kiểm tra và hoàn thành các buổi học đã hết giờ
const checkAndCompleteEndedSessions = async () => {
  try {
    const now = getVietnamTime();
    
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Tìm các session đang học (có actualStartTime, chưa có actualEndTime)
    const activeSessions = await StudySessionSchedule.find({
      date: { $gte: today, $lt: tomorrow },
      actualStartTime: { $exists: true, $ne: null },
      actualEndTime: { $exists: false },
      status: { $ne: 'completed' },
      completionEmailSent: { $ne: true }
    }).populate('userId subjectId');

    for (const session of activeSessions) {
      const sessionEnd = parseTime(session.endTime, session.date);
      
      // Nếu đã qua giờ kết thúc
      if (now >= sessionEnd) {
        // Tính thời gian học thực tế
        const actualStartTime = new Date(session.actualStartTime);
        const pausedDuration = session.pausedDuration || 0;
        
        // Nếu đang pause, cộng thêm thời gian pause
        let totalPausedMinutes = pausedDuration;
        if (session.isPaused && session.pausedAt) {
          const currentPausedMs = now - new Date(session.pausedAt);
          totalPausedMinutes += Math.floor(currentPausedMs / (1000 * 60));
        }
        
        // Tính duration từ lúc bắt đầu đến lúc kết thúc dự kiến (không phải now)
        const totalMs = sessionEnd - actualStartTime;
        const actualDuration = Math.max(0, Math.floor(totalMs / (1000 * 60)) - totalPausedMinutes);
        
        // Cập nhật session
        session.actualEndTime = sessionEnd;
        session.actualDuration = actualDuration;
        session.status = 'completed';
        session.isPaused = false;
        session.pausedAt = null;
        session.wasProductived = actualDuration >= 30;
        session.completionEmailSent = true;
        
        await session.save();
        
        console.log(`✅ Auto-completed session ${session._id}. Duration: ${actualDuration} minutes`);
        
        // Gửi email chúc mừng
        const user = session.userId;
        const subject = session.subjectId;
        
        if (user && user.email && subject) {
          const sent = await sendCompletionEmail(user.email, {
            userName: user.name,
            subjectName: subject.subjectName,
            actualDuration,
            startTime: session.startTime,
            endTime: session.endTime,
            focusLevel: session.focusLevel || 3
          });
          
          if (sent) {
            console.log(`📧 Completion email sent for session ${session._id} to ${user.email}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error in checkAndCompleteEndedSessions:', error);
  }
};

// Cleanup old data (mỗi ngày lúc 00:00)
cron.schedule('0 0 * * *', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Xóa các reminder cũ
  for (const [sessionId, info] of reminderSent.entries()) {
    // Logic xóa nếu cần
  }
  
  startEmailSent.clear();
  console.log('🧹 Cleaned up old reminder data');
});

module.exports = {
  startReminderScheduler,
  handleConfirm,
  handleSkip,
  verifyActionToken,
  reminderSent
};
