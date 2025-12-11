const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
    index: true
  },
  notification: {
    enabled: {
      type: Boolean,
      default: true
    },
    taskReminders: {
      type: Boolean,
      default: true
    },
    studyReminders: {
      type: Boolean,
      default: true
    },
    moodCheckIn: {
      type: Boolean,
      default: true
    },
    achievements: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  sound: {
    enabled: {
      type: Boolean,
      default: true
    },
    volume: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    timerSound: {
      type: String,
      default: 'bell'
    }
  },
  theme: {
    mode: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    primaryColor: {
      type: String,
      default: '#6366f1'
    },
    accentColor: {
      type: String,
      default: '#ec4899'
    }
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'vi']
  },
  studyTargets: {
    daily: {
      enabled: {
        type: Boolean,
        default: true
      },
      minutes: {
        type: Number,
        default: 120,
        min: 0
      }
    },
    weekly: {
      enabled: {
        type: Boolean,
        default: true
      },
      minutes: {
        type: Number,
        default: 840, // 2 hours * 7 days
        min: 0
      }
    },
    preferredStudyTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: 'evening'
    }
  },
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'private'
    },
    showActivity: {
      type: Boolean,
      default: false
    },
    showStats: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes (userId already has unique: true and index: true)

module.exports = mongoose.model('Settings', settingsSchema);
