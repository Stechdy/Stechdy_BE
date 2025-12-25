const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
    index: true
  },
  lastActiveDate: {
    type: Date,
    required: [true, 'Last active date is required'],
    default: Date.now
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  currentStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  streakHistory: [{
    date: {
      type: Date,
      required: true
    },
    activityCount: {
      type: Number,
      default: 1
    }
  }],
  totalActiveDays: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes (userId already has unique: true and index: true)
streakSchema.index({ currentStreak: -1 });
streakSchema.index({ longestStreak: -1 });

// Method to update streak
streakSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = new Date(this.lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    // Same day, don't update streak
    return;
  } else if (daysDiff === 1) {
    // Consecutive day, increment streak
    this.currentStreak += 1;
    this.totalActiveDays += 1;
    
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
  } else {
    // Streak broken, reset to 1
    this.currentStreak = 1;
    this.totalActiveDays += 1;
  }
  
  this.lastActiveDate = today;
  this.streakHistory.push({ date: today, activityCount: 1 });
};

module.exports = mongoose.model('Streak', streakSchema);
