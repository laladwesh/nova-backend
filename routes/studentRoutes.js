/**
 * routes/studentRoutes.js
 *
 * Defines all HTTP endpoints related to Student operations.
 * Applies authentication and role-based authorization via inline middleware.
 */
const express = require("express");
const router = express.Router();

// Middleware to require authentication; sets req.user = { _id, role }
const { authenticate } = require("../middleware/authMiddleware");

// Controller functions handling business logic for each route
const studentController = require("../controllers/studentController");

/**
 * Inline helper: allow only Teacher or School Admin roles.
 * Used for routes that should be restricted to teaching/admin staff.
 */
function isTeacherOrAdmin(req, res, next) {
  const role = req.user.role;
  if (role === "teacher" || role === "school_admin" || role === "super_admin") {
    return next();             // authorized
  }
  // forbidden for other roles
  return res
    .status(403)
    .json({ success: false, message: "Teacher or Admin role required." });
}

/**
 * Inline helper: allow a student to view/edit their own record,
 * or any teacher/admin to view/edit.
 */
function canViewOrEditStudent(req, res, next) {
  const { studentId } = req.params;
  const { _id, role } = req.user;

  // Admins and teachers can proceed
  if (role === "school_admin" || role === "teacher" || role === "super_admin") {
    return next();
  }
  // A student may access their own record only
  if (role === "student" && _id.toString() === studentId) {
    return next();
  }
  // otherwise forbidden
  return res
    .status(403)
    .json({ success: false, message: "Not authorized to access this student." });
}

/**
 * Inline helper: allow viewing academic progress
 * – Teachers/Admins can view any
 * – Students can view only their own
 */
function canViewProgress(req, res, next) {
  const { studentId } = req.params;
  const { _id, role } = req.user;

  // Admin/Teacher allowed
  if (role === "school_admin" || role === "teacher") {
    return next();
  }
  // Student may view their own progress
  if (role === "student" && _id.toString() === studentId) {
    return next();
  }
  // otherwise forbidden
  return res
    .status(403)
    .json({ success: false, message: "Not authorized to view this progress." });
}

///////////////////////////
// Student CRUD Endpoints
///////////////////////////

/**
 * 1. GET '/' – List all students
 *    - Accessible by teachers and admins only
 *    - Supports optional query parameters for pagination and filtering by classId
 */
router.get("/", authenticate, isTeacherOrAdmin, studentController.listStudents);
router.get('/par/:parentId' , authenticate,  studentController.getStudentByParentId);
/**
 * 3. GET '/parentName/:studentId' – Get parent IDs of a student
 *    - Any authenticated user may query
 *    - Returns only the array of parent ObjectIds for the student
 */
router.get(
  '/parentName/:studentId',
  authenticate,
  studentController.getParentNameByStudentId
);

/**
 * 4. POST '/' – Create a new student
 *    - Accessible by teachers and admins only
 *    - Body must include studentId, name, classId, schoolId, etc.
 */
router.post(
  "/",
  authenticate,
  isTeacherOrAdmin,
  studentController.createStudent
);

/**
 * 5. GET '/:studentId' – Fetch a single student by ID
 *    - Teachers/Admins may fetch any student
 *    - A student may fetch only their own data
 */
router.get(
  "/:studentId",
  authenticate,
  canViewOrEditStudent,
  studentController.getStudentById
);

/**
 * 6. PUT '/:studentId' – Update a student record
 *    - Teachers/Admins may update any student
 *    - A student may update only their own record
 */
router.put(
  "/:studentId",
  authenticate,
  canViewOrEditStudent,
  studentController.updateStudent
);

/**
 * 7. DELETE '/:studentId' – Delete a student record
 *    - Teachers/Admins only
 *    - Permanently removes the document
 */
router.delete(
  "/:studentId",
  authenticate,
  isTeacherOrAdmin,
  studentController.deleteStudent
);

///////////////////////////
// Academic Progress Endpoint
///////////////////////////

/**
 * GET '/:studentId/progress' – Fetch only academicReport sub-document
 *    - Teachers/Admins may view any student's progress
 *    - Students may view only their own progress
 */
router.get(
  "/:studentId/progress",
  authenticate,
  canViewProgress,
  studentController.getProgress
);

// Export the configured router to mount in the main app
module.exports = router;
