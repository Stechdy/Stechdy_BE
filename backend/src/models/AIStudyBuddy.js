const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const aiStudyBuddySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
    index: true
  },
  chatHistory: [messageSchema],
  totalMessages: {
    type: Number,
    default: 0,
    min: 0
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes (userId already has unique: true and index: true)
aiStudyBuddySchema.index({ lastInteraction: -1 });

// Pre-save hook to update totalMessages and lastInteraction
aiStudyBuddySchema.pre('save', function(next) {
  if (this.isModified('chatHistory')) {
    this.totalMessages = this.chatHistory.length;
    if (this.chatHistory.length > 0) {
      this.lastInteraction = this.chatHistory[this.chatHistory.length - 1].timestamp;
    }
  }
  next();
});

module.exports = mongoose.model('AIStudyBuddy', aiStudyBuddySchema);
