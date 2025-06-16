/**
 * controllers/studentController.js
 *
 * Student Controller
 *  - listStudents:   Return all students (with optional pagination/filter by class)
 *  - createStudent:  Create a new student profile
 *  - getStudentById:  Return a single student by ID (with populated class and parents)
 *  - updateStudent:  Update fields of a student
 *  - deleteStudent:  Delete (or deactivate) a student
 *  - getProgress:    Return the academicReport for a student
 *  - getStudentByParentId: Return all students for a given parent
 *  - getParentNameByStudentId: Return parent IDs for a given student
 *
 * Assumptions:
 *  - authMiddleware ensures req.user contains { userId, role }
 *  - Only certain roles (e.g., school_admin or teacher) can create/update/delete
 *  - Student model fields: studentId, name, classId, dob, gender, address, phone, email, feePaid, parents, academicReport
 *  - Class model used to validate classId
 */

const { Student, Class } = require("../models"); // Import Mongoose models
const mongoose = require("mongoose");           // Import Mongoose for ObjectId validation

module.exports = {
  /**
   * GET /students
   * List all students, with optional filtering by classId and pagination.
   */
  listStudents: async (req, res) => {
    try {
      // Extract query params; default to page 1, limit 20
      const { classId, page = 1, limit = 20 } = req.query;
      const filter = {};

      // If classId filter is provided, validate it and add to filter
      if (classId) {
        if (!mongoose.Types.ObjectId.isValid(classId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid classId." });
        }
        filter.classId = classId;
      }

      // Query for students matching filter
      const students = await Student.find(filter)
        .skip((page - 1) * limit)                     // Pagination skip
        .limit(parseInt(limit, 10))                   // Pagination limit
        .populate("classId", "name grade section year") // Populate class info
        .select("-__v");                             // Exclude __v field

      // Count total matching documents for pagination info
      const total = await Student.countDocuments(filter);

      // Send back paginated list
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

  /**
   * POST /students
   * Create a new student document in the database.
   */
  createStudent: async (req, res) => {
    try {
      // Destructure expected fields from request body
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
        schoolId,
      } = req.body;

      // Validate required fields
      if (!studentId || !name || !classId || !schoolId) {
        return res.status(400).json({
          success: false,
          message: "studentId, name, classId, and schoolId are required.",
        });
      }

      // Ensure studentId or email uniqueness
      const existing = await Student.findOne({
        $or: [{ studentId }, { email: email?.toLowerCase() }],
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "A student with that ID or email already exists.",
        });
      }

      // Validate Class ID format
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid classId." });
      }

      // Ensure the class belongs to the same school
      const classExists = await Class.exists({ _id: classId, schoolId });
      if (!classExists) {
        return res.status(404).json({
          success: false,
          message: "Class not found or doesn't belong to this school.",
        });
      }

      // Attach schoolId to each parent object if provided
      const parentsWithSchoolId = parents.map((parent) => ({
        ...parent,
        schoolId,
      }));

      // Create the student document
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
        parents: parentsWithSchoolId,
        schoolId,
      });

      // Re-fetch the student to populate class details for response
      const populatedStudent = await Student.findById(student._id)
        .populate("classId", "name grade section year")
        .select("-__v");

      // Return created student
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

  /**
   * GET /students/:studentId
   * Fetch a single student by ID, including populated class details.
   */
  getStudentById: async (req, res) => {
    try {
      const { studentId } = req.params;
      const { schoolId } = req.query;

      // Validate studentId format
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }

      const query = { _id: studentId };
      
      // Add schoolId filter if provided
      if (schoolId) {
        if (!mongoose.Types.ObjectId.isValid(schoolId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid schoolId." });
        }
        query.schoolId = schoolId;
      }

      const student = await Student.findOne(query)
        .populate("classId", "name grade section year")
        .select("-__v");

      // Handle not found
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      // Return the student document
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

  /**
   * PUT /students/:studentId
   * Update an existing student's fields (partial updates allowed).
   */
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

      // Validate studentId format
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }

      // Build update object only with provided fields
      const updates = {};
      if (name) updates.name = name;
      if (dob) updates.dob = new Date(dob);
      if (gender) updates.gender = gender;
      if (address) updates.address = address;
      if (phone) updates.phone = phone;
      if (feePaid !== undefined) updates.feePaid = feePaid;
      if (Array.isArray(parents)) updates.parents = parents;

      // Check email uniqueness if email changed
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

      // Validate new classId if provided
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

      // Perform the update, return new document, run validators
      const updatedStudent = await Student.findByIdAndUpdate(
        studentId,
        { $set: updates },
        { new: true, runValidators: true, context: "query" }
      )
        .populate("classId", "name grade section year")
        .select("-__v");

      // Handle not found
      if (!updatedStudent) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      // Return updated student
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

  /**
   * DELETE /students/:studentId
   * Remove a student document by ID.
   */
  deleteStudent: async (req, res) => {
    try {
      const { studentId } = req.params;

      // Validate studentId
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }

      // Delete the document
      const deleted = await Student.findByIdAndDelete(studentId);

      // Handle not found
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      // Return success
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

  /**
   * GET /students/:studentId/progress
   * Return the academicReport sub-document for a student.
   */
  getProgress: async (req, res) => {
    try {
      const { studentId } = req.params;

      // Validate studentId format
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }

      // Fetch only academicReport field
      const student = await Student.findById(studentId).select(
        "academicReport"
      );
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      // Return academic report
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

  /**
   * GET /student/:parentId
   * Find all students associated with a particular parent ID.
   */
  getStudentByParentId: async (req, res) => {
    try {
      const { parentId } = req.params;

      // Validate parentId
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid parentId." });
      }

      // Query students whose parents array contains the parentId
      const students = await Student.find({ parents: parentId })
        .populate("classId", "name grade section year")
        .select("-__v");

      if (students.length === 0) {
        return res
          .status(404)
          .json({
            success: false,
            message: "No students found for this parent.",
          });
      }

      // Return matching students
      return res.status(200).json({ success: true, data: students });
    } catch (err) {
      console.error("studentController.getStudentByParentId error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  /**
   * GET /students/:studentId/parents
   * Return only the parent ObjectIds for a given student.
   */
  getParentNameByStudentId: async (req, res) => {
    try {
      const { studentId } = req.params;

      // Validate studentId
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }

      // Fetch only parents field (raw ObjectId array)
      const student = await Student.findById(studentId).select("parents");

      // Handle not found
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found.",
        });
      }

      // parentIds is an array of ObjectId
      const parentIds = student.parents;

      // Return parent IDs
      return res.status(200).json({
        success: true,
        data: { studentId, parentIds },
      });
    } catch (err) {
      console.error("studentController.getParentNameByStudentId error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
