const mongoose = require("mongoose");
const { Grade } = require("../models");

module.exports = {
  // POST /grades
  // Admin only: upsert one doc per (school, class, subject)
  createOrUpdateGrades: async (req, res) => {
    try {
      const { schoolId, classId, subjectId, teacherId, entries } = req.body;

      // 1) Validate payload
      if (
        !schoolId || !classId || !subjectId || !teacherId ||
        !Array.isArray(entries) || entries.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "schoolId, classId, subjectId, teacherId and non-empty entries[] are required.",
        });
      }
      // 2) Check IDs
      for (let id of [schoolId, classId, teacherId]) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: `Invalid ID ${id}` });
        }
      }
      // 3) Validate entries
      for (const e of entries) {
        if (
          !mongoose.Types.ObjectId.isValid(e.studentId) ||
          typeof e.percentage !== "number" ||
          e.percentage < 0 || e.percentage > 100
        ) {
          return res.status(400).json({
            success: false,
            message: "Each entry must have a valid studentId and percentage 0–100.",
          });
        }
      }

      // 4) Upsert the one “final” grade doc
      const gradeDoc = await Grade.findOneAndUpdate(
        { schoolId, classId, subjectId },
        { $set: { teacherId, entries } },
        { new: true, upsert: true, runValidators: true, context: "query" }
      );

      return res.status(200).json({
        success: true,
        message: "Grades saved successfully.",
        data: gradeDoc,
      });
    } catch (err) {
      console.error("gradeController.createOrUpdateGrades:", err);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  },

  // GET /grades?classId=&subjectId=
  // Any authenticated user may view
  listByClassSubject: async (req, res) => {
    try {
      const { classId, subjectId } = req.query;
      if (!classId || !subjectId) {
        return res.status(400).json({
          success: false,
          message: "classId and subjectId query params are required.",
        });
      }
      const doc = await Grade.findOne({ classId, subjectId })
        .populate("entries.studentId", "name studentId")
        .select("-__v");
      if (!doc) {
        return res.status(404).json({ success: false, message: "No grades found." });
      }
      return res.status(200).json({ success: true, data: doc });
    } catch (err) {
      console.error("gradeController.listByClassSubject:", err);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  },

  // GET /grades/student/:studentId
  // Any authenticated user may view
  listByStudent: async (req, res) => {
    try {
      const { studentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ success: false, message: "Invalid studentId." });
      }
      const docs = await Grade.find({ "entries.studentId": studentId })
        .populate("classId subjectId teacherId", "name grade section code teacherId")
        .select("classId subjectId teacherId entries");
      return res.status(200).json({ success: true, data: docs });
    } catch (err) {
      console.error("gradeController.listByStudent:", err);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  },
};
