const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'payment', 'email', 'security', 'feature', 'limit', 'ai', 'gamification'],
    default: 'general'
  },
  description: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes
systemConfigSchema.index({ category: 1 });
systemConfigSchema.index({ isPublic: 1 });

// Static method to get config value
systemConfigSchema.statics.getValue = async function(key, defaultValue = null) {
  const config = await this.findOne({ key });
  return config ? config.value : defaultValue;
};

// Static method to set config value
systemConfigSchema.statics.setValue = async function(key, value, modifiedBy = null) {
  return await this.findOneAndUpdate(
    { key },
    { value, lastModifiedBy: modifiedBy, updatedAt: Date.now() },
    { new: true, upsert: true }
  );
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
