// models/PasswordResetToken.js
const mongoose = require("mongoose");
const crypto = require("crypto");
const { Schema, model } = mongoose;

const PasswordResetTokenSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // We store only the hash of the raw reset token (never store raw in DB)
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Static helper: hash a raw token string with SHA-256
PasswordResetTokenSchema.statics.hashToken = function (rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

// Optionally clean up expired tokens automatically:
// PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = model("PasswordResetToken", PasswordResetTokenSchema);
