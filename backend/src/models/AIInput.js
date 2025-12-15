const mongoose = require('mongoose');

const aiInputSchema = new mongoose.Schema(
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
    inputType: {
      type: String,
      enum: ['syllabus', 'busySchedule', 'preferences', 'constraints', 'fullContext'],
      required: [true, 'Input type is required'],
      index: true
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Payload is required']
    },
    version: {
      type: Number,
      default: 1,
      min: 1
    },
    status: {
      type: String,
      enum: ['draft', 'validated', 'processed', 'archived'],
      default: 'draft',
      index: true
    },
    validationResult: {
      isValid: {
        type: Boolean,
        default: null
      },
      errors: [{
        field: String,
        message: String,
        code: String
      }],
      warnings: [{
        field: String,
        message: String
      }]
    },
    metadata: {
      source: {
        type: String,
        enum: ['manual', 'import', 'api', 'template'],
        default: 'manual'
      },
      format: String,
      originalFileName: String,
      processedAt: Date,
      processingTime: Number
    },
    structuredData: {
      subjects: [{
        name: String,
        syllabus: String,
        topics: [String],
        estimatedHours: Number,
        priority: String,
        difficulty: String
      }],
      busySlots: [{
        dayOfWeek: Number,
        startTime: String,
        endTime: String,
        type: String,
        recurring: Boolean
      }],
      preferences: {
        preferredStudyTimes: [String],
        sessionDuration: Number,
        breakDuration: Number,
        maxSessionsPerDay: Number,
        avoidWeekends: Boolean,
        studyStyle: String
      },
      constraints: {
        totalWeeklyHours: Number,
        minHoursPerSubject: Number,
        maxHoursPerSubject: Number,
        deadlines: [{
          subjectName: String,
          deadline: Date,
          weight: Number
        }]
      }
    },
    relatedGeneration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIGenerationResult'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
aiInputSchema.index({ userId: 1, semesterId: 1, createdAt: -1 });
aiInputSchema.index({ semesterId: 1, inputType: 1 });
aiInputSchema.index({ userId: 1, status: 1 });

// Method to validate input data
aiInputSchema.methods.validate = async function() {
  const errors = [];
  const warnings = [];
  
  try {
    // Validate based on input type
    switch(this.inputType) {
      case 'syllabus':
        if (!this.payload.subjects || this.payload.subjects.length === 0) {
          errors.push({
            field: 'subjects',
            message: 'At least one subject is required',
            code: 'REQUIRED_FIELD'
          });
        }
        break;
        
      case 'busySchedule':
        if (!this.payload.busySlots || this.payload.busySlots.length === 0) {
          warnings.push({
            field: 'busySlots',
            message: 'No busy time slots provided - AI will use default availability'
          });
        }
        break;
        
      case 'fullContext':
        if (!this.payload.subjects) {
          errors.push({
            field: 'subjects',
            message: 'Subjects are required for full context',
            code: 'REQUIRED_FIELD'
          });
        }
        break;
    }
    
    this.validationResult = {
      isValid: errors.length === 0,
      errors,
      warnings
    };
    
    if (errors.length === 0) {
      this.status = 'validated';
    }
    
  } catch (error) {
    this.validationResult = {
      isValid: false,
      errors: [{
        field: 'general',
        message: error.message,
        code: 'VALIDATION_ERROR'
      }]
    };
  }
  
  return this.save();
};

// Method to structure raw data
aiInputSchema.methods.structureData = function() {
  if (!this.payload) return;
  
  const structured = {};
  
  // Extract subjects
  if (this.payload.subjects) {
    structured.subjects = this.payload.subjects.map(s => ({
      name: s.name || s.subjectName,
      syllabus: s.syllabus,
      topics: s.topics || [],
      estimatedHours: s.estimatedHours || s.weeklyHours || 3,
      priority: s.priority || 'medium',
      difficulty: s.difficulty || 'medium'
    }));
  }
  
  // Extract busy schedule
  if (this.payload.busySlots) {
    structured.busySlots = this.payload.busySlots.map(slot => ({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      type: slot.type || 'personal',
      recurring: slot.recurring !== false
    }));
  }
  
  // Extract preferences
  if (this.payload.preferences) {
    structured.preferences = {
      preferredStudyTimes: this.payload.preferences.preferredStudyTimes || ['morning', 'afternoon', 'evening'],
      sessionDuration: this.payload.preferences.sessionDuration || 90,
      breakDuration: this.payload.preferences.breakDuration || 15,
      maxSessionsPerDay: this.payload.preferences.maxSessionsPerDay || 3,
      avoidWeekends: this.payload.preferences.avoidWeekends || false,
      studyStyle: this.payload.preferences.studyStyle || 'balanced'
    };
  }
  
  this.structuredData = structured;
  this.status = 'processed';
  this.metadata.processedAt = new Date();
  
  return this.save();
};

// Static method to create from semester data
aiInputSchema.statics.createFromSemester = async function(userId, semesterId) {
  const Subject = mongoose.model('Subject');
  const BusySchedule = mongoose.model('BusySchedule');
  
  const subjects = await Subject.find({ userId, semesterId });
  const busySchedules = await BusySchedule.find({ userId, semesterId });
  
  const payload = {
    subjects: subjects.map(s => ({
      name: s.subjectName,
      syllabus: s.syllabus,
      priority: s.priorityLevel,
      difficulty: s.difficultyLevel,
      weeklyHours: s.estimatedWeeklyHours
    })),
    busySlots: busySchedules.map(b => ({
      dayOfWeek: b.dayOfWeek,
      startTime: b.startTime,
      endTime: b.endTime,
      type: b.type,
      recurring: b.isRecurring
    }))
  };
  
  return this.create({
    userId,
    semesterId,
    inputType: 'fullContext',
    payload,
    status: 'draft',
    metadata: {
      source: 'api'
    }
  });
};

module.exports = mongoose.model('AIInput', aiInputSchema);
