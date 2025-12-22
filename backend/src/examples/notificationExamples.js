/**
 * Example Usage - Advanced Notification System
 * Các ví dụ về cách sử dụng hệ thống notification mới
 */

// ============================================
// 1. MOOD ANALYSIS EXAMPLES
// ============================================

const { 
  analyzeMoodTrend, 
  getCurrentEmotionalState,
  analyzeBestStudyTime,
  getEncouragementLevel
} = require('./services/moodAnalysisService');

// Example 1.1: Phân tích xu hướng mood 7 ngày
async function exampleMoodTrend() {
  const userId = 'user_id_here';
  
  const analysis = await analyzeMoodTrend(userId, 7);
  
  console.log('Mood Trend Analysis:');
  console.log('Trend:', analysis.trend); // 'improving', 'declining', 'stable'
  console.log('Average Mood:', analysis.avgMoodLevel); // 1-5
  console.log('Average Stress:', analysis.avgStressLevel); // 1-5
  console.log('Average Energy:', analysis.avgEnergyLevel); // 1-5
  console.log('Consistency:', analysis.consistency); // 'high', 'medium', 'low'
  
  // Output example:
  // Trend: improving
  // Average Mood: 4.2
  // Average Stress: 2.5
  // Average Energy: 4.5
  // Consistency: high
}

// Example 1.2: Lấy trạng thái cảm xúc hiện tại
async function exampleCurrentState() {
  const userId = 'user_id_here';
  
  const state = await getCurrentEmotionalState(userId);
  
  console.log('Current Emotional State:');
  console.log('Checked in today:', state.hasCheckedInToday);
  console.log('Today mood:', state.todayMood);
  console.log('Yesterday mood:', state.yesterdayMood);
  console.log('Week trend:', state.weekTrend);
  
  // Output example:
  // Checked in today: true
  // Today mood: happy
  // Yesterday mood: neutral
  // Week trend: improving
}

// Example 1.3: Phân tích thời gian học tốt nhất
async function exampleBestStudyTime() {
  const userId = 'user_id_here';
  
  const bestTime = await analyzeBestStudyTime(userId);
  
  console.log('Best Study Time Analysis:');
  console.log('Recommendation:', bestTime.recommendation); // 'morning', 'afternoon', 'evening'
  console.log('Average Energy:', bestTime.avgEnergy);
  console.log('Confidence:', bestTime.confidence); // 'high', 'medium', 'low'
  console.log('Reason:', bestTime.reason);
  
  // Output example:
  // Recommendation: morning
  // Average Energy: 4.5
  // Confidence: high
  // Reason: Dựa trên 25 lần ghi nhận, bạn có năng lượng cao nhất vào buổi sáng
}

// Example 1.4: Xác định mức độ khích lệ
async function exampleEncouragementLevel() {
  const userId = 'user_id_here';
  
  const emotionalState = await getCurrentEmotionalState(userId);
  const level = getEncouragementLevel(emotionalState);
  
  console.log('Encouragement Level:', level);
  // Output: 'gentle', 'normal', or 'energetic'
  
  // gentle: Khi stress cao, mood thấp
  // normal: Mood ổn định
  // energetic: Energy cao, mood tích cực
}

// ============================================
// 2. PERSONALIZED MESSAGE EXAMPLES
// ============================================

const {
  generateTaskReminderMessage,
  generateStudyReminderMessage,
  generateDeadlineReminderMessage,
  generateAchievementMessage
} = require('./services/personalizedMessageService');

// Example 2.1: Tạo task reminder message
async function exampleTaskMessage() {
  const task = {
    _id: 'task_id',
    title: 'Hoàn thành bài tập Toán',
    description: 'Giải 20 bài tập chương 3',
    priority: 'high', // 'high', 'medium', 'low'
    dueDate: new Date('2025-12-23T23:59:00')
  };
  
  const user = {
    _id: 'user_id',
    name: 'Nguyễn Văn A'
  };
  
  const { title, message, icon } = await generateTaskReminderMessage(task, user);
  
  console.log('Task Reminder:');
  console.log('Title:', title);
  console.log('Message:', message);
  console.log('Icon:', icon);
  
  // Example outputs based on mood:
  
  // Gentle mode:
  // Title: Nhắc nhở: Hoàn thành bài tập Toán
  // Message: 💙 Xin chào! Có một task quan trọng cần chú ý. Hãy làm từ từ, không cần vội vàng nhé!
  // Icon: ⚡
  
  // Energetic mode:
  // Title: Nhắc nhở: Hoàn thành bài tập Toán
  // Message: 🚀 Chào người chiến binh! Task quan trọng đang chờ bạn chinh phục!
  // Icon: ⚡
}

// Example 2.2: Tạo study session reminder
async function exampleStudyMessage() {
  const session = {
    _id: 'session_id',
    subjectId: {
      name: 'Toán Cao Cấp'
    },
    startTime: new Date('2025-12-23T14:00:00'),
    location: 'Phòng A101'
  };
  
  const user = {
    _id: 'user_id',
    name: 'Nguyễn Văn A'
  };
  
  const { title, message, icon } = await generateStudyReminderMessage(
    session,
    user,
    'before_session', // 'before_session', 'during_session', 'missed_session'
    '30 phút'
  );
  
  console.log('Study Reminder:');
  console.log('Title:', title);
  console.log('Message:', message);
  console.log('Icon:', icon);
  
  // Example outputs:
  
  // Gentle mode:
  // Title: 🔔 Sắp đến giờ học: Toán Cao Cấp
  // Message: 💙 30 phút nữa là đến giờ học Toán Cao Cấp. Hãy chuẩn bị tinh thần nhẹ nhàng nhé!
  // Icon: 📚
  
  // Energetic mode:
  // Title: 🔔 Sắp đến giờ học: Toán Cao Cấp
  // Message: 🚀 Còn 30 phút nữa! Sẵn sàng chinh phục Toán Cao Cấp chưa?
  // Icon: 📚
}

// Example 2.3: Tạo deadline reminder
async function exampleDeadlineMessage() {
  const deadline = {
    _id: 'deadline_id',
    title: 'Báo cáo môn Lý',
    description: 'Báo cáo thí nghiệm chương 5',
    dueDate: new Date('2025-12-23T23:59:00'),
    subjectId: {
      name: 'Vật Lý Đại Cương'
    },
    deadlineType: 'assignment'
  };
  
  const user = {
    _id: 'user_id',
    name: 'Nguyễn Văn A'
  };
  
  const hoursUntil = 6; // 6 hours until deadline
  
  const { title, message, icon, priority } = await generateDeadlineReminderMessage(
    deadline,
    user,
    hoursUntil
  );
  
  console.log('Deadline Reminder:');
  console.log('Title:', title);
  console.log('Message:', message);
  console.log('Icon:', icon);
  console.log('Priority:', priority);
  
  // Example outputs:
  
  // Urgent (< 24h) - Gentle:
  // Title: ⏰ Deadline: Báo cáo môn Lý
  // Message: 💙 Deadline Báo cáo môn Lý còn 6 giờ. Hãy làm từ từ, bạn sẽ kịp thời gian!
  // Icon: 🚨
  // Priority: high
  
  // Urgent (< 24h) - Energetic:
  // Title: ⏰ Deadline: Báo cáo môn Lý
  // Message: 🚨 Go go go! Báo cáo môn Lý còn 6 giờ là deadline! Let's finish this!
  // Icon: 🚨
  // Priority: high
}

// Example 2.4: Tạo achievement message
async function exampleAchievementMessage() {
  const user = {
    _id: 'user_id',
    name: 'Nguyễn Văn A'
  };
  
  // Level Up Achievement
  const levelUpData = { newLevel: 5 };
  const levelUpMsg = await generateAchievementMessage('level_up', levelUpData, user);
  
  console.log('Level Up Achievement:');
  console.log('Title:', levelUpMsg.title);
  console.log('Message:', levelUpMsg.message);
  
  // Streak Milestone Achievement
  const streakData = { days: 30 };
  const streakMsg = await generateAchievementMessage('streak_milestone', streakData, user);
  
  console.log('\nStreak Milestone Achievement:');
  console.log('Title:', streakMsg.title);
  console.log('Message:', streakMsg.message);
  
  // Example outputs:
  
  // Level Up - Energetic:
  // Title: 🎉 Level Up!
  // Message: Boom! Bạn vừa lên Level 5! Keep crushing it! 🚀
  
  // Streak - Gentle:
  // Title: 🔥 Streak 30 ngày!
  // Message: Tuyệt vời! Bạn đã duy trì 30 ngày liên tiếp. Rất tốt! 💙
}

// ============================================
// 3. NOTIFICATION SERVICE EXAMPLES
// ============================================

const {
  sendTaskReminders,
  sendStudySessionReminders,
  sendDeadlineReminders,
  createAchievementNotification
} = require('./services/notificationService');

// Example 3.1: Gửi task reminders (tự động)
async function exampleSendTaskReminders() {
  // Được gọi bởi cron job mỗi giờ
  const result = await sendTaskReminders();
  
  console.log('Task Reminders Sent:', result.notificationsSent);
  
  // Output: Task Reminders Sent: 5
}

// Example 3.2: Gửi study session reminders (tự động)
async function exampleSendStudyReminders() {
  // Được gọi bởi cron job mỗi 15 phút
  const result = await sendStudySessionReminders();
  
  console.log('Study Session Reminders Sent:', result.notificationsSent);
  
  // Output: Study Session Reminders Sent: 3
}

// Example 3.3: Gửi deadline reminders (tự động)
async function exampleSendDeadlineReminders() {
  // Được gọi bởi cron job 2 lần/ngày
  const result = await sendDeadlineReminders();
  
  console.log('Deadline Reminders Sent:', result.notificationsSent);
  
  // Output: Deadline Reminders Sent: 7
}

// Example 3.4: Tạo achievement notification (manual)
async function exampleCreateAchievement() {
  const userId = 'user_id_here';
  
  // Level up achievement
  const levelUpNotif = await createAchievementNotification(
    userId,
    'level_up',
    { newLevel: 5 }
  );
  
  console.log('Achievement Notification Created:', levelUpNotif);
  
  // Streak milestone
  const streakNotif = await createAchievementNotification(
    userId,
    'streak_milestone',
    { days: 30 }
  );
  
  console.log('Streak Notification Created:', streakNotif);
}

// ============================================
// 4. INTEGRATION EXAMPLES (In Controllers)
// ============================================

// Example 4.1: Tạo notification khi hoàn thành task
async function onTaskCompleted(taskId, userId) {
  const Task = require('./models/Task');
  const { createAchievementNotification } = require('./services/notificationService');
  
  // Update task status
  await Task.findByIdAndUpdate(taskId, {
    status: 'done',
    completedAt: new Date()
  });
  
  // Create achievement notification
  await createAchievementNotification(
    userId,
    'task_completed',
    { taskId }
  );
  
  console.log('Task completed and achievement notification created!');
}

// Example 4.2: Tạo notification khi user level up
async function onUserLevelUp(userId, newLevel) {
  const { createAchievementNotification } = require('./services/notificationService');
  
  await createAchievementNotification(
    userId,
    'level_up',
    { newLevel }
  );
  
  console.log(`User leveled up to ${newLevel}!`);
}

// Example 4.3: Tạo notification khi đạt streak milestone
async function onStreakMilestone(userId, days) {
  const { createAchievementNotification } = require('./services/notificationService');
  
  // Check if it's a milestone (7, 30, 100, etc.)
  const milestones = [7, 14, 30, 60, 100, 365];
  
  if (milestones.includes(days)) {
    await createAchievementNotification(
      userId,
      'streak_milestone',
      { days }
    );
    
    console.log(`Streak milestone ${days} days reached!`);
  }
}

// ============================================
// 5. API ENDPOINT USAGE EXAMPLES
// ============================================

/**
 * Example API Calls (using fetch or axios)
 */

// Example 5.1: Get mood analysis
async function getMoodAnalysisAPI() {
  const response = await fetch('/api/notifications/mood-analysis', {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  
  const data = await response.json();
  
  console.log('Week Trend:', data.data.weekTrend);
  console.log('Emotional State:', data.data.emotionalState);
  console.log('Best Study Time:', data.data.bestStudyTime);
}

// Example 5.2: Create achievement notification
async function createAchievementAPI() {
  const response = await fetch('/api/notifications/achievement', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      achievementType: 'level_up',
      data: { newLevel: 5 }
    })
  });
  
  const data = await response.json();
  console.log('Achievement created:', data);
}

// Example 5.3: Test task reminder
async function testTaskReminderAPI() {
  const response = await fetch('/api/notifications/test-task-reminder', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  
  const data = await response.json();
  console.log('Test result:', data);
}

// ============================================
// 6. SCHEDULER EXAMPLES
// ============================================

// Example 6.1: Custom cron job
const cron = require('node-cron');

function setupCustomReminder() {
  // Send custom reminder every day at 2 PM
  cron.schedule('0 14 * * *', async () => {
    console.log('Running custom reminder at 2 PM...');
    
    // Your custom logic here
    const users = await User.find({ customReminder: true });
    
    for (const user of users) {
      await createNotification(
        user._id,
        'Custom Reminder',
        'Your custom message here',
        'system'
      );
    }
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });
}

// ============================================
// 7. TESTING EXAMPLES
// ============================================

// Example 7.1: Test with mock data
async function testWithMockData() {
  const mockUser = {
    _id: 'test_user_123',
    name: 'Test User',
    email: 'test@example.com'
  };
  
  const mockTask = {
    _id: 'test_task_123',
    title: 'Test Task',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000) // +1 day
  };
  
  // Generate message
  const { title, message } = await generateTaskReminderMessage(mockTask, mockUser);
  
  console.log('Generated Message:');
  console.log('Title:', title);
  console.log('Message:', message);
}

// Example 7.2: Test mood analysis with sample data
async function testMoodAnalysis() {
  const MoodTracking = require('./models/MoodTracking');
  
  // Create sample mood entries
  const userId = 'test_user_123';
  const sampleMoods = [
    { userId, mood: 'happy', energyLevel: 4, stressLevel: 2, date: new Date() },
    { userId, mood: 'very_happy', energyLevel: 5, stressLevel: 1, date: new Date(Date.now() - 86400000) },
    { userId, mood: 'neutral', energyLevel: 3, stressLevel: 3, date: new Date(Date.now() - 172800000) }
  ];
  
  await MoodTracking.insertMany(sampleMoods);
  
  // Analyze
  const analysis = await analyzeMoodTrend(userId, 7);
  console.log('Analysis:', analysis);
  
  // Cleanup
  await MoodTracking.deleteMany({ userId });
}

// ============================================
// Export examples for testing
// ============================================

module.exports = {
  // Mood Analysis
  exampleMoodTrend,
  exampleCurrentState,
  exampleBestStudyTime,
  exampleEncouragementLevel,
  
  // Personalized Messages
  exampleTaskMessage,
  exampleStudyMessage,
  exampleDeadlineMessage,
  exampleAchievementMessage,
  
  // Notification Service
  exampleSendTaskReminders,
  exampleSendStudyReminders,
  exampleSendDeadlineReminders,
  exampleCreateAchievement,
  
  // Integration
  onTaskCompleted,
  onUserLevelUp,
  onStreakMilestone,
  
  // Testing
  testWithMockData,
  testMoodAnalysis
};
