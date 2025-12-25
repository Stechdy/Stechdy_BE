const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  metrics: {
    // User metrics
    totalUsers: {
      type: Number,
      default: 0
    },
    activeUsers: {
      type: Number,
      default: 0
    },
    newUsers: {
      type: Number,
      default: 0
    },
    premiumUsers: {
      type: Number,
      default: 0
    },
    deletedUsers: {
      type: Number,
      default: 0
    },
    verifiedUsers: {
      type: Number,
      default: 0
    },
    
    // Engagement metrics
    totalStudySessions: {
      type: Number,
      default: 0
    },
    totalStudyMinutes: {
      type: Number,
      default: 0
    },
    avgSessionDuration: {
      type: Number,
      default: 0
    },
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    totalNotes: {
      type: Number,
      default: 0
    },
    
    // Mood metrics
    avgMoodScore: {
      type: Number,
      default: 0
    },
    totalMoodEntries: {
      type: Number,
      default: 0
    },
    
    // Gamification metrics
    avgUserLevel: {
      type: Number,
      default: 0
    },
    totalXPEarned: {
      type: Number,
      default: 0
    },
    avgStreak: {
      type: Number,
      default: 0
    },
    
    // Revenue metrics
    totalRevenue: {
      type: Number,
      default: 0
    },
    newSubscriptions: {
      type: Number,
      default: 0
    },
    cancelledSubscriptions: {
      type: Number,
      default: 0
    },
    activeSubscriptions: {
      type: Number,
      default: 0
    },
    
    // Content metrics
    aiChatMessages: {
      type: Number,
      default: 0
    },
    aiInsightsGenerated: {
      type: Number,
      default: 0
    },
    
    // Retention metrics
    dayRetention: {
      day1: { type: Number, default: 0 },
      day7: { type: Number, default: 0 },
      day30: { type: Number, default: 0 }
    }
  },
  topSubjects: [{
    subject: String,
    count: Number,
    totalMinutes: Number
  }],
  topEmotions: [{
    emotion: String,
    count: Number
  }],
  userGrowth: {
    type: Number,
    default: 0 // percentage
  },
  revenueGrowth: {
    type: Number,
    default: 0 // percentage
  }
}, {
  timestamps: true
});

// Compound index for unique date-type combination
analyticsSchema.index({ date: 1, type: 1 }, { unique: true });
analyticsSchema.index({ type: 1, date: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
