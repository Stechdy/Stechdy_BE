const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    reminderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reminder',
      index: true
    },
    notificationType: {
      type: String,
      enum: ['studySession', 'deadline', 'dailySummary', 'weeklyReport', 'achievement', 'system', 'custom'],
      required: [true, 'Notification type is required'],
      index: true
    },
    channel: {
      type: String,
      enum: ['email', 'push', 'sms', 'in_app'],
      required: [true, 'Channel is required'],
      index: true
    },
    recipient: {
      email: String,
      phone: String,
      deviceToken: String
    },
    title: {
      type: String,
      required: [true, 'Title is required']
    },
    message: {
      type: String,
      required: [true, 'Message is required']
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'bounced', 'blocked'],
      required: [true, 'Status is required'],
      index: true
    },
    result: {
      type: String,
      enum: ['delivered', 'opened', 'clicked', 'failed', 'bounced', 'spam', 'unsubscribed'],
      default: 'delivered'
    },
    metadata: {
      provider: String,
      messageId: String,
      errorCode: String,
      errorMessage: String,
      deliveryTime: Number,
      openedAt: Date,
      clickedAt: Date,
      userAgent: String,
      ipAddress: String
    },
    engagementData: {
      opened: {
        type: Boolean,
        default: false
      },
      openedAt: Date,
      clicked: {
        type: Boolean,
        default: false
      },
      clickedAt: Date,
      clickedLink: String
    },
    retryAttempts: {
      type: Number,
      default: 0,
      min: 0
    },
    costInCredits: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes
notificationLogSchema.index({ userId: 1, sentAt: -1 });
notificationLogSchema.index({ reminderId: 1 });
notificationLogSchema.index({ userId: 1, notificationType: 1, sentAt: -1 });
notificationLogSchema.index({ status: 1, channel: 1 });
notificationLogSchema.index({ sentAt: -1, status: 1 });

// Method to mark as opened
notificationLogSchema.methods.markAsOpened = function(openedAt = new Date()) {
  this.result = 'opened';
  this.engagementData.opened = true;
  this.engagementData.openedAt = openedAt;
  this.metadata.openedAt = openedAt;
  return this.save();
};

// Method to mark as clicked
notificationLogSchema.methods.markAsClicked = function(link, clickedAt = new Date()) {
  this.result = 'clicked';
  this.engagementData.clicked = true;
  this.engagementData.clickedAt = clickedAt;
  this.engagementData.clickedLink = link;
  this.metadata.clickedAt = clickedAt;
  return this.save();
};

// Static method to get notification stats
notificationLogSchema.statics.getStats = async function(userId, startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        sentAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$notificationType',
        total: { $sum: 1 },
        success: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        opened: {
          $sum: { $cond: ['$engagementData.opened', 1, 0] }
        },
        clicked: {
          $sum: { $cond: ['$engagementData.clicked', 1, 0] }
        }
      }
    },
    {
      $project: {
        notificationType: '$_id',
        total: 1,
        success: 1,
        failed: 1,
        opened: 1,
        clicked: 1,
        successRate: {
          $multiply: [
            { $divide: ['$success', '$total'] },
            100
          ]
        },
        openRate: {
          $multiply: [
            { $divide: ['$opened', '$success'] },
            100
          ]
        },
        clickRate: {
          $multiply: [
            { $divide: ['$clicked', '$opened'] },
            100
          ]
        }
      }
    }
  ]);
  
  return stats;
};

// Static method to log email notification
notificationLogSchema.statics.logEmail = function(userId, reminderId, title, message, recipientEmail, status, metadata = {}) {
  return this.create({
    userId,
    reminderId,
    notificationType: metadata.notificationType || 'custom',
    channel: 'email',
    recipient: { email: recipientEmail },
    title,
    message,
    status,
    metadata: {
      provider: metadata.provider || 'smtp',
      messageId: metadata.messageId,
      errorCode: metadata.errorCode,
      errorMessage: metadata.errorMessage,
      deliveryTime: metadata.deliveryTime
    }
  });
};

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
