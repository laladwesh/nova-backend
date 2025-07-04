// controllers/analyticsController.js

/**
 * Analytics Controller
 *  - getAttendanceAnalytics:      Return attendance statistics for a class over a date range
 *  - getGradesAnalytics:          Return grade statistics (avg, median, max, min) for a class/exam
 *  - getTeacherPerformance:       Return performance metrics for a teacher over a period
 *  - getSchoolPerformance:        Return school‐wide metrics (attendance trend, average grades, fee collection)
 *  - getClassAverages:            Return class‐level averages for a subject/exam
 *  - getStudentVsClass:           Compare a single student’s score vs class average for a subject/exam
 *
 * Models Used:
 *  - AttendanceRecord: { classId, subject, date, entries: [ { studentId, status } ] }
 *  - Grade:            { studentId, subject, examType, marksObtained, maxMarks, teacherId, gradedAt }
 *  - Teacher:          { _id, classes (array of ClassId), ... }
 *  - Class:            { _id, name, ... }
 *  - Student:          { _id, classId, ... }
 *  - Payment:          { studentId, feeStructureId, amountPaid, paymentDate, ... }
 */

const mongoose = require("mongoose");
const {
  AttendanceRecord,
  Grade,
  Teacher,
  Class,
  Student,
  Payment,
} = require("../models");

module.exports = {
  // GET /analytics/attendance?classId=&startDate=&endDate=
  getAttendanceAnalytics: async (req, res) => {
    try {
      const { classId, startDate, endDate } = req.query;
      if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Valid classId is required." });
      }
      const match = { classId: new mongoose.Types.ObjectId(classId) };
      if (startDate) {
        match.date = { ...match.date, $gte: new Date(startDate) };
      }
      if (endDate) {
        match.date = { ...match.date, $lte: new Date(endDate) };
      }

      // Unwind entries to compute present/total per day
      const pipeline = [
        { $match: match },
        { $unwind: "$entries" },
        {
          $group: {
            _id: { date: "$date" },
            totalStudents: { $sum: 1 },
            presentCount: {
              $sum: {
                $cond: [{ $eq: ["$entries.status", "present"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            date: "$_id.date",
            attendancePct: {
              $multiply: [
                { $divide: ["$presentCount", "$totalStudents"] },
                100,
              ],
            },
          },
        },
        { $sort: { date: 1 } },
      ];

      const results = await AttendanceRecord.aggregate(pipeline);
      return res.status(200).json({ success: true, data: results });
    } catch (err) {
      console.error("analyticsController.getAttendanceAnalytics error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /analytics/grades?classId=&subject=
  getGradesAnalytics: async (req, res) => {
    try {
      const { classId, subject } = req.query;
      if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({
          success: false,
          message: "Valid classId is required",
        });
      }

      // Match by classId and subject if provided
      const match = { classId: new mongoose.Types.ObjectId(classId) };
      if (subject) match.subjectId = subject;

      // Aggregate marks using the structure with entries array
      const pipeline = [
        { $match: match },
        // Unwind the entries array to work with individual student results
        { $unwind: "$entries" },
        {
          $group: {
            _id: null,
            avgMarks: { $avg: "$entries.percentage" },
            maxMarks: { $max: "$entries.percentage" },
            minMarks: { $min: "$entries.percentage" },
            count: { $sum: 1 },
            allMarks: { $push: "$entries.percentage" },
          },
        },
        {
          $project: {
            _id: 0,
            average: { $round: ["$avgMarks", 2] },
            highest: "$maxMarks",
            lowest: "$minMarks",
            count: 1,
            median: {
              $let: {
                vars: {
                  sorted: { $sortArray: { input: "$allMarks", sortBy: 1 } },
                  count: "$count",
                },
                in: {
                  $cond: {
                    if: { $eq: [{ $mod: ["$$count", 2] }, 0] },
                    then: {
                      $avg: [
                        {
                          $arrayElemAt: [
                            "$$sorted",
                            { $subtract: [{ $divide: ["$$count", 2] }, 1] },
                          ],
                        },
                        {
                          $arrayElemAt: [
                            "$$sorted",
                            { $divide: ["$$count", 2] },
                          ],
                        },
                      ],
                    },
                    else: {
                      $arrayElemAt: [
                        "$$sorted",
                        { $floor: { $divide: ["$$count", 2] } },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      ];

      // Update the collection name if needed - using your actual model
      const [stats] = await Grade.aggregate(pipeline);
      return res.status(200).json({ success: true, data: stats || {} });
    } catch (err) {
      console.error("analyticsController.getGradesAnalytics error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /analytics/teacher-performance?teacherId=&period=month|quarter|year
  getTeacherPerformance: async (req, res) => {
    try {
      const { teacherId, period = "month" } = req.query; // Set default period to 'month'

      if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
        return res.status(400).json({
          success: false,
          message: "Valid teacherId is required",
        });
      }

      // Calculate date cutoff based on period (default to 1 month if not specified)
      const now = new Date();
      let dateCutoff = new Date();
      switch (period) {
        case "quarter":
          dateCutoff.setMonth(now.getMonth() - 3);
          break;
        case "year":
          dateCutoff.setFullYear(now.getFullYear() - 1);
          break;
        case "month":
        default:
          dateCutoff.setMonth(now.getMonth() - 1);
          break;
      }

      // First retrieve the teacher to make sure they exist
      const teacherData = await Teacher.findById(teacherId);

      if (!teacherData) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found",
        });
      }

      // Now use teacherData instead of undefined 'teacher' variable
      const classIds = teacherData.classes || [];

      // Query attendance data for teacher's classes
      const attendanceData = await AttendanceRecord.aggregate([
        {
          $match: {
            classId: { $in: classIds.map((id) => new mongoose.Types.ObjectId(id)) },
            date: { $gte: dateCutoff },
          },
        },
        {
          $unwind: "$entries",
        },
        {
          $group: {
            _id: { classId: "$classId", date: "$date" },
            total: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ["$entries.status", "present"] }, 1, 0] },
            },
          },
        },
        {
          $group: {
            _id: "$_id.classId",
            avgAttendance: {
              $avg: { $multiply: [{ $divide: ["$present", "$total"] }, 100] },
            },
          },
        },
      ]);
      const attendanceStats = attendanceData.map((item) => ({
        classId: item._id,
        avgAttendancePct: Math.round(item.avgAttendance),
      }));

      // Query grades data
      const gradesData = await Grade.aggregate([
        {
          $match: {
            teacherId: new mongoose.Types.ObjectId(teacherId),
            gradedAt: { $gte: dateCutoff },
          },
        },
        {
          $group: {
            _id: null,
            avgMarks: { $avg: "$marksObtained" },
            count: { $sum: 1 },
          },
        },
      ]);
      const [gradeStats] = gradesData;

      // 3. Classes taught count
      const classCount = classIds.length;

      return res.status(200).json({
        success: true,
        data: {
          teacherName: teacherData.name,
          period: period,
          classCount,
          attendanceByClass: attendanceStats,
          averageGradeGiven: gradeStats ? Math.round(gradeStats.avgMarks) : 0,
          totalGradesGiven: gradeStats ? gradeStats.count : 0,
        },
      });
    } catch (err) {
      console.error("analyticsController.getTeacherPerformance error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /analytics/school-performance?year=
  getSchoolPerformance: async (req, res) => {
    try {
      const { year } = req.query;
      const filter = {};
      if (year) {
        const y = parseInt(year, 10);
        filter.paymentDate = {
          $gte: new Date(y, 0, 1),
          $lte: new Date(y, 11, 31, 23, 59, 59),
        };
      }

      // 1. Attendance: school‐wide average attendance per month
      const attendancePipeline = [
        {
          $unwind: "$entries",
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              studentId: "$entries.studentId",
            },
            totalStatus: {
              $sum: { $cond: [{ $eq: ["$entries.status", "present"] }, 1, 0] },
            },
            totalCount: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: { year: "$_id.year", month: "$_id.month" },
            monthlyAvg: {
              $avg: {
                $multiply: [{ $divide: ["$totalStatus", "$totalCount"] }, 100],
              },
            },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
      ];
      const attendanceMonthly = await AttendanceRecord.aggregate(
        attendancePipeline
      );

      // 2. Grades: overall school average grade per examType
      const gradePipeline = [
        {
          $group: {
            _id: "$examType",
            avgMarks: { $avg: "$marksObtained" },
            count: { $sum: 1 },
          },
        },
      ];
      const gradeStats = await Grade.aggregate(gradePipeline);

      // 3. Fee Collections: total amount per month
      const paymentPipeline = [
        ...(filter.paymentDate ? [{ $match: filter }] : []),
        {
          $group: {
            _id: {
              year: { $year: "$paymentDate" },
              month: { $month: "$paymentDate" },
            },
            totalCollected: { $sum: "$amountPaid" },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
      ];
      const feeCollections = await Payment.aggregate(paymentPipeline);

      return res.status(200).json({
        success: true,
        data: {
          attendanceMonthly: attendanceMonthly.map((item) => ({
            year: item._id.year,
            month: item._id.month,
            avgAttendancePct: Math.round(item.monthlyAvg),
          })),
          gradeStats: gradeStats.map((item) => ({
            examType: item._id,
            averageMarks: Math.round(item.avgMarks),
            count: item.count,
          })),
          feeCollections: feeCollections.map((item) => ({
            year: item._id.year,
            month: item._id.month,
            totalCollected: item.totalCollected,
          })),
        },
      });
    } catch (err) {
      console.error("analyticsController.getSchoolPerformance error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /analytics/class-averages?classId=&subject=&examType=
  getClassAverages: async (req, res) => {
    try {
      const { classId, subject, examType } = req.query;
      if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Valid classId is required." });
      }
      if (!subject || !examType) {
        return res
          .status(400)
          .json({
            success: false,
            message: "subject and examType are required.",
          });
      }

      // Find students in class
      const students = await Student.find({
        classId: mongoose.Types.ObjectId(classId),
      }).select("_id");
      const studentIds = students.map((s) => s._id);

      // Aggregate grades for those students, subject, and examType
      const pipeline = [
        {
          $match: {
            studentId: { $in: studentIds },
            subject,
            examType,
          },
        },
        {
          $group: {
            _id: null,
            avgMarks: { $avg: "$marksObtained" },
            maxMarks: { $max: "$marksObtained" },
            minMarks: { $min: "$marksObtained" },
            count: { $sum: 1 },
            allMarks: { $push: "$marksObtained" },
          },
        },
        {
          $project: {
            _id: 0,
            average: { $round: ["$avgMarks", 2] },
            highest: "$maxMarks",
            lowest: "$minMarks",
            count: 1,
            median: {
              $let: {
                vars: {
                  sorted: { $sortArray: { input: "$allMarks" } },
                  cnt: "$count",
                },
                in: {
                  $cond: {
                    if: { $eq: [{ $mod: ["$$cnt", 2] }, 0] },
                    then: {
                      $avg: [
                        {
                          $arrayElemAt: [
                            "$$sorted",
                            { $subtract: [{ $divide: ["$$cnt", 2] }, 1] },
                          ],
                        },
                        {
                          $arrayElemAt: ["$$sorted", { $divide: ["$$cnt", 2] }],
                        },
                      ],
                    },
                    else: {
                      $arrayElemAt: [
                        "$$sorted",
                        { $floor: { $divide: ["$$cnt", 2] } },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      ];

      const [stats] = await Grade.aggregate(pipeline);
      return res.status(200).json({ success: true, data: stats || {} });
    } catch (err) {
      console.error("analyticsController.getClassAverages error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /analytics/student-vs-class?studentId=&subject=&examType=
  getStudentVsClass: async (req, res) => {
    try {
      const { studentId, subject, examType } = req.query;
      if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Valid studentId is required." });
      }
      if (!subject || !examType) {
        return res
          .status(400)
          .json({
            success: false,
            message: "subject and examType are required.",
          });
      }

      // Find student to get classId
      const student = await Student.findById(studentId).select("classId");
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }
      const classId = student.classId;

      // 1. Get student's own score
      const studentGrade = await Grade.findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        subject,
        examType,
      }).select("marksObtained");
      const studentScore = studentGrade ? studentGrade.marksObtained : null;

      // 2. Get class average
      const studentsInClass = await Student.find({ classId }).select("_id");
      const studentIds = studentsInClass.map((s) => s._id);
      const pipeline = [
        {
          $match: {
            studentId: { $in: studentIds },
            subject,
            examType,
          },
        },
        {
          $group: {
            _id: null,
            avgMarks: { $avg: "$marksObtained" },
            count: { $sum: 1 },
          },
        },
      ];
      const [classStats] = await Grade.aggregate(pipeline);

      return res.status(200).json({
        success: true,
        data: {
          studentScore,
          classAverage: classStats ? Math.round(classStats.avgMarks) : null,
          studentsCounted: classStats ? classStats.count : 0,
        },
      });
    } catch (err) {
      console.error("analyticsController.getStudentVsClass error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
