// controllers/attendanceController.js

/**
 * Attendance Controller
 *  - listAttendance:               Return attendance records (optionally filtered by classId or date)
 *  - markAttendance:               Create a new attendance record for a class and subject on a specific date
 *  - updateAttendance:             Update an existing attendance record’s entries (e.g., correct statuses)
 *  - downloadAttendanceReport:     Generate and send a CSV of a single attendance record’s entries
 *  - getClassAttendanceOverview:   Return aggregated attendance metrics for a class over a date range
 *
 * Models used:
 *  - AttendanceRecord: { classId, subject, date, entries: [ { studentId, status } ] }
 *  - Student:          { _id, name, studentId, classId }
 *  - Class:            { _id, name }
 */

const mongoose = require("mongoose");
const { AttendanceRecord, Student, Class } = require("../models");

// Utility to convert an array of objects to CSV string
function arrayToCsv(rows, headers) {
  const lines = [];
  lines.push(headers.join(",")); // header row
  rows.forEach((row) => {
    const line = headers
      .map((h) => {
        let val = row[h] !== undefined && row[h] !== null ? String(row[h]) : "";
        // Escape double quotes by doubling them, then wrap field in quotes if it contains comma or quote or newline
        if (val.includes('"')) {
          val = val.replace(/"/g, '""');
        }
        if (/[",\n]/.test(val)) {
          val = `"${val}"`;
        }
        return val;
      })
      .join(",");
    lines.push(line);
  });
  return lines.join("\n");
}

module.exports = {
  // GET /attendance?classId=&date=
  listAttendance: async (req, res) => {
    try {
      const { classId, date } = req.query;
      const filter = {};
      if (classId) {
        if (!mongoose.Types.ObjectId.isValid(classId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid classId." });
        }
        filter.classId = classId;
      }
      if (date) {
        // match exact date (normalize to midnight)
        const d = new Date(date);
        const next = new Date(d);
        next.setDate(d.getDate() + 1);
        filter.date = { $gte: d, $lt: next };
      }

      const records = await AttendanceRecord.find(filter)
        .sort({ date: -1 })
        .populate("classId", "name grade section year")
        .lean();

      return res.status(200).json({ success: true, data: records });
    } catch (err) {
      console.error("attendanceController.listAttendance error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /attendance
  // Expected body: { classId, subject, date, entries: [ { studentId, status } ] }
  markAttendance: async (req, res) => {
    try {
      const { classId,date, entries } = req.body;
      if (
        !classId ||
        !date ||
        !Array.isArray(entries) ||
        entries.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "classId, bject, date, and a non-empty entries array are required.",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid classId." });
      }

      // Validate student IDs in entries
      for (const e of entries) {
        if (!e.studentId || !mongoose.Types.ObjectId.isValid(e.studentId)) {
          return res.status(400).json({
            success: false,
            message: "Each entry must have a valid studentId.",
          });
        }
        if (!["present", "absent", "late", "excused"].includes(e.status)) {
          return res.status(400).json({
            success: false,
            message: "Status must be one of: present, absent, late, excused.",
          });
        }
      }

      // Check that no record already exists for the same classId,and date
      const recordDate = new Date(date);
      const nextDate = new Date(recordDate);
      nextDate.setDate(recordDate.getDate() + 1);
      const existing = await AttendanceRecord.findOne({
        classId,
        date: { $gte: recordDate, $lt: nextDate },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            "Attendance already marked for this class, and date.",
        });
      }

      const newRecord = await AttendanceRecord.create({
        classId,
        date: recordDate,
        entries,
      });

      return res.status(201).json({
        success: true,
        message: "Attendance marked successfully.",
        data: newRecord,
      });
    } catch (err) {
      console.error("attendanceController.markAttendance error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /attendance/:attendanceId
  // Expected body: { entries: [ { studentId, status } ] }
  updateAttendance: async (req, res) => {
    try {
      const { attendanceId } = req.params;
      const { entries } = req.body;
      if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid attendanceId." });
      }
      if (!Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({
          success: false,
          message: "A non-empty entries array is required to update.",
        });
      }

      // Validate each entry
      for (const e of entries) {
        if (!e.studentId || !mongoose.Types.ObjectId.isValid(e.studentId)) {
          return res.status(400).json({
            success: false,
            message: "Each entry must have a valid studentId.",
          });
        }
        if (!["present", "absent", "late", "excused"].includes(e.status)) {
          return res.status(400).json({
            success: false,
            message: "Status must be one of: present, absent, late, excused.",
          });
        }
      }

      const updated = await AttendanceRecord.findByIdAndUpdate(
        attendanceId,
        { $set: { entries } },
        { new: true, runValidators: true, context: "query" }
      );

      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: "Attendance record not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Attendance record updated successfully.",
        data: updated,
      });
    } catch (err) {
      console.error("attendanceController.updateAttendance error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /attendance/:attendanceId/report
  // GET /attendance/:attendanceId/report?format=csv|pdf
  downloadAttendanceReport: async (req, res) => {
    try {
      const { attendanceId } = req.params;
      const format = (req.query.format || "csv").toLowerCase();
      if (!["csv", "pdf"].includes(format)) {
        return res.status(400).json({
          success: false,
          message: "Invalid format; use ?format=csv or ?format=pdf.",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid attendanceId." });
      }

      const record = await AttendanceRecord.findById(attendanceId)
        .populate("classId", "name")
        .lean();
      if (!record) {
        return res
          .status(404)
          .json({ success: false, message: "Attendance record not found." });
      }

      // fetch students and build rows/headers as before
      const studentIds = record.entries
        .map((e) => e.studentId)
        .filter((id) => mongoose.Types.ObjectId.isValid(id));
      const students = await Student.find({ _id: { $in: studentIds } })
        .select("name studentId")
        .lean();
      const studentMap = {};
      students.forEach((stu) => {
        studentMap[String(stu._id)] = {
          name: stu.name,
          studentId: stu.studentId,
        };
      });

      const className = record.classId ? record.classId.name : "";
      const dateStr = record.date.toISOString().split("T")[0];
      const headers = ["Class", "Date", "StudentID", "StudentName", "Status"];
      const rows = record.entries.map((e) => {
        const sid = String(e.studentId);
        const stu = studentMap[sid] || { name: "", studentId: "" };
        return {
          Class: className,
          Date: dateStr,
          StudentID: stu.studentId,
          StudentName: stu.name,
          Status: e.status,
        };
      });

      if (format === "csv") {
        const csv = arrayToCsv(rows, headers);
        const filename = `attendance_${
          className || attendanceId
        }_${dateStr}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        return res.status(200).send(csv);
      }

      // PDF stub – replace generateAttendancePdf(...) with your PDF logic
      // const pdfBuffer = await generateAttendancePdf(record, students);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="attendance_${attendanceId}_${dateStr}.pdf"`
      );
      return res.status(200).send(Buffer.from("", "binary"));
    } catch (err) {
      console.error(
        "attendanceController.downloadAttendanceReport error:",
        err
      );
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /attendance/class/:classId?startDate=&endDate=
  getClassAttendanceOverview: async (req, res) => {
    try {
      const { classId } = req.params;
      const { startDate, endDate } = req.query;
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid classId." });
      }

      const match = { classId: mongoose.Types.ObjectId(classId) };
      if (startDate) {
        match.date = { ...match.date, $gte: new Date(startDate) };
      }
      if (endDate) {
        match.date = { ...match.date, $lte: new Date(endDate) };
      }

      // Aggregate average attendance % per day
      const pipeline = [
        { $match: match },
        { $unwind: "$entries" },
        {
          $group: {
            _id: "$date",
            total: { $sum: 1 },
            presentCount: {
              $sum: { $cond: [{ $eq: ["$entries.status", "present"] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            attendancePct: {
              $multiply: [{ $divide: ["$presentCount", "$total"] }, 100],
            },
          },
        },
        { $sort: { date: 1 } },
      ];

      const dailyStats = await AttendanceRecord.aggregate(pipeline);

      // Overall average across all matched dates
      const overallAvg =
        dailyStats.length > 0
          ? Math.round(
              dailyStats.reduce((sum, d) => sum + d.attendancePct, 0) /
                dailyStats.length
            )
          : 0;

      const month = req.query.month || new Date().toISOString().slice(0, 7);
      // collect per-student presentDays
      const studentDays = await AttendanceRecord.aggregate([
        { $match: match },
        { $unwind: "$entries" },
        { $match: { "entries.status": "present" } },
        {
          $group: {
            _id: "$entries.studentId",
            presentDays: { $sum: 1 },
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        data: {
          overview: {
            classId,
            month,
            attendancePct: overallAvg,
            daysRecorded: dailyStats.length,
            students: studentDays.map((d) => ({
              studentId: d._id,
              presentDays: d.presentDays,
            })),
          },
        },
      });
    } catch (err) {
      console.error(
        "attendanceController.getClassAttendanceOverview error:",
        err
      );
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
