const mongoose = require('mongoose');

const moodTrackingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  mood: {
    type: Number,
    required: [true, 'Mood rating is required'],
    min: [1, 'Mood must be between 1 and 5'],
    max: [5, 'Mood must be between 1 and 5']
  },
  emotionTags: [{
    type: String,
    enum: ['happy', 'sad', 'stressed', 'anxious', 'excited', 'tired', 'motivated', 'frustrated', 'calm', 'energetic', 'focused', 'overwhelmed', 'confident', 'worried', 'content'],
    trim: true
  }],
  note: {
    type: String,
    trim: true,
    maxlength: [500, 'Note must not exceed 500 characters']
  },
  energyLevel: {
    type: Number,
    min: [1, 'Energy level must be between 1 and 10'],
    max: [10, 'Energy level must be between 1 and 10'],
    default: 5
  }
}, {
  timestamps: true
});

// Indexes
moodTrackingSchema.index({ userId: 1, date: -1 });
moodTrackingSchema.index({ userId: 1, mood: 1 });

// Virtual for AI Insight
moodTrackingSchema.virtual('aiInsight', {
  ref: 'AIMoodInsight',
  localField: '_id',
  foreignField: 'moodId',
  justOne: true
});

module.exports = mongoose.model('MoodTracking', moodTrackingSchema);
