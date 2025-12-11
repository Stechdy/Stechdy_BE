const mongoose = require('mongoose');

const aiMoodInsightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  moodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MoodTracking',
    required: [true, 'Mood ID is required'],
    index: true
  },
  insightText: {
    type: String,
    required: [true, 'Insight text is required'],
    trim: true
  },
  behaviorPattern: {
    type: String,
    trim: true,
    maxlength: [500, 'Behavior pattern must not exceed 500 characters']
  },
  recommendation: {
    type: String,
    trim: true,
    maxlength: [500, 'Recommendation must not exceed 500 characters']
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 75
  }
}, {
  timestamps: true
});

// Indexes (moodId already has unique: true)
aiMoodInsightSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AIMoodInsight', aiMoodInsightSchema);
