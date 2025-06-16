/**
 * routes/teacherRoutes.js
 *
 * Defines all HTTP endpoints related to Teacher operations.
 * Applies authentication and role-based authorization via inline middleware.
 */
const express = require("express");
const router = express.Router();

// Middleware to verify authentication and admin role
const { authenticate, isAdmin } = require("../middleware/authMiddleware");
// Controller functions handling business logic for each route
const teacherController = require("../controllers/teacherController");

/**
 * Inline helper: allow only the teacher themself OR Admin role
 * Used for routes where teachers can view/edit their own data, admins can access any
 */
function canViewOrEditTeacher(req, res, next) {
  const { teacherId } = req.params;
  const { _id, role } = req.user;

  // Admins can proceed for any teacher
  if (role === "school_admin") {
    return next();
  }

  // A teacher may access/modify their own record only
  if (role === "teacher" && _id.toString() === teacherId) {
    return next();
  }

  // Otherwise, forbid access
  return res
    .status(403)
    .json({ success: false, message: "Not authorized to access this teacher." });
}

///////////////////////////
// Teacher CRUD Endpoints
///////////////////////////

/**
 * 1. GET '/' – list all teachers
 *    - Only Admin users may list all teachers
 */
router.get(
  "/",
  authenticate,           // User must be authenticated
  isAdmin,                // Only Admin may access
  teacherController.listTeachers // Handler returns list of teachers
);

/**
 * 2. POST '/' – create a new teacher
 *    - Only Admin users may create teacher records
 */
router.post(
  "/",
  authenticate,           // User must be authenticated
  isAdmin,                // Only Admin may access
  teacherController.createTeacher // Handler creates a new teacher
);

/**
 * 3. GET '/:teacherId' – fetch a teacher by ID
 *    - Admins may fetch any teacher
 *    - A teacher may fetch their own profile
 */
router.get(
  "/:teacherId",
  authenticate,           // User must be authenticated
  canViewOrEditTeacher,   // Teacher-self or Admin may access
  teacherController.getTeacherById // Handler returns teacher details
);

/**
 * 4. PUT '/:teacherId' – update a teacher record
 *    - Admins may update any teacher
 *    - A teacher may update their own profile
 */
router.put(
  "/:teacherId",
  authenticate,           // User must be authenticated
  canViewOrEditTeacher,   // Teacher-self or Admin may access
  teacherController.updateTeacher // Handler updates teacher data
);

/**
 * 5. DELETE '/:teacherId' – delete a teacher record
 *    - Only Admin users may delete teacher records
 */
router.delete(
  "/:teacherId",
  authenticate,           // User must be authenticated
  isAdmin,                // Only Admin may access
  teacherController.deleteTeacher // Handler removes teacher document
);

///////////////////////////
// Assign Roles to Teacher
///////////////////////////

/**
 * 6. PUT '/:teacherId/assign-role' – assign one or more roles to a teacher
 *    - Only Admin users may assign or change roles
 */
router.put(
  "/:teacherId/assign-role",
  authenticate,           // User must be authenticated
  isAdmin,                // Only Admin may access
  teacherController.assignRole // Handler assigns roles to teacher
);

///////////////////////////
// Teacher Performance Metrics
///////////////////////////

/**
 * 7. GET '/:teacherId/performance' – retrieve performance metrics for a teacher
 *    - Admins may view any teacher's performance
 *    - A teacher may view their own performance metrics
 */
router.get(
  "/:teacherId/performance",
  authenticate,           // User must be authenticated
  canViewOrEditTeacher,   // Teacher-self or Admin may access
  teacherController.getPerformance // Handler returns performance data
);

// Export the configured router for mounting in the main application
module.exports = router;
