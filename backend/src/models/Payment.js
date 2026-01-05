const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: String,
    required: true,
    enum: ['oneMonth', 'threeMonths', 'oneYear']
  },
  planName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentCode: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'expired'],
    default: 'pending'
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'bank_transfer'
  },
  bankInfo: {
    accountName: String,
    accountNumber: String,
    bankName: String
  },
  submittedAt: {
    type: Date
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expiresAt: {
    type: Date
  },
  notes: String
}, {
  timestamps: true
});

// Index for faster queries
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ paymentCode: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Auto expire pending payments after 24 hours
paymentSchema.pre('save', function(next) {
  if (this.isNew && this.status === 'pending') {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
