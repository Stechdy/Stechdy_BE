const mongoose = require('mongoose');

const studySessionScheduleSchema = new mongoose.Schema(
  {
    timetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyTimetable',
      required: [true, 'Timetable ID is required'],
      index: true
    },
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
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true
    },
    dayOfWeek: {
      type: Number,
      required: [true, 'Day of week is required'],
      min: 0,
      max: 6
    },
    sessionType: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      required: [true, 'Session type is required'],
      index: true
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
    },
    resources: [{
      type: {
        type: String,
        enum: ['textbook', 'video', 'article', 'practice', 'notes', 'other'],
        default: 'other'
      },
      name: String,
      url: String,
      pages: String
    }],
    isUserEdited: {
      type: Boolean,
      default: false
    },
    editHistory: [{
      editedAt: {
        type: Date,
        default: Date.now
      },
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }],
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'missed'],
      default: 'scheduled',
      index: true
    },
    actualStartTime: Date,
    actualEndTime: Date,
    actualDuration: {
      type: Number,
      min: 0
    },
    focusLevel: {
      type: Number,
      min: 1,
      max: 5
    },
    completionNotes: {
      type: String,
      default: ''
    },
    completedTopics: [{
      type: String
    }],
    reminderSent: {
      type: Boolean,
      default: false
    },
    reminderSentAt: Date,
    // Fields for tracking active session
    confirmedAt: Date,
    isPaused: {
      type: Boolean,
      default: false
    },
    pausedAt: Date,
    pausedDuration: {
      type: Number,
      default: 0,
      min: 0
    },
    completionEmailSent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes
studySessionScheduleSchema.index({ userId: 1, date: 1, sessionType: 1 });
studySessionScheduleSchema.index({ timetableId: 1, status: 1 });
studySessionScheduleSchema.index({ subjectId: 1, date: -1 });
studySessionScheduleSchema.index({ date: 1, status: 1 });

// Validate max 3 sessions per day per user
studySessionScheduleSchema.pre('save', async function(next) {
  if (this.isNew) {
    const sameDaySessions = await this.constructor.countDocuments({
      userId: this.userId,
      date: this.date,
      _id: { $ne: this._id }
    });
    
    if (sameDaySessions >= 3) {
      next(new Error('Maximum 3 study sessions per day'));
    }
  }
  next();
});

// Method to get duration in minutes
studySessionScheduleSchema.methods.getDurationMinutes = function() {
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  return endMinutes - startMinutes;
};

// Method to mark session as completed
studySessionScheduleSchema.methods.complete = function(focusLevel, notes, completedTopics, actualDuration) {
  this.status = 'completed';
  this.actualEndTime = new Date();
  this.focusLevel = focusLevel || this.focusLevel;
  this.completionNotes = notes || this.completionNotes;
  this.completedTopics = completedTopics || this.completedTopics;
  
  if (actualDuration) {
    this.actualDuration = actualDuration;
  } else if (this.actualStartTime) {
    const duration = (this.actualEndTime - this.actualStartTime) / (1000 * 60);
    this.actualDuration = Math.round(duration);
  }
  
  return this.save();
};

// Method to reschedule session
studySessionScheduleSchema.methods.reschedule = function(newDate, newStartTime, newEndTime) {
  this.isUserEdited = true;
  this.editHistory.push({
    editedAt: new Date(),
    field: 'reschedule',
    oldValue: { date: this.date, startTime: this.startTime, endTime: this.endTime },
    newValue: { date: newDate, startTime: newStartTime, endTime: newEndTime }
  });
  this.date = newDate;
  this.startTime = newStartTime;
  this.endTime = newEndTime;
  return this.save();
};

// Method to get computed status (auto-detect missed)
studySessionScheduleSchema.methods.getComputedStatus = function() {
  // If already completed or missed, return as is
  if (this.status === 'completed' || this.status === 'missed') {
    return this.status;
  }
  
  // Check if session time has passed (Vietnam timezone UTC+7)
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  
  const sessionDate = new Date(this.date);
  const [endHour, endMinute] = this.endTime.split(':').map(Number);
  sessionDate.setHours(endHour, endMinute, 0, 0);
  
  // If current time is past session end time and status is still scheduled, return missed
  if (vietnamTime > sessionDate && this.status === 'scheduled') {
    return 'missed';
  }
  
  return this.status;
};

// Transform output to include computed status
studySessionScheduleSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.status = doc.getComputedStatus();
    return ret;
  }
});

studySessionScheduleSchema.set('toObject', {
  transform: function(doc, ret) {
    ret.status = doc.getComputedStatus();
    return ret;
  }
});

module.exports = mongoose.model('StudySessionSchedule', studySessionScheduleSchema);
