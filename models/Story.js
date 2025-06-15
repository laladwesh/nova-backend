// models/Story.js
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const StorySchema = new Schema({
  schoolId: {
    type: Schema.Types.ObjectId,
    ref: "School",
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  mediaUrl: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ["image", "video"],
    required: true
  },
}, {
  timestamps: true  // adds createdAt
});

// TTL index: documents expire 24h after `createdAt`
StorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 3600 });

module.exports = model("Story", StorySchema);
