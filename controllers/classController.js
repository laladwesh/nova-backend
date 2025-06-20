// controllers/classController.js

/**
 * Class Controller
 *  - listClasses:      Return all classes (with optional pagination)
 *  - createClass:      Create a new class
 *  - getClassById:     Return a single class by ID (with populated teachers & students)
 *  - updateClass:      Update fields of a class
 *  - deleteClass:      Delete a class
 *  - getClassTeachers: Return the list of teachers for a class
 *  - setClassTeachers: Assign/update teachers for a class
 *  - getClassSubjects: Return the list of subjects for a class
 *  - setClassSubjects: Assign/update subjects for a class
 *
 * Assumptions:
 *  - authMiddleware ensures req.user is populated
 *  - Class model has fields: name, grade, section, year, teachers (array of ObjectId), subjects (array of String), students (array of ObjectId)
 *  - Teacher model exists for validating teacher IDs
 */

const { Class, Teacher, School } = require("../models");

module.exports = {
  // GET /classes
  listClasses: async (req, res) => {
    try {
      // Optionally, add pagination: const { page = 1, limit = 20 } = req.query;
      const classes = await Class.find()
        .populate("teachers", "name email teacherId")
        .populate("students", "name studentId");
      return res.status(200).json({ success: true, data: classes });
    } catch (err) {
      console.error("classController.listClasses error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /classes
  createClass: async (req, res) => {
    try {
      const {
        name,
        grade,
        section,
        year,
        schoolId, // Extract schoolId from request
        teachers = [],
        subjects = [],
        students = [],
        analytics = { attendancePct: 0, avgGrade: 0, passPct: 0 },
      } = req.body;

      // Required fields
      if (!name || !grade || !section || !year || !schoolId) {
        return res.status(400).json({
          success: false,
          message: "name, grade, section, year, and schoolId are required.",
        });
      }

      // Validate teacher IDs, if provided
      if (teachers.length > 0) {
        const validTeachers = await Teacher.find({
          _id: { $in: teachers },
        }).select("_id");
        if (validTeachers.length !== teachers.length) {
          return res.status(400).json({
            success: false,
            message: "One or more teacher IDs are invalid.",
          });
        }
      }
      //validate class name uniqueness
      const existingClass = await Class.findOne({
        name,
        grade,
        section,
        year,
        schoolId, // Ensure class name is unique within the same school
      });
      if (existingClass) {
        return res.status(400).json({
          success: false,
          message: "A class with this name, grade, section, and year already exists in this school.",
        });
      }
      // Create the class document - include schoolId here
      const newClass = await Class.create({
        name,
        grade,
        section,
        year,
        schoolId, // Add this to match your model requirements
        teachers,
        subjects,
        students,
        analytics, // Include analytics if your model supports it
      });

      // Populate before returning
      const populatedClass = await Class.findById(newClass._id)
        .populate("teachers", "name email teacherId")
        .populate("students", "name studentId");

      await School.findByIdAndUpdate(
        schoolId,
        { $push: { classes: newClass._id } },
        { new: true }
      );
      return res.status(201).json({
        success: true,
        message: "Class created successfully.",
        data: populatedClass,
      });
    } catch (err) {
      console.error("classController.createClass error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /classes/:classId
  getClassById: async (req, res) => {
    try {
      const { classId } = req.params;
      const classDoc = await Class.findById(classId).select("-__v")
        .populate("teachers", "name email teacherId")
        .populate("students", "name studentId").populate("schoolId", "name");

      if (!classDoc) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      return res.status(200).json({ success: true, data: classDoc });
    } catch (err) {
      console.error("classController.getClassById error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /classes/:classId
  updateClass: async (req, res) => {
    try {
      const { classId } = req.params;
      const { name, grade, section, year, teachers, subjects, students } =
        req.body;

      // Build update object
      const updates = {};
      if (name) updates.name = name;
      if (grade) updates.grade = grade;
      if (section) updates.section = section;
      if (year) updates.year = year;

      // If teachers provided, validate
      if (Array.isArray(teachers)) {
        const validTeachers = await Teacher.find({
          _id: { $in: teachers },
        }).select("_id");
        if (validTeachers.length !== teachers.length) {
          return res.status(400).json({
            success: false,
            message: "One or more teacher IDs are invalid.",
          });
        }
        updates.teachers = teachers;
      }

      if (Array.isArray(subjects)) {
        updates.subjects = subjects;
      }

      if (Array.isArray(students)) {
        updates.students = students;
      }

      const updatedClass = await Class.findByIdAndUpdate(
        classId,
        { $set: updates },
        { new: true, runValidators: true, context: "query" }
      )
        .populate("teachers", "name email teacherId")
        .populate("students", "name studentId");

      if (!updatedClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Class updated successfully.",
        data: updatedClass,
      });
    } catch (err) {
      console.error("classController.updateClass error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // DELETE /classes/:classId
  deleteClass: async (req, res) => {
    try {
      const { classId } = req.params;
      const deleted = await Class.findByIdAndDelete(classId);

      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      return res
        .status(200)
        .json({ success: true, message: "Class deleted successfully." });
    } catch (err) {
      console.error("classController.deleteClass error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /classes/:classId/teachers
  getClassTeachers: async (req, res) => {
    try {
      const { classId } = req.params;
      const classDoc = await Class.findById(classId).populate(
        "teachers",
        "name email teacherId"
      );

      if (!classDoc) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      return res.status(200).json({
        success: true,
        data: classDoc.teachers,
      });
    } catch (err) {
      console.error("classController.getClassTeachers error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /classes/:classId/teachers
  assignTeachersToClass: async (req, res, next) => {
    const { classId } = req.params;
    const { teacherIds } = req.body; // expecting ["id1","id2",...]

    // 1) Validate
    if (!Array.isArray(teacherIds)) {
      return res
        .status(400)
        .json({ success: false, message: "teacherIds must be an array." });
    }

    try {
      // 2) Ensure class exists
      const cls = await Class.findById(classId);
      if (!cls) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }
      // console.log("Class found:", cls.name);

      // 3) Add teachers to class (no duplicates)
      await Class.findByIdAndUpdate(classId, {
        $addToSet: { teachers: { $each: teacherIds } },
      });
      // console.log("Teachers added to class:", teacherIds , "to class:", cls.teachers);
      // 4) Add class to each teacher’s classes array (no duplicates)
      await Teacher.updateMany(
        { _id: { $in: teacherIds } },
        { $addToSet: { classes: classId } }
      );

      // 5) Return updated list of teachers
      const populated = await Class.findById(classId).populate(
        "teachers",
        "name email teacherId"
      );

      res.json({ success: true, data: populated.teachers });
    } catch (err) {
      next(err);
    }
  },

  // GET /classes/:classId/subjects
  getClassSubjects: async (req, res) => {
    try {
      const { classId } = req.params;
      const classDoc = await Class.findById(classId).select("subjects");

      if (!classDoc) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      return res.status(200).json({
        success: true,
        data: classDoc.subjects,
      });
    } catch (err) {
      console.error("classController.getClassSubjects error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /classes/:classId/subjects
  setClassSubjects: async (req, res) => {
    try {
      const { classId } = req.params;
      const { subjects } = req.body;

      if (!Array.isArray(subjects)) {
        return res.status(400).json({
          success: false,
          message: "subjects must be an array of strings.",
        });
      }

      const updatedClass = await Class.findByIdAndUpdate(
        classId,
        { $set: { subjects } },
        { new: true, runValidators: true, context: "query" }
      ).select("subjects");

      if (!updatedClass) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Subjects updated successfully.",
        data: updatedClass.subjects,
      });
    } catch (err) {
      console.error("classController.setClassSubjects error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /classes/:classId/students
  getClassStudents: async (req, res) => {
    try {
      const { classId } = req.params;
      const classDoc = await Class.findById(classId).populate(
        "students",
        "name studentId"
      );

      if (!classDoc) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      return res.status(200).json({
        success: true,
        data: classDoc.students,
      });
    } catch (err) {
      console.error("classController.getClassStudents error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /classes/:classId/students
  assignStudentsToClass: async (req, res, next) => {
    const { classId } = req.params;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds)) {
      return res
        .status(400)
        .json({ success: false, message: "studentIds must be an array." });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const cls = await Class.findById(classId).session(session);
      if (!cls) throw new Error("Class not found");

      const old = cls.students.map(String);
      const neu = studentIds.map(String);

      cls.students = neu;
      await cls.save({ session });

      const toAdd = neu.filter((id) => !old.includes(id));
      const toRemove = old.filter((id) => !neu.includes(id));

      if (toAdd.length) {
        await Student.updateMany(
          { _id: { $in: toAdd } },
          { $addToSet: { classes: cls._id } },
          { session }
        );
      }
      if (toRemove.length) {
        await Student.updateMany(
          { _id: { $in: toRemove } },
          { $pull: { classes: cls._id } },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      const populated = await Class.findById(classId).populate(
        "students",
        "name studentId"
      );
      res.json({ success: true, data: populated.students });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      next(err);
    }
  },
};
