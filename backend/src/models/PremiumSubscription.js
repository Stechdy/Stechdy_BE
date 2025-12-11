const mongoose = require('mongoose');

const premiumSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
    index: true
  },
  plan: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: [true, 'Plan type is required']
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    unique: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'apple_pay', 'google_pay'],
    default: 'stripe'
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes (userId and transactionId already have unique: true and index: true)
premiumSubscriptionSchema.index({ status: 1 });
premiumSubscriptionSchema.index({ endDate: 1 });

// Method to check if subscription is active
premiumSubscriptionSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && this.endDate > now;
};

// Pre-save hook to update status based on dates
premiumSubscriptionSchema.pre('save', function(next) {
  const now = new Date();
  if (this.endDate < now && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

module.exports = mongoose.model('PremiumSubscription', premiumSubscriptionSchema);
