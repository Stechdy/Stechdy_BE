const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  testMoodReminder,
  testTaskReminder,
  testStudyReminder,
  testDeadlineReminder,
  getMoodAnalysis,
  createAchievement
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Main notification routes
router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

// Mood analysis
router.get('/mood-analysis', getMoodAnalysis);

// Achievement
router.post('/achievement', createAchievement);

// Test endpoints (remove in production or add admin middleware)
router.post('/test-mood-reminder', testMoodReminder);
router.post('/test-task-reminder', testTaskReminder);
router.post('/test-study-reminder', testStudyReminder);
router.post('/test-deadline-reminder', testDeadlineReminder);

module.exports = router;
