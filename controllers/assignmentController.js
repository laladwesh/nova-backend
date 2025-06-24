// controllers/assignmentController.js

/**
 * Assignment Controller
 *  - listAssignments:      Return all assignments (optionally filtered by classId or teacherId)
 *  - createAssignment:     Create a new assignment
 *  - getAssignmentById:    Return a single assignment by ID (with populated fields)
 *  - updateAssignment:     Update fields of an assignment
 *  - deleteAssignment:     Delete an assignment
 *  - listSubmissions:      Return all submissions for a given assignment (with student info)
 *  - provideFeedback:      Update a submission with grade and feedback
 *
 * Assumptions:
 *  - authMiddleware populates req.user = { userId, role }
 *  - Only teachers (or admins) can create/update/delete assignments
 *  - Assignment model fields: teacherId, classId, subject, title, description, assignedAt, dueDate
 *  - Submission model fields: assignmentId, studentId, submissionText, attachmentUrl, submittedAt, grade, feedback, feedbackAt
 */

const mongoose = require("mongoose");
const {
  Assignment,
  Submission,
  Student,
  Teacher,
  Class,
} = require("../models");

module.exports = {
  // GET /assignments?classId=&teacherId=&page=&limit=
  listAssignments: async (req, res) => {
    try {
      const { classId, teacherId, page = 1, limit = 20 } = req.query;
      const filter = {};
      if (classId) {
        if (!mongoose.Types.ObjectId.isValid(classId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid classId." });
        }
        filter.classId = classId;
      }
      if (teacherId) {
        if (!mongoose.Types.ObjectId.isValid(teacherId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid teacherId." });
        }
        filter.teacherId = teacherId;
      }

      const assignments = await Assignment.find(filter)
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .sort({ assignedAt: -1 })
        .populate("teacherId", "name teacherId")
        .populate("classId", "name grade section year")
        .lean();

      const total = await Assignment.countDocuments(filter);

      return res.status(200).json({
        success: true,
        data: assignments,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
        },
      });
    } catch (err) {
      console.error("assignmentController.listAssignments error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /assignments
  createAssignment: async (req, res) => {
    try {
      const { teacherId, classId, schoolId, subject, title, description, dueDate } =
        req.body;
      if (!teacherId || !classId || !schoolId || !subject || !title || !dueDate) {
        return res.status(400).json({
          success: false,
          message:
            "teacherId, classId, schoolId, subject, title, and dueDate are required.",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid teacherId." });
      }
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid classId." });
      }
      if (!mongoose.Types.ObjectId.isValid(schoolId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid schoolId." });
      }

      // Validate teacher
      const teacherExists = await Teacher.exists({ _id: teacherId });
      if (!teacherExists) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found." });
      }

      // Validate class
      const classExists = await Class.exists({ _id: classId });
      if (!classExists) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      const newAssignment = await Assignment.create({
        teacherId,
        classId,
        schoolId,
        subject,
        title,
        description: description || "",
        assignedAt: new Date(),
        dueDate: new Date(dueDate),
      });

      const populated = await Assignment.findById(newAssignment._id)
        .populate("teacherId", "name teacherId")
        .populate("classId", "name grade section year");

      return res.status(201).json({
        success: true,
        message: "Assignment created successfully.",
        data: populated,
      });
    } catch (err) {
      console.error("assignmentController.createAssignment error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /assignments/:assignmentId
  getAssignmentById: async (req, res) => {
    try {
      const { assignmentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid assignmentId." });
      }

      const assignment = await Assignment.findById(assignmentId)
        .populate("teacherId", "name teacherId")
        .populate("classId", "name grade section year")
        .lean();

      if (!assignment) {
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found." });
      }

      return res.status(200).json({ success: true, data: assignment });
    } catch (err) {
      console.error("assignmentController.getAssignmentById error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /assignments/:assignmentId
  updateAssignment: async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { subject, title, description, dueDate } = req.body;

      if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid assignmentId." });
      }

      const updates = {};
      if (subject) updates.subject = subject;
      if (title) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (dueDate) updates.dueDate = new Date(dueDate);

      const updated = await Assignment.findByIdAndUpdate(
        assignmentId,
        { $set: updates },
        { new: true, runValidators: true, context: "query" }
      )
        .populate("teacherId", "name teacherId")
        .populate("classId", "name grade section year")
        .lean();

      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Assignment updated successfully.",
        data: updated,
      });
    } catch (err) {
      console.error("assignmentController.updateAssignment error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // DELETE /assignments/:assignmentId
  deleteAssignment: async (req, res) => {
    try {
      const { assignmentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid assignmentId." });
      }

      const deleted = await Assignment.findByIdAndDelete(assignmentId);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found." });
      }

      // Optionally, delete all submissions for this assignment:
      await Submission.deleteMany({ assignmentId });

      return res.status(200).json({
        success: true,
        message: "Assignment and its submissions deleted successfully.",
      });
    } catch (err) {
      console.error("assignmentController.deleteAssignment error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /assignments/:assignmentId/submissions
  listSubmissions: async (req, res) => {
    try {
      const { assignmentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid assignmentId." });
      }

      // Verify assignment exists
      const exists = await Assignment.exists({ _id: assignmentId });
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found." });
      }

      const submissions = await Submission.find({ assignmentId })
        .sort({ submittedAt: -1 })
        .populate("studentId", "name studentId")
        .lean();

      return res.status(200).json({
        success: true,
        data: submissions,
      });
    } catch (err) {
      console.error("assignmentController.listSubmissions error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /assignments/:assignmentId/submissions/:submissionId/feedback
  provideFeedback: async (req, res) => {
    try {
      const { assignmentId, submissionId } = req.params;
      const { grade, feedback } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(assignmentId) ||
        !mongoose.Types.ObjectId.isValid(submissionId)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid assignmentId or submissionId.",
          });
      }
      if (grade === undefined && feedback === undefined) {
        return res
          .status(400)
          .json({
            success: false,
            message: "At least one of grade or feedback is required.",
          });
      }

      // Verify assignment exists
      const assignmentExists = await Assignment.exists({ _id: assignmentId });
      if (!assignmentExists) {
        return res
          .status(404)
          .json({ success: false, message: "Assignment not found." });
      }

      const submission = await Submission.findOne({
        _id: submissionId,
        assignmentId,
      });
      if (!submission) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Submission not found for this assignment.",
          });
      }

      const updates = { feedbackAt: new Date() };
      if (grade !== undefined) updates.grade = grade;
      if (feedback !== undefined) updates.feedback = feedback;

      const updatedSubmission = await Submission.findByIdAndUpdate(
        submissionId,
        { $set: updates },
        { new: true, runValidators: true, context: "query" }
      )
        .populate("studentId", "name studentId")
        .lean();

      return res.status(200).json({
        success: true,
        message: "Feedback provided successfully.",
        data: updatedSubmission,
      });
    } catch (err) {
      console.error("assignmentController.provideFeedback error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
  getAssignmentsByClass: async (req, res) => {
    try {
      const { classId } = req.params;
      // 1) Validate classId
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid classId." });
      }
      // 2) Fetch all assignments for that class
      const assignments = await Assignment.find({ classId }).lean();
      return res.status(200).json({ success: true, data: assignments });
    } catch (err) {
      console.error("assignmentController.getAssignmentsByClass error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
};
