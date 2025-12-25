const mongoose = require('mongoose');

const smartNoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: [200, 'Title must not exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Note content is required'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag must not exceed 50 characters']
  }],
  linkedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  aiSummary: {
    type: String,
    trim: true
  },
  aiKeywords: [{
    type: String,
    trim: true
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#ffffff'
  }
}, {
  timestamps: true
});

// Indexes
smartNoteSchema.index({ userId: 1, createdAt: -1 });
smartNoteSchema.index({ userId: 1, tags: 1 });
smartNoteSchema.index({ userId: 1, isPinned: -1, createdAt: -1 });
smartNoteSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('SmartNote', smartNoteSchema);
