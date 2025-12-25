const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_created',
      'user_updated',
      'user_deleted',
      'user_login',
      'user_logout',
      'password_changed',
      'password_reset',
      'email_verified',
      'task_created',
      'task_updated',
      'task_deleted',
      'study_session_started',
      'study_session_completed',
      'note_created',
      'note_updated',
      'note_deleted',
      'subscription_started',
      'subscription_cancelled',
      'subscription_renewed',
      'payment_success',
      'payment_failed',
      'level_up',
      'badge_earned',
      'streak_milestone',
      'settings_updated',
      'admin_action',
      'moderator_action',
      'data_export',
      'data_import',
      'other'
    ]
  },
  category: {
    type: String,
    enum: ['authentication', 'user', 'content', 'payment', 'gamification', 'admin', 'system'],
    default: 'user'
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  targetType: {
    type: String,
    enum: ['User', 'Task', 'SmartNote', 'Subscription', 'Payment', null],
    default: null
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ status: 1 });
activityLogSchema.index({ severity: 1 });
activityLogSchema.index({ createdAt: -1 });

// TTL index - auto delete logs older than 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model('ActivityLog', activityLogSchema);
