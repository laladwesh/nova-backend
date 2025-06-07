// controllers/studentController.js

/**
 * Student Controller
 *  - listStudents:   Return all students (with optional pagination/filter by class)
 *  - createStudent:  Create a new student profile
 *  - getStudentById: Return a single student by ID (with populated class and parents)
 *  - updateStudent:  Update fields of a student
 *  - deleteStudent:  Delete (or deactivate) a student
 *  - getProgress:    Return the academicReport for a student
 *
 * Assumptions:
 *  - authMiddleware ensures req.user contains { userId, role }
 *  - Only certain roles (e.g., school_admin or teacher) can create/update/delete
 *  - Student model fields: studentId, name, classId, dob, gender, address, phone, email, feePaid, parents, academicReport
 *  - Class model used to validate classId
 */

const { Student, Class } = require("../models");
const mongoose = require("mongoose");

module.exports = {
  // GET /students
  listStudents: async (req, res) => {
    try {
      const { classId, page = 1, limit = 20 } = req.query;
      const filter = {};
      if (classId) {
        if (!mongoose.Types.ObjectId.isValid(classId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid classId." });
        }
        filter.classId = classId;
      }

      const students = await Student.find(filter)
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .populate("classId", "name grade section year")
        .select("-__v");

      const total = await Student.countDocuments(filter);

      return res.status(200).json({
        success: true,
        data: students,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
        },
      });
    } catch (err) {
      console.error("studentController.listStudents error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /students
  createStudent: async (req, res) => {
    try {
      const {
        studentId,
        name,
        classId,
        dob,
        gender,
        address,
        phone,
        email,
        feePaid = false,
        parents = [],
      } = req.body;

      // Validate required fields
      if (!studentId || !name || !classId) {
        return res.status(400).json({
          success: false,
          message: "studentId, name, and classId are required.",
        });
      }

      // Check for unique studentId and email
      const existing = await Student.findOne({
        $or: [{ studentId }, { email: email?.toLowerCase() }],
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "A student with that ID or email already exists.",
        });
      }

      // Validate classId
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid classId." });
      }
      const classExists = await Class.exists({ _id: classId });
      if (!classExists) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      // Create student document
      const student = await Student.create({
        studentId,
        name,
        classId,
        dob: dob ? new Date(dob) : undefined,
        gender,
        address,
        phone,
        email: email?.toLowerCase(),
        feePaid,
        parents,
      });

      // Populate class field before returning
      const populatedStudent = await Student.findById(student._id)
        .populate("classId", "name grade section year")
        .select("-__v");

      return res.status(201).json({
        success: true,
        message: "Student created successfully.",
        data: populatedStudent,
      });
    } catch (err) {
      console.error("studentController.createStudent error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /students/:studentId
  getStudentById: async (req, res) => {
    try {
      const { studentId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }

      const student = await Student.findById(studentId)
        .populate("classId", "name grade section year")
        .select("-__v");

      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      return res.status(200).json({
        success: true,
        data: student,
      });
    } catch (err) {
      console.error("studentController.getStudentById error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /students/:studentId
  updateStudent: async (req, res) => {
    try {
      const { studentId } = req.params;
      const {
        name,
        classId,
        dob,
        gender,
        address,
        phone,
        email,
        feePaid,
        parents,
      } = req.body;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }

      const updates = {};
      if (name) updates.name = name;
      if (dob) updates.dob = new Date(dob);
      if (gender) updates.gender = gender;
      if (address) updates.address = address;
      if (phone) updates.phone = phone;
      if (feePaid !== undefined) updates.feePaid = feePaid;
      if (Array.isArray(parents)) updates.parents = parents;

      // If email is provided, check uniqueness
      if (email) {
        const existing = await Student.findOne({
          email: email.toLowerCase(),
          _id: { $ne: studentId },
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: "Email already in use by another student.",
          });
        }
        updates.email = email.toLowerCase();
      }

      // If classId is provided, validate it
      if (classId) {
        if (!mongoose.Types.ObjectId.isValid(classId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid classId." });
        }
        const classExists = await Class.exists({ _id: classId });
        if (!classExists) {
          return res
            .status(404)
            .json({ success: false, message: "Class not found." });
        }
        updates.classId = classId;
      }

      const updatedStudent = await Student.findByIdAndUpdate(
        studentId,
        { $set: updates },
        { new: true, runValidators: true, context: "query" }
      )
        .populate("classId", "name grade section year")
        .select("-__v");

      if (!updatedStudent) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Student updated successfully.",
        data: updatedStudent,
      });
    } catch (err) {
      console.error("studentController.updateStudent error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // DELETE /students/:studentId
  deleteStudent: async (req, res) => {
    try {
      const { studentId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }

      const deleted = await Student.findByIdAndDelete(studentId);

      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Student deleted successfully.",
      });
    } catch (err) {
      console.error("studentController.deleteStudent error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /students/:studentId/progress
  getProgress: async (req, res) => {
    try {
      const { studentId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }

      const student = await Student.findById(studentId).select(
        "academicReport"
      );
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      return res.status(200).json({
        success: true,
        data: {
          studentId: student._id,
          progress: student.academicReport,
        },
      });
    } catch (err) {
      console.error("studentController.getProgress error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
