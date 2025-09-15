const mongoose = require('mongoose');

const rainAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  whatsappNumber: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      default: 'Location'
    },
    city: String,
    state: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  alertDays: {
    type: Number,
    default: 4,
    min: 1,
    max: 7
  },
  rainThreshold: {
    type: Number,
    default: 2.5,
    min: 0.5,
    max: 50
  },
  alertTime: {
    type: String,
    default: '08:00'
  },
  language: {
    type: String,
    enum: ['hindi', 'english', 'both'],
    default: 'both'
  },
  lastAlertSent: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better performance
rainAlertSchema.index({ userId: 1 });
rainAlertSchema.index({ isActive: 1 });
rainAlertSchema.index({ lastAlertSent: 1 });

const RainAlert = mongoose.model('RainAlert', rainAlertSchema);

module.exports = RainAlert;
