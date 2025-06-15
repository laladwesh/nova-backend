// models/Schedule.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const PeriodSchema = new Schema(
  {
    dayOfWeek: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
    periodNumber: { type: Number, required: true },
    // if you already have a Subject model, reference it here:
    subject: { type: String , required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime: { type: String, required: true },   // e.g. "09:45"
  },
  { _id: false }
);

const ScheduleSchema = new Schema(
  {
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    periods: { type: [PeriodSchema], required: true, validate: v => v.length > 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Schedule", ScheduleSchema);
