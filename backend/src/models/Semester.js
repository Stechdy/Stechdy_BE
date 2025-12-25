const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Semester name is required'],
      trim: true,
      maxlength: [100, 'Semester name must not exceed 100 characters']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function(value) {
          return value > this.startDate;
        },
        message: 'End date must be after start date'
      }
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description must not exceed 500 characters'],
      default: ''
    },
    academicYear: {
      type: String,
      trim: true
    },
    term: {
      type: String,
      enum: ['Spring', 'Summer', 'Fall', 'Winter', ''],
      default: ''
    },
    totalCredits: {
      type: Number,
      min: 0,
      default: 0
    },
    color: {
      type: String,
      default: '#6366f1'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
semesterSchema.index({ userId: 1, startDate: -1 });
semesterSchema.index({ userId: 1, isActive: 1 });
semesterSchema.index({ endDate: 1 });

// Virtual for subjects
semesterSchema.virtual('subjects', {
  ref: 'Subject',
  localField: '_id',
  foreignField: 'semesterId'
});

// Virtual for duration in weeks
semesterSchema.virtual('durationWeeks').get(function() {
  const diffTime = Math.abs(this.endDate - this.startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7);
});

// Method to check if semester is current
semesterSchema.methods.isCurrent = function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
};

module.exports = mongoose.model('Semester', semesterSchema);
