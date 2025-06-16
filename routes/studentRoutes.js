// routes/studentRoutes.js
const express = require("express");
const router = express.Router();

const {
  authenticate,
} = require("../middleware/authMiddleware");
const studentController = require("../controllers/studentController");

/**
 * Inline helper: Teacher OR Admin
 */
function isTeacherOrAdmin(req, res, next) {
  const role = req.user.role;
  if (role === "teacher" || role === "school_admin") {
    return next();
  }
  return res
    .status(403)
    .json({ success: false, message: "Teacher or Admin role required." });
}

/**
 * Inline helper: allow student themself, or teacher, or admin
 */
function canViewOrEditStudent(req, res, next) {
  const { studentId } = req.params;
  const { _id, role } = req.user;

  if (role === "school_admin" || role === "teacher") {
    return next();
  }
  // A student may only access their own record:
  if (role === "student" && _id.toString() === studentId) {
    return next();
  }
  return res
    .status(403)
    .json({
      success: false,
      message: "Not authorized to access this student.",
    });
}

/**
 * Inline helper: student themself, or teacher, or admin for progress
 */
function canViewProgress(req, res, next) {
  const { studentId } = req.params;
  const { _id, role } = req.user;

  if (role === "school_admin" || role === "teacher") {
    return next();
  }
  if (role === "student" && _id.toString() === studentId) {
    return next();
  }
  return res
    .status(403)
    .json({ success: false, message: "Not authorized to view this progress." });
}

///////////////////////////
// Student CRUD
///////////////////////////

/**
 * 1. GET '/' – list all students
 *    – Only Teacher or Admin may list students.
 */
router.get("/", authenticate, isTeacherOrAdmin, studentController.listStudents);
router.get('/:parentId' , authenticate,  studentController.getStudentByParentId);
/**
 * 2. POST '/' – create a new student
 *    – Only Teacher or Admin may create student records.
 */
router.post(
  "/",
  authenticate,
  isTeacherOrAdmin,
  studentController.createStudent
);

/**
 * 3. GET '/:studentId' – get a student by ID
 *    – Teacher or Admin may fetch any student.
 *    – A Student may fetch their own record.
 */
router.get(
  "/:studentId",
  authenticate,
  canViewOrEditStudent,
  studentController.getStudentById
);

/**
 * 4. PUT '/:studentId' – update a student record
 *    – Teacher or Admin may update any student.
 *    – A Student may update their own record.
 */
router.put(
  "/:studentId",
  authenticate,
  canViewOrEditStudent,
  studentController.updateStudent
);

/**
 * 5. DELETE '/:studentId' – delete a student record
 *    – Only Teacher or Admin may delete student records.
 */
router.delete(
  "/:studentId",
  authenticate,
  isTeacherOrAdmin,
  studentController.deleteStudent
);

///////////////////////////
// Get academic progress of a student
///////////////////////////

/**
 * GET '/:studentId/progress' – fetch academic progress
 *   – Teacher or Admin may view any.
 *   – A Student may view their own progress.
 */
router.get(
  "/:studentId/progress",
  authenticate,
  canViewProgress,
  studentController.getProgress
);

module.exports = router;
