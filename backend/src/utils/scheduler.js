const cron = require('node-cron');
const { sendDailyMoodReminders, sendEveningMoodReminder } = require('../services/notificationService');

// Initialize all scheduled tasks
const initializeScheduler = () => {
  console.log('Initializing task scheduler...');

  // Send mood reminder at 9:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('Running morning mood reminder task...');
    try {
      await sendDailyMoodReminders();
    } catch (error) {
      console.error('Morning mood reminder failed:', error);
    }
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });

  // Send evening reminder at 7:00 PM for users who haven't checked in
  cron.schedule('0 19 * * *', async () => {
    console.log('Running evening mood reminder task...');
    try {
      await sendEveningMoodReminder();
    } catch (error) {
      console.error('Evening mood reminder failed:', error);
    }
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });

  console.log('Scheduler initialized successfully!');
  console.log('- Morning reminders: 9:00 AM daily');
  console.log('- Evening reminders: 7:00 PM daily');
};

module.exports = { initializeScheduler };
