// controllers/teacherController.js

/**
 * Teacher Controller
 *  - listTeachers:     Return all teachers (with optional pagination)
 *  - createTeacher:    Create a new teacher profile
 *  - getTeacherById:   Return a single teacher by ID (with populated classes)
 *  - updateTeacher:    Update fields of a teacher
 *  - deleteTeacher:    Delete (or deactivate) a teacher
 *  - assignRole:       Add or replace a role for a teacher (e.g. "ClassTeacher")
 *  - getPerformance:   Return basic performance metrics for a teacher
 *
 * Assumptions:
 *  - authMiddleware ensures req.user contains { userId, role }
 *  - Only "school_admin" or privileged roles can create/update/delete teachers
 *  - Teacher model has fields: teacherId, name, email, phone, dateJoined, salaryPaid,
 *      roles (array of String), teachingSubs (array of String), classes (array of ObjectId)
 *  - Class model can be used to calculate performance metrics (e.g., via Class.analytics)
 */

const { Teacher, Class } = require("../models");
const mongoose = require("mongoose");

module.exports = {
  // GET /teachers
  listTeachers: async (req, res) => {
    try {
      const teachers = await Teacher.find()
        .populate({
          path: "classes",
          select: "name grade section year", // Explicitly populate classes
        })
        .populate({
          path: "schoolId",
          select: "name address", // Explicitly populate schoolId
        })
        .select("-__v"); // Exclude __v field

      // Fallback check for populated fields
      if (!teachers || teachers.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No teachers found or population failed.",
        });
      }

      return res.status(200).json({
        success: true,
        data: teachers,
      });
    } catch (err) {
      console.error("teacherController.listTeachers error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /teachers
  createTeacher: async (req, res) => {
    try {
      const {
        teacherId,
        name,
        email,
        phone,
        dateJoined,
        salaryPaid = false,
        roles = [],
        teachingSubs = [],
        classes = [],
        schoolId, // School ID is required
      } = req.body;

      // Validate required fields
      if (!teacherId || !name || !email || !schoolId) {
        return res.status(400).json({
          success: false,
          message: "teacherId, name, email, and schoolId are required.",
        });
      }
      
      // Check for unique teacherId and email
      const existing = await Teacher.findOne({
        $or: [{ teacherId }, { email: email.toLowerCase() }],
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "A teacher with that ID or email already exists.",
        });
      }

      // If classes array provided, ensure they are valid ObjectId strings
      if (classes.length > 0) {
        const validClassCount = await Class.countDocuments({
          _id: { $in: classes.map((id) => new mongoose.Types.ObjectId(id)) },
        });
        if (validClassCount !== classes.length) {
          return res.status(400).json({
            success: false,
            message: "One or more class IDs are invalid.",
          });
        }
      }

      // Create teacher document with explicit schoolId
      const teacher = new Teacher({
        teacherId,
        name,
        email: email.toLowerCase(),
        phone,
        dateJoined: dateJoined ? new Date(dateJoined) : Date.now(),
        salaryPaid,
        roles,
        teachingSubs,
        classes,
        schoolId, // Add schoolId directly to the document
      });

      await teacher.save();
      
      // Return the complete teacher object including schoolId
      return res.status(201).json({
        success: true,
        message: "Teacher created successfully.",
        data: teacher,
      });
    } catch (err) {
      console.error("teacherController.createTeacher error:", err);
      console.error("Error stack:", err.stack);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error.", error: err.message });
    }
  },

  // GET /teachers/:teacherId
  getTeacherById: async (req, res) => {
    try {
      const { teacherId } = req.params;

      const teacher = await Teacher.findOne({ _id: teacherId })
        .populate("classes", "name grade section year").populate("schoolId", "name")
        .select("-__v");

      if (!teacher) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found." });
      }

      return res.status(200).json({
        success: true,
        data: teacher,
      });
    } catch (err) {
      console.error("teacherController.getTeacherById error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /teachers/:teacherId
  updateTeacher: async (req, res) => {
    try {
      const { teacherId } = req.params;
      const {
        name,
        email,
        phone,
        dateJoined,
        salaryPaid,
        roles,
        teachingSubs,
        classes,
        schoolId,
      } = req.body;

      const updates = {};
      if (name) updates.name = name;
      if (phone) updates.phone = phone;
      if (salaryPaid !== undefined) updates.salaryPaid = salaryPaid;
      if (teachingSubs) updates.teachingSubs = teachingSubs;
      if (roles) updates.roles = roles;
      if (dateJoined) updates.dateJoined = new Date(dateJoined);
      // Add schoolId to updates if provided
      if (schoolId) updates.schoolId = new mongoose.Types.ObjectId(schoolId);

      // If email is being updated, check uniqueness
      if (email) {
        const existing = await Teacher.findOne({
          email: email.toLowerCase(),
          _id: { $ne: teacherId },
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: "Email already in use by another teacher.",
          });
        }
        updates.email = email.toLowerCase();
      }

      // If classes provided, validate them
      if (Array.isArray(classes)) {
        const validClassCount = await Class.countDocuments({
          _id: { $in: classes.map((id) => mongoose.Types.ObjectId(id)) },
        });
        if (validClassCount !== classes.length) {
          return res.status(400).json({
            success: false,
            message: "One or more class IDs are invalid.",
          });
        }
        updates.classes = classes;
      }

      const updatedTeacher = await Teacher.findByIdAndUpdate(
        teacherId,
        { $set: updates },
        { new: true, runValidators: true, context: "query" }
      )
        .populate("classes", "name grade section year")
        .select("-__v");

      if (!updatedTeacher) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Teacher updated successfully.",
        data: updatedTeacher,
      });
    } catch (err) {
      console.error("teacherController.updateTeacher error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // DELETE /teachers/:teacherId
  deleteTeacher: async (req, res) => {
    try {
      const { teacherId } = req.params;

      const deleted = await Teacher.findByIdAndDelete(teacherId);

      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Teacher deleted successfully.",
      });
    } catch (err) {
      console.error("teacherController.deleteTeacher error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /teachers/:teacherId/assign-role
  assignRole: async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { role } = req.body;

      if (!role) {
        return res
          .status(400)
          .json({ success: false, message: "Role is required." });
      }

      // Check if role already exists in teacher.roles
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found." });
      }

      if (teacher.roles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Teacher already has that role.",
        });
      }

      teacher.roles.push(role);
      await teacher.save();

      return res.status(200).json({
        success: true,
        message: `Role "${role}" assigned to teacher.`,
        data: teacher.roles,
      });
    } catch (err) {
      console.error("teacherController.assignRole error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /teachers/:teacherId/performance
  getPerformance: async (req, res) => {
    try {
      const { teacherId } = req.params;

      // Ensure teacher exists
      const teacher = await Teacher.findById(teacherId).populate(
        "classes",
        "analytics"
      );
      if (!teacher) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found." });
      }

      // Aggregate performance from each class
      let totalClasses = teacher.classes.length;
      let combinedAttendancePct = 0;
      let combinedAvgGrade = 0;
      let combinedPassPct = 0;

      teacher.classes.forEach((cls) => {
        if (cls.analytics) {
          combinedAttendancePct += cls.analytics.attendancePct || 0;
          combinedAvgGrade += cls.analytics.avgGrade || 0;
          combinedPassPct += cls.analytics.passPct || 0;
        }
      });

      // Compute averages (if classes exist)
      const classCount = totalClasses || 1; // avoid divide by zero
      const avgAttendance = Math.round(combinedAttendancePct / classCount);
      const avgGrade = Math.round(combinedAvgGrade / classCount);
      const avgPassPct = Math.round(combinedPassPct / classCount);

      const performanceData = {
        totalClasses,
        avgAttendancePct: avgAttendance,
        avgClassGrade: avgGrade,
        avgPassPct,
      };

      return res.status(200).json({
        success: true,
        data: performanceData,
      });
    } catch (err) {
      console.error("teacherController.getPerformance error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
