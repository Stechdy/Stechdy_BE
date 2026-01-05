const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: function() {
        // Password is required only for non-OAuth users
        return !this.googleId;
      },
      select: false
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    avatarUrl: {
      type: String,
      default: null
    },
    premiumStatus: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    premiumExpiryDate: {
      type: Date,
      default: null
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    streakCount: {
      type: Number,
      default: 0,
      min: 0
    },
    level: {
      type: Number,
      default: 1,
      min: 1
    },
    xp: {
      type: Number,
      default: 0,
      min: 0
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true
    },
    settings: {
      notification: {
        type: Boolean,
        default: true
      },
      sounds: {
        type: Boolean,
        default: true
      },
      privacy: {
        type: String,
        enum: ['public', 'private', 'friends'],
        default: 'private'
      }
    },
    notificationSettings: {
      dailyEmail: {
        type: Boolean,
        default: true
      },
      studyReminder: {
        type: Boolean,
        default: true
      },
      deadlineReminder: {
        type: Boolean,
        default: true
      },
      weeklyReport: {
        type: Boolean,
        default: false
      },
      aiSuggestions: {
        type: Boolean,
        default: true
      }
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date,
      default: null
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio must not exceed 500 characters'],
      default: ''
    },
    phone: {
      type: String,
      default: null
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    socialLinks: {
      facebook: String,
      twitter: String,
      linkedin: String,
      instagram: String
    },
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true
      },
      pushNotifications: {
        type: Boolean,
        default: true
      },
      newsletter: {
        type: Boolean,
        default: false
      }
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpire: {
      type: Date,
      default: null
    },
    verificationToken: {
      type: String,
      default: null
    },
    verificationTokenExpire: {
      type: Date,
      default: null
    },
    refreshToken: {
      type: String,
      default: null,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes (email already has unique: true, so no need for separate index)
userSchema.index({ level: -1, xp: -1 });
userSchema.index({ premiumStatus: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ deletedAt: 1 });

// Virtual for mood history
userSchema.virtual('moodHistory', {
  ref: 'MoodTracking',
  localField: '_id',
  foreignField: 'userId'
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Method to check if user is premium
userSchema.methods.isPremium = function() {
  return this.premiumStatus === 'premium';
};

// Method to check if user is admin or moderator
userSchema.methods.isAdminOrModerator = function() {
  return this.role === 'admin' || this.role === 'moderator';
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise increment
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours
  
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: Date.now() },
    $unset: { lockUntil: 1 }
  });
};

// Soft delete method
userSchema.methods.softDelete = function(deletedBy) {
  this.deletedAt = Date.now();
  this.deletedBy = deletedBy;
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
