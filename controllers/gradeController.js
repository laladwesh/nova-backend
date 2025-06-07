// controllers/gradeController.js

/**
 * Grade Controller
 *  - createGrade:             Record a new grade for a student
 *  - getGradeById:            Return a single grade entry by ID
 *  - updateGrade:             Update fields of an existing grade
 *  - deleteGrade:             Delete a grade entry
 *  - getGradesBySubjectClass: Fetch all grades for a given subject for students in a class
 *
 * Assumptions:
 *  - authMiddleware populates req.user = { userId, role }
 *  - Only teachers (or admins) can create/update/delete grades
 *  - Grade model fields:
 *      { studentId, subject, examType, marksObtained, maxMarks, comments, teacherId, gradedAt }
 *  - Subject is stored as a string (e.g. "Math"); route param subjectId corresponds to that string
 *  - To fetch by class, we look up Student documents with the given classId
 */

const mongoose = require("mongoose");
const { Grade, Student } = require("../models");

module.exports = {
  // POST /grades
  createGrade: async (req, res) => {
    try {
      const {
        studentId,
        subject,
        examType,
        marksObtained,
        maxMarks,
        comments,
      } = req.body;

      // Validate required fields
      if (
        !studentId ||
        !subject ||
        !examType ||
        marksObtained === undefined ||
        maxMarks === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "studentId, subject, examType, marksObtained, and maxMarks are required.",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }
      if (typeof subject !== "string" || subject.trim() === "") {
        return res
          .status(400)
          .json({
            success: false,
            message: "subject must be a non-empty string.",
          });
      }
      if (typeof examType !== "string" || examType.trim() === "") {
        return res
          .status(400)
          .json({
            success: false,
            message: "examType must be a non-empty string.",
          });
      }
      if (typeof marksObtained !== "number" || typeof maxMarks !== "number") {
        return res
          .status(400)
          .json({
            success: false,
            message: "marksObtained and maxMarks must be numbers.",
          });
      }

      // Verify student exists
      const studentExists = await Student.exists({ _id: studentId });
      if (!studentExists) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      // Create grade entry
      const newGrade = await Grade.create({
        studentId,
        subject: subject.trim(),
        examType: examType.trim(),
        marksObtained,
        maxMarks,
        comments: comments || "",
        teacherId: req.user.userId,
        gradedAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: "Grade recorded successfully.",
        data: newGrade,
      });
    } catch (err) {
      console.error("gradeController.createGrade error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /grades/:gradeId
  getGradeById: async (req, res) => {
    try {
      const { gradeId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(gradeId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid gradeId." });
      }

      const grade = await Grade.findById(gradeId).lean();
      if (!grade) {
        return res
          .status(404)
          .json({ success: false, message: "Grade not found." });
      }

      return res.status(200).json({ success: true, data: grade });
    } catch (err) {
      console.error("gradeController.getGradeById error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /grades/:gradeId
  updateGrade: async (req, res) => {
    try {
      const { gradeId } = req.params;
      const { subject, examType, marksObtained, maxMarks, comments } = req.body;

      if (!mongoose.Types.ObjectId.isValid(gradeId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid gradeId." });
      }

      // Build updates
      const updates = {};
      if (subject !== undefined) {
        if (typeof subject !== "string" || subject.trim() === "") {
          return res
            .status(400)
            .json({
              success: false,
              message: "subject must be a non-empty string.",
            });
        }
        updates.subject = subject.trim();
      }
      if (examType !== undefined) {
        if (typeof examType !== "string" || examType.trim() === "") {
          return res
            .status(400)
            .json({
              success: false,
              message: "examType must be a non-empty string.",
            });
        }
        updates.examType = examType.trim();
      }
      if (marksObtained !== undefined) {
        if (typeof marksObtained !== "number") {
          return res
            .status(400)
            .json({
              success: false,
              message: "marksObtained must be a number.",
            });
        }
        updates.marksObtained = marksObtained;
      }
      if (maxMarks !== undefined) {
        if (typeof maxMarks !== "number") {
          return res
            .status(400)
            .json({ success: false, message: "maxMarks must be a number." });
        }
        updates.maxMarks = maxMarks;
      }
      if (comments !== undefined) {
        updates.comments = comments;
      }

      if (Object.keys(updates).length === 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: "At least one field is required to update.",
          });
      }

      const updatedGrade = await Grade.findByIdAndUpdate(
        gradeId,
        { $set: updates },
        { new: true, runValidators: true, context: "query" }
      ).lean();

      if (!updatedGrade) {
        return res
          .status(404)
          .json({ success: false, message: "Grade not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Grade updated successfully.",
        data: updatedGrade,
      });
    } catch (err) {
      console.error("gradeController.updateGrade error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // DELETE /grades/:gradeId
  deleteGrade: async (req, res) => {
    try {
      const { gradeId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(gradeId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid gradeId." });
      }

      const deleted = await Grade.findByIdAndDelete(gradeId);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Grade not found." });
      }

      return res
        .status(200)
        .json({ success: true, message: "Grade deleted successfully." });
    } catch (err) {
      console.error("gradeController.deleteGrade error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /grades/subject/:subjectId/class/:classId
  getGradesBySubjectClass: async (req, res) => {
    try {
      const { subjectId, classId } = req.params;

      if (typeof subjectId !== "string" || subjectId.trim() === "") {
        return res
          .status(400)
          .json({
            success: false,
            message: "Valid subjectId (string) is required.",
          });
      }
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid classId." });
      }

      // Find all students in the class
      const students = await Student.find({
        classId: mongoose.Types.ObjectId(classId),
      })
        .select("_id name studentId")
        .lean();
      if (students.length === 0) {
        return res
          .status(200)
          .json({
            success: true,
            data: [],
            message: "No students found in this class.",
          });
      }

      const studentMap = {};
      const studentIds = students.map((stu) => {
        studentMap[String(stu._id)] = {
          name: stu.name,
          studentId: stu.studentId,
        };
        return mongoose.Types.ObjectId(stu._id);
      });

      // Fetch grades where subject matches (case-sensitive) and studentId in list
      const grades = await Grade.find({
        subject: subjectId,
        studentId: { $in: studentIds },
      })
        .populate("teacherId", "name teacherId")
        .lean();

      // Format response rows with student info
      const data = grades.map((g) => ({
        _id: g._id,
        studentId: studentMap[String(g.studentId)].studentId,
        studentName: studentMap[String(g.studentId)].name,
        subject: g.subject,
        examType: g.examType,
        marksObtained: g.marksObtained,
        maxMarks: g.maxMarks,
        comments: g.comments,
        teacherId: g.teacherId ? g.teacherId._id : null,
        teacherName: g.teacherId ? g.teacherId.name : null,
        gradedAt: g.gradedAt,
      }));

      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("gradeController.getGradesBySubjectClass error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
