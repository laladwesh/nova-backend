// controllers/formController.js

/**
 * Form Controller
 *  - listFormTypes:        Return all available form types
 *  - submitForm:           Student submits a new form
 *  - listStudentForms:     Return all forms submitted by a given student
 *  - getFormById:          Return a single form by its ID
 *  - updateFormStatus:     Update status (approve/reject) of a form, with optional reviewComment
 *
 * Assumptions:
 *  - authMiddleware populates req.user = { userId, role }
 *  - Only students submit forms; only teachers/admins update status
 *  - Form model fields:
 *      { studentId, type, data, status, submittedAt, reviewedBy, reviewComment }
 */

const mongoose = require("mongoose");
const { Form, Student, Teacher } = require("../models");

// The allowed form types
const FORM_TYPES = [
  "leave_request",
  "event_participation",
  "feedback",
  "other",
];

module.exports = {
  // GET /forms/types
  listFormTypes: async (req, res) => {
    try {
      return res.status(200).json({
        success: true,
        data: FORM_TYPES,
      });
    } catch (err) {
      console.error("formController.listFormTypes error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /forms
  // Body: { studentId, type, data }
  submitForm: async (req, res) => {
    try {
      const { studentId, type, data } = req.body;

      if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Valid studentId is required." });
      }
      if (!type || !FORM_TYPES.includes(type)) {
        return res
          .status(400)
          .json({
            success: false,
            message: `type is required and must be one of: ${FORM_TYPES.join(
              ", "
            )}`,
          });
      }
      if (data === undefined || typeof data !== "object") {
        return res
          .status(400)
          .json({ success: false, message: "data (object) is required." });
      }

      // Verify student exists and get their schoolId
      const student = await Student.findById(studentId);
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      const newForm = await Form.create({
        studentId,
        schoolId: student.schoolId, // Add the schoolId from the student
        type,
        data,
        status: "pending",
        submittedAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: "Form submitted successfully.",
        data: newForm,
      });
    } catch (err) {
      console.error("formController.submitForm error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /forms/student/:studentId
  listStudentForms: async (req, res) => {
    try {
      const { studentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }

      // Verify student exists
      const studentExists = await Student.exists({ _id: studentId });
      if (!studentExists) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      const forms = await Form.find({ studentId })
        .sort({ submittedAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        data: forms,
      });
    } catch (err) {
      console.error("formController.listStudentForms error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /forms/:formId
  getFormById: async (req, res) => {
    try {
      const { formId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(formId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid formId." });
      }

      const form = await Form.findById(formId).lean();
      if (!form) {
        return res
          .status(404)
          .json({ success: false, message: "Form not found." });
      }

      return res.status(200).json({
        success: true,
        data: form,
      });
    } catch (err) {
      console.error("formController.getFormById error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /forms/:formId/status
  // Body: { status, reviewComment } where status ∈ ['approved','rejected']
  updateFormStatus: async (req, res) => {
    try {
      const { formId } = req.params;
      const { status, reviewComment } = req.body;

      if (!mongoose.Types.ObjectId.isValid(formId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid formId." });
      }
      if (!status || !["approved", "rejected"].includes(status)) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              'status is required and must be either "approved" or "rejected".',
          });
      }
      if (reviewComment !== undefined && typeof reviewComment !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "reviewComment must be a string." });
      }

      // Verify a teacher or school_admin is updating
      const updaterRole = req.user.role;
      if (!["teacher", "school_admin"].includes(updaterRole)) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Only teachers or admins can update form status.",
          });
      }

      // Verify form exists
      const form = await Form.findById(formId);
      if (!form) {
        return res
          .status(404)
          .json({ success: false, message: "Form not found." });
      }

      form.status = status;
      form.reviewedBy = req.user.userId;
      if (reviewComment !== undefined) {
        form.reviewComment = reviewComment;
      }
      await form.save();

      return res.status(200).json({
        success: true,
        message: "Form status updated successfully.",
        data: form,
      });
    } catch (err) {
      console.error("formController.updateFormStatus error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
  getFormsBySchool: async (req, res) => {
    try {
      const { schoolId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(schoolId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid schoolId." });
      }
      const forms = await Form.find({ schoolId }).lean();
      return res.status(200).json({ success: true, data: forms });
    } catch (err) {
      console.error("formController.getFormsBySchool error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
