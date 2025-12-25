const mongoose = require('mongoose');

const xpLogSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const gamificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
    index: true
  },
  currentLevel: {
    type: Number,
    default: 1,
    min: 1
  },
  currentXP: {
    type: Number,
    default: 0,
    min: 0
  },
  requiredXP: {
    type: Number,
    default: 100
  },
  xpLogs: [xpLogSchema],
  totalXPEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  badges: [{
    name: String,
    description: String,
    earnedAt: Date
  }]
}, {
  timestamps: true
});

// Indexes (userId already has unique: true and index: true)
gamificationSchema.index({ currentLevel: -1, currentXP: -1 });

// Method to add XP
gamificationSchema.methods.addXP = function(amount, reason) {
  this.currentXP += amount;
  this.totalXPEarned += amount;
  this.xpLogs.push({ amount, reason });
  
  // Level up logic
  while (this.currentXP >= this.requiredXP) {
    this.currentXP -= this.requiredXP;
    this.currentLevel += 1;
    this.requiredXP = Math.floor(this.requiredXP * 1.5); // Increase required XP by 50%
  }
};

module.exports = mongoose.model('Gamification', gamificationSchema);
