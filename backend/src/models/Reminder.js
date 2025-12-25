const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    reminderType: {
      type: String,
      enum: ['studySession', 'deadline', 'dailySummary', 'weeklyReport', 'customEvent'],
      required: [true, 'Reminder type is required'],
      index: true
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedModel',
      index: true
    },
    relatedModel: {
      type: String,
      enum: ['StudySessionSchedule', 'Deadline', 'BusySchedule', 'Subject'],
      required: function() {
        return this.relatedId != null;
      }
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must not exceed 200 characters']
    },
    message: {
      type: String,
      required: [true, 'Message is required']
    },
    remindAt: {
      type: Date,
      required: [true, 'Remind at time is required'],
      index: true
    },
    channel: {
      type: String,
      enum: ['email', 'push', 'sms', 'in_app'],
      default: 'email',
      index: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'sent', 'failed', 'skipped', 'cancelled'],
      default: 'scheduled',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    metadata: {
      subjectName: String,
      sessionType: String,
      deadlineType: String,
      dueDate: Date,
      timeUntilEvent: Number,
      actionUrl: String,
      actionLabel: String
    },
    recipientEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    sentAt: {
      type: Date,
      index: true
    },
    failedAt: Date,
    failureReason: {
      type: String
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    },
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
      nextOccurrence: Date
    },
    userPreferences: {
      enabled: {
        type: Boolean,
        default: true
      },
      advanceNotice: {
        type: Number,
        default: 30,
        min: 0
      },
      preferredChannel: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes
reminderSchema.index({ userId: 1, remindAt: 1, status: 1 });
reminderSchema.index({ remindAt: 1, status: 1 });
reminderSchema.index({ userId: 1, reminderType: 1, status: 1 });
reminderSchema.index({ relatedId: 1, reminderType: 1 });
reminderSchema.index({ status: 1, remindAt: 1 });

// Method to mark as sent
reminderSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

// Method to mark as failed
reminderSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.failureReason = reason;
  this.retryCount += 1;
  return this.save();
};

// Method to schedule retry
reminderSchema.methods.scheduleRetry = function(minutesDelay = 30) {
  if (this.retryCount < 3) {
    this.status = 'scheduled';
    this.remindAt = new Date(Date.now() + minutesDelay * 60 * 1000);
    return this.save();
  }
  return Promise.reject(new Error('Max retry attempts reached'));
};

// Static method to find pending reminders
reminderSchema.statics.findPending = function(limit = 100) {
  return this.find({
    status: 'scheduled',
    remindAt: { $lte: new Date() }
  })
  .limit(limit)
  .sort({ remindAt: 1 });
};

// Static method to create study session reminder
reminderSchema.statics.createStudySessionReminder = async function(session, user, advanceMinutes = 30) {
  const sessionDateTime = new Date(session.date);
  const [hours, minutes] = session.startTime.split(':').map(Number);
  sessionDateTime.setHours(hours, minutes, 0, 0);
  
  const remindAt = new Date(sessionDateTime.getTime() - advanceMinutes * 60 * 1000);
  
  return this.create({
    userId: user._id,
    reminderType: 'studySession',
    relatedId: session._id,
    relatedModel: 'StudySessionSchedule',
    title: `Study Session Reminder`,
    message: `Your ${session.sessionType} study session for ${session.subjectId.subjectName || 'your subject'} starts in ${advanceMinutes} minutes.`,
    remindAt: remindAt,
    channel: user.notificationSettings.studyReminder ? 'email' : 'in_app',
    recipientEmail: user.email,
    metadata: {
      sessionType: session.sessionType,
      timeUntilEvent: advanceMinutes,
      actionUrl: `/timetable/${session.timetableId}`,
      actionLabel: 'View Timetable'
    }
  });
};

// Static method to create deadline reminder
reminderSchema.statics.createDeadlineReminder = async function(deadline, user, daysBefor = 1) {
  const dueDateTime = new Date(deadline.dueDate);
  const remindAt = new Date(dueDateTime.getTime() - daysBefor * 24 * 60 * 60 * 1000);
  
  return this.create({
    userId: user._id,
    reminderType: 'deadline',
    relatedId: deadline._id,
    relatedModel: 'Deadline',
    title: `Deadline Reminder: ${deadline.title}`,
    message: `Your ${deadline.deadlineType} "${deadline.title}" is due in ${daysBefor} day(s).`,
    remindAt: remindAt,
    channel: user.notificationSettings.deadlineReminder ? 'email' : 'in_app',
    recipientEmail: user.email,
    priority: deadline.priorityLevel === 'critical' ? 'urgent' : 'high',
    metadata: {
      deadlineType: deadline.deadlineType,
      dueDate: deadline.dueDate,
      timeUntilEvent: daysBefor * 24 * 60,
      actionUrl: `/deadlines/${deadline._id}`,
      actionLabel: 'View Deadline'
    }
  });
};

module.exports = mongoose.model('Reminder', reminderSchema);
