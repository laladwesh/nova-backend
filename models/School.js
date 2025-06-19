const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const SchoolSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    teachers: {
      type: [{ type: Schema.Types.ObjectId, ref: "Teacher" }],
      default: [],
    },
    students: {
      type: [{ type: Schema.Types.ObjectId, ref: "Student" }],
      default: [],
    },
    classes: {
      type: [{ type: Schema.Types.ObjectId, ref: "Class" }],
      default: [],
    },
    parents: {
      type: [{ type: Schema.Types.ObjectId, ref: "Parent" }],
      default: [],
    },
    admins: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    address: { type: String, default: "" },
    phone:   { type: String, default: "" },
    email:   { type: String, default: "", unique: true},
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model("School", SchoolSchema);
