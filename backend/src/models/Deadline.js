const mongoose = require('mongoose');

const deadlineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must not exceed 200 characters']
    },
    description: {
      type: String,
      default: ''
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true
    },
    dueTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Due time must be in HH:MM format'],
      default: '23:59'
    },
    deadlineType: {
      type: String,
      enum: ['assignment', 'exam', 'project', 'quiz', 'presentation', 'lab', 'midterm', 'final', 'other'],
      required: [true, 'Deadline type is required'],
      index: true
    },
    priorityLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true
    },
    estimatedDuration: {
      type: Number,
      min: 0,
      default: 0
    },
    actualDuration: {
      type: Number,
      min: 0
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true
    },
    completedAt: {
      type: Date
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'overdue', 'cancelled'],
      default: 'pending',
      index: true
    },
    weight: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    grade: {
      type: String,
      default: ''
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    submissionMethod: {
      type: String,
      enum: ['online', 'in_person', 'email', 'lms', 'other'],
      default: 'online'
    },
    submissionLink: {
      type: String,
      trim: true
    },
    attachments: [{
      name: String,
      url: String,
      type: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    reminders: [{
      type: {
        type: String,
        enum: ['1_day_before', '3_days_before', '1_week_before', 'custom'],
        default: '1_day_before'
      },
      remindAt: Date,
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    }],
    linkedSessions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudySessionSchedule'
    }],
    notes: {
      type: String,
      default: ''
    },
    tags: [{
      type: String,
      trim: true
    }],
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurrencePattern: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly']
      },
      interval: {
        type: Number,
        min: 1
      },
      endDate: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
deadlineSchema.index({ userId: 1, dueDate: 1 });
deadlineSchema.index({ subjectId: 1, dueDate: 1 });
deadlineSchema.index({ userId: 1, status: 1, dueDate: 1 });
deadlineSchema.index({ userId: 1, isCompleted: 1, dueDate: 1 });
deadlineSchema.index({ dueDate: 1, priorityLevel: 1 });

// Update status based on completion and due date
deadlineSchema.pre('save', function(next) {
  if (this.isCompleted && !this.completedAt) {
    this.completedAt = new Date();
    this.status = 'completed';
    this.completionPercentage = 100;
  }
  
  if (!this.isCompleted && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
  
  next();
});

// Virtual for days until due
deadlineSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is urgent (less than 3 days)
deadlineSchema.virtual('isUrgent').get(function() {
  return this.daysUntilDue <= 3 && this.daysUntilDue >= 0 && !this.isCompleted;
});

// Method to mark as completed
deadlineSchema.methods.complete = function(grade, score) {
  this.isCompleted = true;
  this.completedAt = new Date();
  this.status = 'completed';
  this.completionPercentage = 100;
  if (grade) this.grade = grade;
  if (score !== undefined) this.score = score;
  return this.save();
};

// Method to set reminder
deadlineSchema.methods.addReminder = function(type, customDate) {
  const reminder = { type };
  
  if (type === 'custom' && customDate) {
    reminder.remindAt = customDate;
  } else {
    const dueDate = new Date(this.dueDate);
    switch(type) {
      case '1_day_before':
        reminder.remindAt = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '3_days_before':
        reminder.remindAt = new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000);
        break;
      case '1_week_before':
        reminder.remindAt = new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }
  }
  
  this.reminders.push(reminder);
  return this.save();
};

module.exports = mongoose.model('Deadline', deadlineSchema);
