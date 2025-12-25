const mongoose = require('mongoose');

const studyTimetableSchema = new mongoose.Schema(
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
    weekStartDate: {
      type: Date,
      required: [true, 'Week start date is required'],
      index: true
    },
    weekEndDate: {
      type: Date,
      required: [true, 'Week end date is required']
    },
    generatedBy: {
      type: String,
      enum: ['AI', 'manual', 'template'],
      default: 'AI',
      index: true
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'edited', 'archived', 'completed'],
      default: 'active',
      index: true
    },
    aiGenerationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIGenerationResult'
    },
    version: {
      type: Number,
      default: 1,
      min: 1
    },
    totalStudyHours: {
      type: Number,
      default: 0,
      min: 0
    },
    completedHours: {
      type: Number,
      default: 0,
      min: 0
    },
    metadata: {
      totalSessions: {
        type: Number,
        default: 0
      },
      completedSessions: {
        type: Number,
        default: 0
      },
      subjectsIncluded: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      }],
      generationDate: Date,
      lastEditedDate: Date
    },
    notes: {
      type: String,
      default: ''
    },
    isTemplate: {
      type: Boolean,
      default: false
    },
    templateName: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
studyTimetableSchema.index({ userId: 1, semesterId: 1, weekStartDate: -1 });
studyTimetableSchema.index({ userId: 1, status: 1 });
studyTimetableSchema.index({ semesterId: 1, generatedBy: 1 });

// Virtual for study sessions
studyTimetableSchema.virtual('sessions', {
  ref: 'StudySessionSchedule',
  localField: '_id',
  foreignField: 'timetableId'
});

// Virtual for completion percentage
studyTimetableSchema.virtual('completionPercentage').get(function() {
  if (this.metadata.totalSessions === 0) return 0;
  return Math.round((this.metadata.completedSessions / this.metadata.totalSessions) * 100);
});

// Method to calculate total study hours
studyTimetableSchema.methods.calculateTotalHours = async function() {
  const StudySessionSchedule = mongoose.model('StudySessionSchedule');
  const sessions = await StudySessionSchedule.find({ timetableId: this._id });
  
  let totalMinutes = 0;
  let completedMinutes = 0;
  
  sessions.forEach(session => {
    const duration = session.getDurationMinutes();
    totalMinutes += duration;
    if (session.status === 'completed') {
      completedMinutes += duration;
    }
  });
  
  this.totalStudyHours = Math.round(totalMinutes / 60 * 10) / 10;
  this.completedHours = Math.round(completedMinutes / 60 * 10) / 10;
  this.metadata.totalSessions = sessions.length;
  this.metadata.completedSessions = sessions.filter(s => s.status === 'completed').length;
  
  return this.save();
};

// Method to archive timetable
studyTimetableSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Method to mark as edited
studyTimetableSchema.methods.markAsEdited = function() {
  if (this.status === 'active') {
    this.status = 'edited';
    this.metadata.lastEditedDate = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('StudyTimetable', studyTimetableSchema);
