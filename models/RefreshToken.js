// models/RefreshToken.js
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const RefreshTokenSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expires: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Optional TTL index to delete expired tokens automatically
RefreshTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

module.exports = model("RefreshToken", RefreshTokenSchema);
