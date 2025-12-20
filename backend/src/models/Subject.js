const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
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
    subjectName: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: [200, 'Subject name must not exceed 200 characters']
    },
    subjectCode: {
      type: String,
      trim: true,
      uppercase: true
    },
    syllabus: {
      type: String,
      default: ''
    },
    syllabusStructure: [{
      topic: {
        type: String,
        required: true
      },
      description: String,
      estimatedHours: {
        type: Number,
        min: 0
      },
      completed: {
        type: Boolean,
        default: false
      }
    }],
    instructor: {
      name: String,
      email: String,
      officeHours: String
    },
    priorityLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true
    },
    difficultyLevel: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'very_hard'],
      default: 'medium'
    },
    credits: {
      type: Number,
      min: 0,
      default: 3
    },
    color: {
      type: String,
      default: '#8AC0D5'
    },
    estimatedWeeklyHours: {
      type: Number,
      min: 0,
      default: 3
    },
    actualWeeklyHours: {
      type: Number,
      min: 0,
      default: 0
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    grade: {
      type: String,
      default: ''
    },
    isArchived: {
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
subjectSchema.index({ userId: 1, semesterId: 1 });
subjectSchema.index({ semesterId: 1, priorityLevel: 1 });
subjectSchema.index({ userId: 1, isArchived: 1 });

// Virtual for deadlines
subjectSchema.virtual('deadlines', {
  ref: 'Deadline',
  localField: '_id',
  foreignField: 'subjectId'
});

// Method to calculate progress
subjectSchema.methods.updateProgress = function() {
  if (this.syllabusStructure && this.syllabusStructure.length > 0) {
    const completed = this.syllabusStructure.filter(item => item.completed).length;
    this.progress = Math.round((completed / this.syllabusStructure.length) * 100);
  }
  return this.save();
};

module.exports = mongoose.model('Subject', subjectSchema);
