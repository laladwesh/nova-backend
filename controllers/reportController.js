// controllers/reportController.js

/**
 * Report Controller
 *  - downloadAttendanceReport:    Generate and send a CSV of attendance records
 *  - downloadGradesReport:        Generate and send a CSV of grades records
 *  - downloadFeeCollectionReport: Generate and send a CSV of fee payment records
 *
 * Assumptions:
 *  - authMiddleware ensures req.user contains { userId, role }
 *  - For simplicity, all reports are CSV. If you need PDF, you can integrate a PDF library (e.g. pdfkit) here.
 *  - Query parameters can be used to filter by classId and date ranges, where applicable.
 *
 * Models used:
 *  - AttendanceRecord: { classId, date, entries: [ { studentId, status } ] }
 *  - Grade:            { studentId, subject, examType, marksObtained, maxMarks, gradedAt }
 *  - Payment:          { studentId, feeStructureId, amountPaid, paymentDate, method }
 *  - Student:          { _id, name, studentId, classId }
 *  - Class:            { _id, name }
 *  - FeeStructure:     { _id, classId, amount, dueDate }
 */

const mongoose = require("mongoose");
const {
  AttendanceRecord,
  Grade,
  Payment,
  Student,
  Class,
  FeeStructure,
} = require("../models");

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
  // GET /reports/attendance?classId=&startDate=&endDate=
  // GET /reports/attendance?classId=&startDate=&endDate=&format=csv|pdf
  downloadAttendanceReport: async (req, res) => {
    try {
      const { classId, startDate, endDate } = req.query;
      const format = (req.query.format || "csv").toLowerCase();
      if (!["csv", "pdf"].includes(format)) {
        return res.status(400).json({
          success: false,
          message: "Invalid format; use ?format=csv or ?format=pdf.",
        });
      }
      if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Valid classId is required." });
      }

      // --- existing filter and fetch logic unchanged ---
      const filter = { classId: mongoose.Types.ObjectId(classId) };
      if (startDate)
        filter.date = { ...filter.date, $gte: new Date(startDate) };
      if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };
      const records = await AttendanceRecord.find(filter).lean();
      if (records.length === 0) {
        return res
          .status(200)
          .send("No attendance records found for the given criteria.");
      }

      // lookup class and students, build `rows` & `headers` exactly as before…
      const classDoc = await Class.findById(classId).select("name");
      const className = classDoc ? classDoc.name : "";
      const studentIdSet = new Set();
      records.forEach((rec) =>
        rec.entries.forEach((e) => {
          if (mongoose.Types.ObjectId.isValid(e.studentId))
            studentIdSet.add(String(e.studentId));
        })
      );
      const studentIds = Array.from(studentIdSet).map((id) =>
        mongoose.Types.ObjectId(id)
      );
      const students = await Student.find({ _id: { $in: studentIds } })
        .select("name studentId")
        .lean();
      const studentMap = {};
      students.forEach((s) => {
        studentMap[String(s._id)] = { name: s.name, studentId: s.studentId };
      });

      const headers = ["Class", "Date", "StudentID", "StudentName", "Status"];
      const rows = [];
      records.forEach((rec) => {
        const dateStr = rec.date.toISOString().split("T")[0];
        rec.entries.forEach((e) => {
          const sid = String(e.studentId);
          const stu = studentMap[sid] || { name: "", studentId: "" };
          rows.push({
            Class: className,
            Date: dateStr,
            StudentID: stu.studentId,
            StudentName: stu.name,
            Status: e.status,
          });
        });
      });

      if (format === "csv") {
        const csv = arrayToCsv(rows, headers);
        const filename = `attendance_report_${className || classId}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        return res.status(200).send(csv);
      }

      // PDF stub – integrate your PDF library here
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="attendance_report_${className || classId}.pdf"`
      );
      return res.status(200).send(Buffer.from("", "binary"));
    } catch (err) {
      console.error("reportController.downloadAttendanceReport error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /reports/grades?classId=&examType=&subject=
  // GET /reports/grades?classId=&examType=&subject=&format=csv|pdf
  downloadGradesReport: async (req, res) => {
    try {
      const { classId, examType, subject } = req.query;
      const format = (req.query.format || "csv").toLowerCase();
      if (!["csv", "pdf"].includes(format)) {
        return res.status(400).json({
          success: false,
          message: "Invalid format; use ?format=csv or ?format=pdf.",
        });
      }
      if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Valid classId is required." });
      }
      if (!examType || !subject) {
        return res.status(400).json({
          success: false,
          message: "examType and subject are required.",
        });
      }

      // --- existing student lookup & grade fetch unchanged ---
      const students = await Student.find({
        classId: mongoose.Types.ObjectId(classId),
      })
        .select("_id name studentId")
        .lean();
      if (students.length === 0) {
        return res.status(200).send("No students found for this class.");
      }
      const studentMap = {};
      const studentIds = students.map((s) => {
        studentMap[String(s._id)] = { name: s.name, studentId: s.studentId };
        return mongoose.Types.ObjectId(s._id);
      });
      const grades = await Grade.find({
        studentId: { $in: studentIds },
        subject,
        examType,
      }).lean();
      if (grades.length === 0) {
        return res
          .status(200)
          .send("No grade records found for the given criteria.");
      }
      const classDoc = await Class.findById(classId).select("name");
      const className = classDoc ? classDoc.name : "";

      const headers = [
        "Class",
        "StudentID",
        "StudentName",
        "Subject",
        "ExamType",
        "MarksObtained",
        "MaxMarks",
        "GradedAt",
      ];
      const rows = grades.map((g) => ({
        Class: className,
        StudentID: studentMap[String(g.studentId)].studentId,
        StudentName: studentMap[String(g.studentId)].name,
        Subject: g.subject,
        ExamType: g.examType,
        MarksObtained: g.marksObtained,
        MaxMarks: g.maxMarks,
        GradedAt: g.gradedAt.toISOString().split("T")[0],
      }));

      if (format === "csv") {
        const csv = arrayToCsv(rows, headers);
        const filename = `grades_report_${className || classId}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        return res.status(200).send(csv);
      }

      // PDF stub
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="grades_report_${className || classId}.pdf"`
      );
      return res.status(200).send(Buffer.from("", "binary"));
    } catch (err) {
      console.error("reportController.downloadGradesReport error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /reports/fee-collection?classId=&startDate=&endDate=
  // GET /reports/fee-collection?classId=&startDate=&endDate=&format=csv|pdf
  downloadFeeCollectionReport: async (req, res) => {
    try {
      const { classId, startDate, endDate } = req.query;
      const format = (req.query.format || "csv").toLowerCase();
      if (!["csv", "pdf"].includes(format)) {
        return res.status(400).json({
          success: false,
          message: "Invalid format; use ?format=csv or ?format=pdf.",
        });
      }
      if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Valid classId is required." });
      }

      // --- existing payment lookup unchanged ---
      const students = await Student.find({
        classId: mongoose.Types.ObjectId(classId),
      })
        .select("_id name studentId")
        .lean();
      if (students.length === 0) {
        return res.status(200).send("No students found for this class.");
      }
      const studentMap = {};
      const studentIds = students.map((s) => {
        studentMap[String(s._id)] = { name: s.name, studentId: s.studentId };
        return mongoose.Types.ObjectId(s._id);
      });

      const payFilter = { studentId: { $in: studentIds } };
      if (startDate)
        payFilter.paymentDate = {
          ...payFilter.paymentDate,
          $gte: new Date(startDate),
        };
      if (endDate)
        payFilter.paymentDate = {
          ...payFilter.paymentDate,
          $lte: new Date(endDate),
        };
      const payments = await Payment.find(payFilter).lean();
      if (payments.length === 0) {
        return res
          .status(200)
          .send("No payment records found for the given criteria.");
      }

      const feeStructureIds = Array.from(
        new Set(payments.map((p) => String(p.feeStructureId)))
      );
      const feeStructures = await FeeStructure.find({
        _id: { $in: feeStructureIds },
      })
        .select("classId amount dueDate")
        .lean();
      const feeMap = {};
      feeStructures.forEach((fs) => {
        feeMap[String(fs._id)] = {
          amount: fs.amount,
          dueDate: fs.dueDate.toISOString().split("T")[0],
        };
      });

      const classDoc = await Class.findById(classId).select("name");
      const className = classDoc ? classDoc.name : "";

      const headers = [
        "Class",
        "StudentID",
        "StudentName",
        "FeeAmount",
        "DueDate",
        "AmountPaid",
        "PaymentDate",
        "Method",
        "TransactionID",
        "ReceiptURL",
      ];
      const rows = payments.map((p) => {
        const stu = studentMap[String(p.studentId)] || {
          name: "",
          studentId: "",
        };
        const fs = feeMap[String(p.feeStructureId)] || {
          amount: "",
          dueDate: "",
        };
        const paidDate = p.paymentDate
          ? p.paymentDate.toISOString().split("T")[0]
          : "";
        return {
          Class: className,
          StudentID: stu.studentId,
          StudentName: stu.name,
          FeeAmount: fs.amount,
          DueDate: fs.dueDate,
          AmountPaid: p.amountPaid,
          PaymentDate: paidDate,
          Method: p.method,
          TransactionID: p.transactionId || "",
          ReceiptURL: p.receiptUrl || "",
        };
      });

      if (format === "csv") {
        const csv = arrayToCsv(rows, headers);
        const filename = `fee_collection_report_${className || classId}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        return res.status(200).send(csv);
      }

      // PDF stub
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="fee_collection_report_${
          className || classId
        }.pdf"`
      );
      return res.status(200).send(Buffer.from("", "binary"));
    } catch (err) {
      console.error("reportController.downloadFeeCollectionReport error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
