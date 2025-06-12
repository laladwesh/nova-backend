// controllers/scheduleController.js

/**
 * Schedule Controller
 *  - listSchedules:       Return all schedules (with optional classId filter)
 *  - createSchedule:      Create a new class schedule (timetable)
 *  - getScheduleById:     Return a schedule by ID (with populated class, teacher, subject if desired)
 *  - updateSchedule:      Update an existing schedule
 *  - deleteSchedule:      Delete a schedule
 *
 *  - getTeacherSchedule:  Return all schedule entries for a given teacher across all classes
 *  - getStudentSchedule:  Return the schedule for a given student (by resolving their classId)
 *
 * Assumptions:
 *  - authMiddleware populates req.user = { userId, role }
 *  - Only “school_admin” (or privileged roles) can create/update/delete schedules
 *  - Schedule model has fields:
 *      - classId: ObjectId ref 'Class'
 *      - periods: [
 *          {
 *            dayOfWeek: String,          // e.g. 'Monday'
 *            periodNumber: Number,
 *            subject: String,           // or ObjectId ref 'Subject'
 *            teacherId: ObjectId ref 'Teacher',
 *            startTime: String,         // e.g. '09:00'
 *            endTime: String            // e.g. '09:45'
 *          }
 *        ]
 *
 *  - Student model has field classId to resolve student → class → schedule
 */

const mongoose = require("mongoose");
const { Schedule, Student } = require("../models");

module.exports = {
  // GET /schedules
  listSchedules: async (req, res) => {
    try {
      const { classId } = req.query;
      const filter = {};
      if (classId) {
        if (!mongoose.Types.ObjectId.isValid(classId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid classId." });
        }
        filter.classId = classId;
      }
      const schedules = await Schedule.find(filter)
        .populate("classId", "name grade section year")
        .populate("periods.teacherId", "name teacherId").populate("periods.subject", "name code")
        .select("-__v");
      return res.status(200).json({ success: true, data: schedules });
    } catch (err) {
      console.error("scheduleController.listSchedules error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /schedules
  createSchedule: async (req, res) => {
    try {
      const { classId, periods } = req.body;
      if (!classId || !Array.isArray(periods) || periods.length === 0) {
        return res.status(400).json({
          success: false,
          message: "classId and a non-empty periods array are required.",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid classId." });
      }
      // Validate each period entry
      for (const entry of periods) {
        const {
          dayOfWeek,
          periodNumber,
          subject,
          teacherId,
          startTime,
          endTime,
        } = entry;
        if (
          !dayOfWeek ||
          typeof periodNumber !== "number" ||
          !subject ||
          !teacherId ||
          !startTime ||
          !endTime
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Each period must include dayOfWeek, periodNumber, subject, teacherId, startTime, and endTime.",
          });
        }
        if (!mongoose.Types.ObjectId.isValid(teacherId)) {
          return res
            .status(400)
            .json({
              success: false,
              message: `Invalid teacherId in period ${periodNumber}.`,
            });
        }
      }

      const newSchedule = await Schedule.create({ classId, periods });
      const populated = await Schedule.findById(newSchedule._id)
        .populate("classId", "name grade section year")
        .populate("periods.teacherId", "name teacherId").populate("periods.subject", "name code");

      return res.status(201).json({
        success: true,
        message: "Schedule created successfully.",
        data: populated,
      });
    } catch (err) {
      console.error("scheduleController.createSchedule error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /schedules/:scheduleId
  getScheduleById: async (req, res) => {
    try {
      const { scheduleId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid scheduleId." });
      }
      const schedule = await Schedule.findById(scheduleId)
        .populate("classId", "name grade section year")
        .populate("periods.teacherId", "name teacherId").populate("periods.subject", "name code");
      if (!schedule) {
        return res
          .status(404)
          .json({ success: false, message: "Schedule not found." });
      }
      return res.status(200).json({ success: true, data: schedule });
    } catch (err) {
      console.error("scheduleController.getScheduleById error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /schedules/:scheduleId
  updateSchedule: async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const { periods } = req.body;
      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid scheduleId." });
      }
      if (!Array.isArray(periods) || periods.length === 0) {
        return res.status(400).json({
          success: false,
          message: "A non-empty periods array is required.",
        });
      }
      // Validate each period entry
      for (const entry of periods) {
        const {
          dayOfWeek,
          periodNumber,
          subject,
          teacherId,
          startTime,
          endTime,
        } = entry;
        if (
          !dayOfWeek ||
          typeof periodNumber !== "number" ||
          !subject ||
          !teacherId ||
          !startTime ||
          !endTime
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Each period must include dayOfWeek, periodNumber, subject, teacherId, startTime, and endTime.",
          });
        }
        if (!mongoose.Types.ObjectId.isValid(teacherId)) {
          return res
            .status(400)
            .json({
              success: false,
              message: `Invalid teacherId in period ${periodNumber}.`,
            });
        }
      }

      const updated = await Schedule.findByIdAndUpdate(
        scheduleId,
        { $set: { periods } },
        { new: true, runValidators: true, context: "query" }
      )
        .populate("classId", "name grade section year")
        .populate("periods.teacherId", "name teacherId").populate("periods.subject", "name code");

      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: "Schedule not found." });
      }
      return res.status(200).json({
        success: true,
        message: "Schedule updated successfully.",
        data: updated,
      });
    } catch (err) {
      console.error("scheduleController.updateSchedule error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // DELETE /schedules/:scheduleId
  deleteSchedule: async (req, res) => {
    try {
      const { scheduleId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid scheduleId." });
      }
      const deleted = await Schedule.findByIdAndDelete(scheduleId);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Schedule not found." });
      }
      return res
        .status(200)
        .json({ success: true, message: "Schedule deleted successfully." });
    } catch (err) {
      console.error("scheduleController.deleteSchedule error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /schedules/teacher/:teacherId
  getTeacherSchedule: async (req, res) => {
    try {
      const { teacherId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid teacherId." });
      }
      // Find all schedules where any period’s teacherId matches
      const schedules = await Schedule.find({ "periods.teacherId": teacherId })
        .populate("classId", "name grade section year")
        .populate("periods.teacherId", "name teacherId").populate("periods.subject", "name code");
      return res.status(200).json({ success: true, data: schedules });
    } catch (err) {
      console.error("scheduleController.getTeacherSchedule error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /schedules/student/:studentId
  getStudentSchedule: async (req, res) => {
    try {
      const { studentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }
      const student = await Student.findById(studentId).select("classId");
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }
      const schedule = await Schedule.findOne({ classId: student.classId })
        .populate("classId", "name grade section year")
        .populate("periods.teacherId", "name teacherId").populate("periods.subject", "name code");
        
      if (!schedule) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Schedule not found for this student’s class.",
          });
      }
      return res.status(200).json({ success: true, data: schedule });
    } catch (err) {
      console.error("scheduleController.getStudentSchedule error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
