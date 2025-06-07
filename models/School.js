// models/School.js
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const SchoolSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // (Optional) If you still want a “token” for some other purpose,
    // but we’ll not enforce it in headers for signup. You may omit it
    // entirely if you don’t need tokens.
    token: {
      type: String,
      unique: true,
      trim: true,
    },
    // You can add additional fields here, e.g. address, contact, etc.
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = model("School", SchoolSchema);
