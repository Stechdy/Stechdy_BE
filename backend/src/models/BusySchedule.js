const mongoose = require('mongoose');

const busyScheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'Semester ID is required'],
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
    dayOfWeek: {
      type: Number,
      required: [true, 'Day of week is required'],
      min: [0, 'Day of week must be 0-6 (Sunday to Saturday)'],
      max: [6, 'Day of week must be 0-6 (Sunday to Saturday)'],
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
    type: {
      type: String,
      enum: ['class', 'work', 'personal', 'commute', 'meal', 'exercise', 'sleep', 'other'],
      default: 'personal',
      index: true
    },
    isRecurring: {
      type: Boolean,
      default: true
    },
    recurrencePattern: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly'],
        default: 'weekly'
      },
      interval: {
        type: Number,
        default: 1,
        min: 1
      },
      endDate: Date
    },
    location: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      default: '#EF4444'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    isFlexible: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes
busyScheduleSchema.index({ userId: 1, semesterId: 1, dayOfWeek: 1 });
busyScheduleSchema.index({ semesterId: 1, isRecurring: 1 });
busyScheduleSchema.index({ userId: 1, type: 1 });

// Validate that end time is after start time
busyScheduleSchema.pre('save', function(next) {
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  if (endMinutes <= startMinutes) {
    next(new Error('End time must be after start time'));
  } else {
    next();
  }
});

// Method to get duration in minutes
busyScheduleSchema.methods.getDurationMinutes = function() {
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  return endMinutes - startMinutes;
};

// Method to check if time conflicts with another schedule
busyScheduleSchema.methods.conflictsWith = function(otherSchedule) {
  if (this.dayOfWeek !== otherSchedule.dayOfWeek) {
    return false;
  }
  
  const thisStart = this.startTime.split(':').map(Number);
  const thisEnd = this.endTime.split(':').map(Number);
  const otherStart = otherSchedule.startTime.split(':').map(Number);
  const otherEnd = otherSchedule.endTime.split(':').map(Number);
  
  const thisStartMin = thisStart[0] * 60 + thisStart[1];
  const thisEndMin = thisEnd[0] * 60 + thisEnd[1];
  const otherStartMin = otherStart[0] * 60 + otherStart[1];
  const otherEndMin = otherEnd[0] * 60 + otherEnd[1];
  
  return !(thisEndMin <= otherStartMin || thisStartMin >= otherEndMin);
};

module.exports = mongoose.model('BusySchedule', busyScheduleSchema);
