const mongoose = require('mongoose');

const studyTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  totalMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudySession'
  }],
  subjectBreakdown: [{
    subject: {
      type: String,
      required: true
    },
    minutes: {
      type: Number,
      required: true,
      min: 0
    }
  }]
}, {
  timestamps: true
});

// Compound index for unique user-date combination
studyTrackerSchema.index({ userId: 1, date: 1 }, { unique: true });
studyTrackerSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('StudyTracker', studyTrackerSchema);
