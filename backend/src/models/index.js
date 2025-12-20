// Export all models from a single file
module.exports = {
  // Original models
  User: require('./User'),
  Task: require('./Task'),
  SmartNote: require('./SmartNote'),
  AIStudyBuddy: require('./AIStudyBuddy'),
  MoodTracking: require('./MoodTracking'),
  AIMoodInsight: require('./AIMoodInsight'),
  Gamification: require('./Gamification'),
  Streak: require('./Streak'),
  Settings: require('./Settings'),
  PremiumSubscription: require('./PremiumSubscription'),
  ActivityLog: require('./ActivityLog'),
  Analytics: require('./Analytics'),
  Report: require('./Report'),
  Notification: require('./Notification'),
  SystemConfig: require('./SystemConfig'),
  
  // AI Scheduling System models
  Semester: require('./Semester'),
  Subject: require('./Subject'),
  BusySchedule: require('./BusySchedule'),
  StudyTimetable: require('./StudyTimetable'),
  StudySessionSchedule: require('./StudySessionSchedule'),
  Deadline: require('./Deadline'),
  Reminder: require('./Reminder'),
  NotificationLog: require('./NotificationLog'),
  AIInput: require('./AIInput'),
  AIGenerationResult: require('./AIGenerationResult')
};
