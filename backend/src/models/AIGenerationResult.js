const mongoose = require('mongoose');

const aiGenerationResultSchema = new mongoose.Schema(
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
    timetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyTimetable',
      index: true
    },
    aiInputId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIInput',
      required: [true, 'AI Input ID is required'],
      index: true
    },
    generationPrompt: {
      type: String,
      required: [true, 'Generation prompt is required']
    },
    promptTokens: {
      type: Number,
      min: 0
    },
    completionTokens: {
      type: Number,
      min: 0
    },
    totalTokens: {
      type: Number,
      min: 0
    },
    model: {
      type: String,
      default: 'gpt-4'
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    generationReasoning: {
      type: String,
      default: ''
    },
    aiResponse: {
      type: mongoose.Schema.Types.Mixed
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    generatedSchedule: {
      weeklySchedule: [{
        week: Number,
        weekStartDate: Date,
        sessions: [{
          dayOfWeek: Number,
          sessionType: {
            type: String,
            enum: ['morning', 'afternoon', 'evening']
          },
          subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
          },
          subjectName: String,
          startTime: String,
          endTime: String,
          topic: String,
          objectives: [String],
          reasoning: String
        }]
      }],
      totalStudyHours: Number,
      subjectDistribution: [{
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject'
        },
        subjectName: String,
        allocatedHours: Number,
        sessionsCount: Number
      }]
    },
    optimizationFactors: {
      spaceRepetition: {
        type: Boolean,
        default: true
      },
      difficultyBalance: {
        type: Boolean,
        default: true
      },
      deadlineAlignment: {
        type: Boolean,
        default: true
      },
      energyLevels: {
        type: Boolean,
        default: true
      },
      subjectRotation: {
        type: Boolean,
        default: true
      }
    },
    metadata: {
      generationTime: {
        type: Number,
        min: 0
      },
      apiCost: {
        type: Number,
        min: 0
      },
      retryCount: {
        type: Number,
        default: 0,
        min: 0
      },
      version: {
        type: String,
        default: '1.0'
      },
      environment: {
        type: String,
        enum: ['production', 'staging', 'development'],
        default: 'production'
      }
    },
    status: {
      type: String,
      enum: ['processing', 'success', 'failed', 'partial', 'cancelled'],
      default: 'processing',
      index: true
    },
    error: {
      code: String,
      message: String,
      stack: String,
      timestamp: Date
    },
    validationResults: {
      isValid: {
        type: Boolean,
        default: null
      },
      issues: [{
        severity: {
          type: String,
          enum: ['error', 'warning', 'info']
        },
        message: String,
        field: String
      }]
    },
    userFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      helpful: {
        type: Boolean,
        default: null
      },
      reportedIssues: [String],
      submittedAt: Date
    },
    wasApplied: {
      type: Boolean,
      default: false
    },
    appliedAt: {
      type: Date
    },
    alternatives: [{
      description: String,
      confidenceScore: Number,
      schedule: mongoose.Schema.Types.Mixed
    }]
  },
  {
    timestamps: true
  }
);

// Indexes
aiGenerationResultSchema.index({ userId: 1, semesterId: 1, createdAt: -1 });
aiGenerationResultSchema.index({ timetableId: 1 });
aiGenerationResultSchema.index({ aiInputId: 1 });
aiGenerationResultSchema.index({ userId: 1, status: 1 });
aiGenerationResultSchema.index({ createdAt: -1, status: 1 });

// Virtual for cost estimate
aiGenerationResultSchema.virtual('estimatedCost').get(function() {
  if (!this.totalTokens) return 0;
  // Example pricing: $0.03 per 1K tokens for GPT-4
  return (this.totalTokens / 1000) * 0.03;
});

// Method to validate generated schedule
aiGenerationResultSchema.methods.validateSchedule = async function() {
  const issues = [];
  
  if (!this.generatedSchedule || !this.generatedSchedule.weeklySchedule) {
    issues.push({
      severity: 'error',
      message: 'No schedule generated',
      field: 'generatedSchedule'
    });
    this.validationResults = { isValid: false, issues };
    return this.save();
  }
  
  // Check max 3 sessions per day
  for (const week of this.generatedSchedule.weeklySchedule) {
    const sessionsPerDay = {};
    for (const session of week.sessions) {
      const key = `${week.week}-${session.dayOfWeek}`;
      sessionsPerDay[key] = (sessionsPerDay[key] || 0) + 1;
      
      if (sessionsPerDay[key] > 3) {
        issues.push({
          severity: 'error',
          message: `More than 3 sessions on week ${week.week}, day ${session.dayOfWeek}`,
          field: 'sessions'
        });
      }
    }
  }
  
  // Check time conflicts with busy schedule
  const BusySchedule = mongoose.model('BusySchedule');
  const busySlots = await BusySchedule.find({
    userId: this.userId,
    semesterId: this.semesterId
  });
  
  for (const week of this.generatedSchedule.weeklySchedule) {
    for (const session of week.sessions) {
      for (const busy of busySlots) {
        if (busy.dayOfWeek === session.dayOfWeek) {
          const sessionStart = session.startTime.split(':').map(Number);
          const sessionEnd = session.endTime.split(':').map(Number);
          const busyStart = busy.startTime.split(':').map(Number);
          const busyEnd = busy.endTime.split(':').map(Number);
          
          const sessionStartMin = sessionStart[0] * 60 + sessionStart[1];
          const sessionEndMin = sessionEnd[0] * 60 + sessionEnd[1];
          const busyStartMin = busyStart[0] * 60 + busyStart[1];
          const busyEndMin = busyEnd[0] * 60 + busyEnd[1];
          
          if (!(sessionEndMin <= busyStartMin || sessionStartMin >= busyEndMin)) {
            issues.push({
              severity: 'error',
              message: `Session conflicts with busy time: ${busy.title}`,
              field: 'timeConflict'
            });
          }
        }
      }
    }
  }
  
  this.validationResults = {
    isValid: issues.filter(i => i.severity === 'error').length === 0,
    issues
  };
  
  if (this.validationResults.isValid) {
    this.status = 'success';
  } else {
    this.status = 'partial';
  }
  
  return this.save();
};

// Method to apply schedule to timetable
aiGenerationResultSchema.methods.applyToTimetable = async function() {
  if (!this.validationResults.isValid) {
    throw new Error('Cannot apply invalid schedule');
  }
  
  const StudyTimetable = mongoose.model('StudyTimetable');
  const StudySessionSchedule = mongoose.model('StudySessionSchedule');
  
  // Create timetable for each week
  for (const weekData of this.generatedSchedule.weeklySchedule) {
    const timetable = await StudyTimetable.create({
      userId: this.userId,
      semesterId: this.semesterId,
      weekStartDate: weekData.weekStartDate,
      weekEndDate: new Date(new Date(weekData.weekStartDate).getTime() + 6 * 24 * 60 * 60 * 1000),
      generatedBy: 'AI',
      status: 'active',
      aiGenerationId: this._id,
      metadata: {
        generationDate: new Date()
      }
    });
    
    // Create sessions for this timetable
    for (const sessionData of weekData.sessions) {
      const sessionDate = new Date(weekData.weekStartDate);
      sessionDate.setDate(sessionDate.getDate() + sessionData.dayOfWeek);
      
      await StudySessionSchedule.create({
        timetableId: timetable._id,
        userId: this.userId,
        subjectId: sessionData.subjectId,
        date: sessionDate,
        dayOfWeek: sessionData.dayOfWeek,
        sessionType: sessionData.sessionType,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        topic: sessionData.topic,
        objectives: sessionData.objectives || [],
        isUserEdited: false,
        status: 'scheduled'
      });
    }
    
    await timetable.calculateTotalHours();
  }
  
  this.wasApplied = true;
  this.appliedAt = new Date();
  
  return this.save();
};

// Method to add user feedback
aiGenerationResultSchema.methods.addFeedback = function(rating, comments, helpful, issues = []) {
  this.userFeedback = {
    rating,
    comments,
    helpful,
    reportedIssues: issues,
    submittedAt: new Date()
  };
  return this.save();
};

// Static method to get generation stats
aiGenerationResultSchema.statics.getGenerationStats = async function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidenceScore' },
        avgTokens: { $avg: '$totalTokens' },
        avgGenerationTime: { $avg: '$metadata.generationTime' }
      }
    }
  ]);
};

module.exports = mongoose.model('AIGenerationResult', aiGenerationResultSchema);
