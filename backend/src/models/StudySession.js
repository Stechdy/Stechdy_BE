const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  subject: {
    type: String,
    trim: true,
    maxlength: [100, 'Subject must not exceed 100 characters']
  },
  focusLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, {
  timestamps: true
});

// Indexes
studySessionSchema.index({ userId: 1, startTime: -1 });
studySessionSchema.index({ userId: 1, subject: 1 });
studySessionSchema.index({ taskId: 1 });

// Calculate duration before saving
studySessionSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    const durationMs = this.endTime - this.startTime;
    this.duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
  }
  next();
});

module.exports = mongoose.model('StudySession', studySessionSchema);
