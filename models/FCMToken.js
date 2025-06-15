const mongoose = require('mongoose');

const fcmTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    trim: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'School'
  },
  topic: {
    type: String,
    trim: true,
    default: null
  },
  deviceType: {
    type: String,
    enum: ['android', 'ios', 'web'],
    default: 'android'
  },
  role: {
      type: String,
      enum: ["student", "teacher", "school_admin", "parent"],
      default: "student",
      required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' 
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
fcmTokenSchema.index({ objectId: 1, schoolId: 1 });
fcmTokenSchema.index({ schoolId: 1, topic: 1 });
fcmTokenSchema.index({ token: 1 }, { unique: true });

module.exports = mongoose.model('FCMToken', fcmTokenSchema);