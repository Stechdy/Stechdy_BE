const { getCurrentEmotionalState, getEncouragementLevel } = require('./moodAnalysisService');

/**
 * Service to generate personalized, mood-aware messages for notifications
 */

/**
 * Task reminder messages based on mood and stress level
 */
const TASK_MESSAGES = {
  gentle: {
    high_priority: [
      "💙 Xin chào! Có một task quan trọng cần chú ý. Hãy làm từ từ, không cần vội vàng nhé!",
      "🌸 Mình biết bạn đang có chút áp lực. Task này quan trọng, nhưng hãy nghỉ ngơi nếu cần nhé.",
      "🫂 Task quan trọng đang chờ bạn. Hít thở sâu, bạn sẽ làm được thôi!",
      "💆‍♀️ Nhẹ nhàng nhắc bạn: có task quan trọng cần hoàn thành. Take your time!"
    ],
    normal: [
      "🌼 Nhắc nhẹ: Bạn có task cần làm đấy. Không vội được đâu!",
      "🍃 Task nhỏ đang chờ bạn. Làm thoải mái, đừng quá căng thẳng nhé.",
      "☕ Uống tách cafe và xem task này nhé? Mọi thứ sẽ ổn thôi!",
      "🌙 Từ từ thôi, có task đang đợi bạn hoàn thành."
    ],
    low_priority: [
      "🦋 Có task nhỏ bạn có thể làm khi rảnh. Không gấp đâu!",
      "🌱 Nhắc nhẹ: Task này bạn làm khi nào tiện cũng được.",
      "🎐 Task nhỏ nhỏ thôi, làm khi nào cũng được nhé!"
    ]
  },
  normal: {
    high_priority: [
      "⚡ Task quan trọng cần hoàn thành! Hãy bắt đầu ngay nhé!",
      "🎯 Ê, task ưu tiên cao đây! Làm xong sẽ thấy nhẹ nhõm lắm đấy!",
      "🔔 Nhắc nhở: Task quan trọng đang chờ bạn!",
      "💪 Task quan trọng nè! Bạn làm được mà, cố lên!"
    ],
    normal: [
      "📋 Bạn có task cần hoàn thành rồi đó!",
      "✅ Đã đến lúc check task này nhé!",
      "📌 Task đang chờ bạn hoàn thành!",
      "🎯 Làm task này đi, xong sẽ thấy vui lắm!"
    ],
    low_priority: [
      "📝 Task nhỏ này bạn nhớ làm nhé!",
      "🗓️ Có task bạn có thể làm lúc rảnh.",
      "✨ Task này làm xong sẽ tick được một ô đấy!"
    ]
  },
  energetic: {
    high_priority: [
      "🚀 Chào người chiến binh! Task quan trọng đang chờ bạn chinh phục!",
      "⚡ Năng lượng đầy đủ rồi! Hãy hạ gục task quan trọng này nào!",
      "🔥 Let's go! Task ưu tiên cao cần bạn show skill!",
      "💥 Crushing time! Task quan trọng này easy cho bạn thôi!"
    ],
    normal: [
      "🎊 Hôm nay vui vẻ nhỉ? Làm luôn task này đi!",
      "⭐ Positive vibes! Task này sẽ nhanh thôi!",
      "✨ Let's do this! Task đang chờ bạn!",
      "🌟 Năng lượng tốt! Làm task này sẽ càng vui hơn!"
    ],
    low_priority: [
      "🎈 Task nhỏ này làm luôn cho nóng nhé!",
      "🌈 Quick win! Task này dễ lắm!",
      "⚡ Speed run task này đi!"
    ]
  }
};

/**
 * Study session reminder messages based on mood
 */
const STUDY_MESSAGES = {
  gentle: {
    before_session: [
      "💙 {time} nữa là đến giờ học {subject}. Hãy chuẩn bị tinh thần nhẹ nhàng nhé!",
      "🌸 Buổi học {subject} sắp bắt đầu trong {time}. Hít thở sâu và tập trung!",
      "🫂 Nhắc nhẹ: {time} nữa học {subject}. Bạn chuẩn bị được rồi!",
      "☕ {time} nữa có buổi học {subject}. Uống nước, nghỉ chút rồi bắt đầu nhé!"
    ],
    during_session: [
      "📚 Bạn đang trong buổi học {subject}. Từ từ thôi, học hiểu mới quan trọng!",
      "💆‍♀️ Buổi học {subject} đang diễn ra. Nghỉ ngơi nếu cần nhé!",
      "🌼 Focus nhẹ nhàng vào {subject}. Bạn làm rất tốt rồi!"
    ],
    missed_session: [
      "🌙 Có vẻ bạn đã bỏ lỡ buổi học {subject}. Không sao cả, mọi thứ sẽ ổn thôi!",
      "💙 Buổi học {subject} đã qua rồi. Hãy sắp xếp lại lịch khi tiện nhé!"
    ]
  },
  normal: {
    before_session: [
      "📚 Còn {time} nữa là đến giờ học {subject}! Chuẩn bị nhé!",
      "⏰ Nhắc nhở: {time} nữa là buổi học {subject}!",
      "🎯 {time} nữa bắt đầu học {subject}. Ready chưa?",
      "📖 Sắp đến giờ học {subject} rồi ({time} nữa)!"
    ],
    during_session: [
      "📚 Đang là thời gian học {subject}. Tập trung nào!",
      "✏️ Buổi học {subject} đang diễn ra. Chúc bạn học tốt!",
      "🎓 Focus time! Học {subject} thôi!"
    ],
    missed_session: [
      "⏰ Bạn đã bỏ lỡ buổi học {subject}. Nhớ sắp xếp lại nhé!",
      "📅 Buổi học {subject} đã qua. Hãy học bù khi rảnh!"
    ]
  },
  energetic: {
    before_session: [
      "🚀 Còn {time} nữa! Sẵn sàng chinh phục {subject} chưa?",
      "⚡ {time} countdown! {subject} is calling! Let's go!",
      "🔥 Get ready! {time} nữa là showtime với {subject}!",
      "💪 {time} left! Năng lượng đầy, học {subject} thôi!"
    ],
    during_session: [
      "🔥 Learning mode ON! Crushing {subject} right now!",
      "⚡ Power study! {subject} đang được chinh phục!",
      "🚀 Full focus on {subject}! You got this!"
    ],
    missed_session: [
      "⏰ Oops! Đã lỡ buổi học {subject}. Schedule lại và comeback mạnh mẽ nhé!",
      "💪 Missed {subject} session. No worries, reschedule và tiếp tục thôi!"
    ]
  }
};

/**
 * Deadline reminder messages
 */
const DEADLINE_MESSAGES = {
  gentle: {
    urgent: [ // < 24h
      "💙 Deadline {task} còn {time}. Hãy làm từ từ, bạn sẽ kịp thời gian!",
      "🫂 {time} nữa là deadline {task}. Take a deep breath, bạn làm được!",
      "🌸 Nhắc nhẹ: Deadline {task} còn {time}. Từng bước một nhé!"
    ],
    soon: [ // 24-72h
      "🌼 {task} sẽ đến hạn trong {time}. Bạn làm thoải mái nhé!",
      "☕ Deadline {task} còn {time}. Làm thong thả, đừng stress!",
      "💆‍♀️ {time} nữa hết hạn {task}. Bạn còn thời gian đấy!"
    ],
    normal: [ // > 72h
      "🌙 Nhắc sớm: {task} còn {time} nữa deadline.",
      "🍃 {task} sẽ đến hạn trong {time}. Chuẩn bị từ từ nhé!"
    ]
  },
  normal: {
    urgent: [
      "⚠️ Khẩn cấp! Deadline {task} còn {time}!",
      "🔔 Chú ý: {task} sắp hết hạn ({time} nữa)!",
      "⏰ Deadline alert! {task} còn {time}!"
    ],
    soon: [
      "📌 {task} sẽ đến deadline trong {time}!",
      "🎯 Nhắc nhở: Deadline {task} còn {time}!",
      "📅 {time} nữa là deadline {task}!"
    ],
    normal: [
      "📋 Upcoming deadline: {task} ({time} nữa)",
      "🗓️ {task} sẽ đến hạn trong {time}."
    ]
  },
  energetic: {
    urgent: [
      "🚨 Go go go! {task} còn {time} là deadline! Let's finish this!",
      "⚡ Rush time! {task} deadline trong {time}! You can do it!",
      "🔥 Crunch time! {task} còn {time}! Show your power!"
    ],
    soon: [
      "💪 {task} còn {time} đến deadline! Làm luôn đi!",
      "⭐ Heads up! {task} deadline in {time}!",
      "🎯 {task} - {time} to deadline! Let's crush it!"
    ],
    normal: [
      "📅 {task} coming up in {time}! Plan ahead!",
      "✨ FYI: {task} deadline in {time}!"
    ]
  }
};

/**
 * Generate personalized task reminder message
 * @param {Object} task - Task object
 * @param {Object} user - User object
 * @returns {Object} { title, message }
 */
const generateTaskReminderMessage = async (task, user) => {
  try {
    const emotionalState = await getCurrentEmotionalState(user._id);
    const encouragementLevel = getEncouragementLevel(emotionalState);
    
    // Determine priority category
    const priorityCategory = task.priority === 'high' ? 'high_priority' :
                            task.priority === 'low' ? 'low_priority' : 'normal';
    
    // Get random message from appropriate category
    const messages = TASK_MESSAGES[encouragementLevel][priorityCategory];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    return {
      title: `Nhắc nhở: ${task.title}`,
      message: message,
      icon: task.priority === 'high' ? '⚡' : task.priority === 'low' ? '📝' : '📋'
    };
  } catch (error) {
    console.error('Error generating task reminder:', error);
    return {
      title: `Nhắc nhở: ${task.title}`,
      message: `Bạn có task "${task.title}" cần hoàn thành!`,
      icon: '📋'
    };
  }
};

/**
 * Generate personalized study session reminder message
 * @param {Object} session - Study session object
 * @param {Object} user - User object
 * @param {String} timing - 'before_session', 'during_session', 'missed_session'
 * @param {String} timeUntil - Time remaining (e.g., "30 phút", "1 giờ")
 * @returns {Object} { title, message }
 */
const generateStudyReminderMessage = async (session, user, timing = 'before_session', timeUntil = '') => {
  try {
    const emotionalState = await getCurrentEmotionalState(user._id);
    const encouragementLevel = getEncouragementLevel(emotionalState);
    
    // Get random message from appropriate category
    const messages = STUDY_MESSAGES[encouragementLevel][timing];
    let message = messages[Math.floor(Math.random() * messages.length)];
    
    // Replace placeholders
    const subjectName = session.subjectId?.name || session.subject || 'môn học';
    message = message.replace('{subject}', subjectName);
    message = message.replace('{time}', timeUntil);
    
    const titlePrefix = timing === 'before_session' ? '🔔 Sắp đến giờ học' :
                       timing === 'during_session' ? '📚 Đang trong giờ học' :
                       '⏰ Đã bỏ lỡ';
    
    return {
      title: `${titlePrefix}: ${subjectName}`,
      message: message,
      icon: '📚'
    };
  } catch (error) {
    console.error('Error generating study reminder:', error);
    return {
      title: `Nhắc nhở học tập`,
      message: `Đến giờ học rồi!`,
      icon: '📚'
    };
  }
};

/**
 * Generate personalized deadline reminder message
 * @param {Object} deadline - Deadline object
 * @param {Object} user - User object
 * @param {Number} hoursUntil - Hours until deadline
 * @returns {Object} { title, message }
 */
const generateDeadlineReminderMessage = async (deadline, user, hoursUntil) => {
  try {
    const emotionalState = await getCurrentEmotionalState(user._id);
    const encouragementLevel = getEncouragementLevel(emotionalState);
    
    // Determine urgency category
    const urgencyCategory = hoursUntil < 24 ? 'urgent' :
                           hoursUntil < 72 ? 'soon' : 'normal';
    
    // Format time remaining
    let timeRemaining;
    if (hoursUntil < 1) {
      timeRemaining = `${Math.round(hoursUntil * 60)} phút`;
    } else if (hoursUntil < 24) {
      timeRemaining = `${Math.round(hoursUntil)} giờ`;
    } else {
      timeRemaining = `${Math.round(hoursUntil / 24)} ngày`;
    }
    
    // Get random message
    const messages = DEADLINE_MESSAGES[encouragementLevel][urgencyCategory];
    let message = messages[Math.floor(Math.random() * messages.length)];
    
    // Replace placeholders
    message = message.replace('{task}', deadline.title);
    message = message.replace('{time}', timeRemaining);
    
    return {
      title: `⏰ Deadline: ${deadline.title}`,
      message: message,
      icon: hoursUntil < 24 ? '🚨' : '📅',
      priority: hoursUntil < 24 ? 'high' : hoursUntil < 72 ? 'normal' : 'low'
    };
  } catch (error) {
    console.error('Error generating deadline reminder:', error);
    return {
      title: `⏰ Deadline: ${deadline.title}`,
      message: `Deadline sắp đến!`,
      icon: '📅',
      priority: 'normal'
    };
  }
};

/**
 * Generate achievement notification message
 * @param {String} achievementType - Type of achievement
 * @param {Object} data - Achievement data
 * @param {Object} user - User object
 * @returns {Object} { title, message }
 */
const generateAchievementMessage = async (achievementType, data, user) => {
  try {
    const emotionalState = await getCurrentEmotionalState(user._id);
    const encouragementLevel = getEncouragementLevel(emotionalState);
    
    let title, message;
    
    switch (achievementType) {
      case 'level_up':
        title = `🎉 Level Up!`;
        message = encouragementLevel === 'energetic' 
          ? `Boom! Bạn vừa lên Level ${data.newLevel}! Keep crushing it! 🚀`
          : encouragementLevel === 'gentle'
          ? `Chúc mừng bạn! Bạn đã lên Level ${data.newLevel} rồi đấy! 💙`
          : `Tuyệt vời! Bạn đã đạt Level ${data.newLevel}! 🌟`;
        break;
        
      case 'streak_milestone':
        title = `🔥 Streak ${data.days} ngày!`;
        message = encouragementLevel === 'energetic'
          ? `Incredible! ${data.days} ngày streak! Bạn đang on fire! 🔥🔥🔥`
          : encouragementLevel === 'gentle'
          ? `Tuyệt vời! Bạn đã duy trì ${data.days} ngày liên tiếp. Rất tốt! 💙`
          : `Amazing! Streak ${data.days} ngày! Tiếp tục duy trì nhé! 🔥`;
        break;
        
      case 'task_completed':
        title = `✅ Hoàn thành task!`;
        message = encouragementLevel === 'energetic'
          ? `Yeah! Task xong rồi! Bạn quá đỉnh! 💪`
          : encouragementLevel === 'gentle'
          ? `Bạn đã hoàn thành task! Làm tốt lắm! 🌸`
          : `Task hoàn thành! Great job! ✨`;
        break;
        
      default:
        title = `🏆 Thành tựu mới!`;
        message = `Chúc mừng bạn đạt thành tựu mới!`;
    }
    
    return { title, message, icon: '🏆' };
  } catch (error) {
    console.error('Error generating achievement message:', error);
    return {
      title: `🏆 Thành tựu mới!`,
      message: `Chúc mừng bạn!`,
      icon: '🏆'
    };
  }
};

/**
 * Format time until event
 * @param {Date} eventDate - Event date
 * @returns {String} Formatted time string
 */
const formatTimeUntil = (eventDate) => {
  const now = new Date();
  const diffMs = eventDate - now;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) return `${diffMins} phút`;
  if (diffHours < 24) return `${diffHours} giờ`;
  return `${diffDays} ngày`;
};

module.exports = {
  generateTaskReminderMessage,
  generateStudyReminderMessage,
  generateDeadlineReminderMessage,
  generateAchievementMessage,
  formatTimeUntil
};
