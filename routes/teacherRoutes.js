// routes/teacherRoutes.js
const express = require("express");
const router = express.Router();

const {
  authenticate,
  isAdmin,
} = require("../middleware/authMiddleware");
const teacherController = require("../controllers/teacherController");

/**
 * Inline helper: allow only Teacher themself OR Admin
 */
function canViewOrEditTeacher(req, res, next) {
  const { teacherId } = req.params;
  const { _id, role } = req.user;

  if (role === "school_admin") {
    return next();
  }
  // A teacher may access their own record
  if (role === "teacher" && _id.toString() === teacherId) {
    return next();
  }
  return res
    .status(403)
    .json({
      success: false,
      message: "Not authorized to access this teacher.",
    });
}

///////////////////////////
// Teacher CRUD
///////////////////////////

/**
 * 1. GET '/' – list all teachers
 *    – Only Admin may list.
 */
router.get("/", authenticate, isAdmin, teacherController.listTeachers);

/**
 * 2. POST '/' – create a new teacher
 *    – Only Admin may create.
 */
router.post("/", authenticate, isAdmin, teacherController.createTeacher);

/**
 * 3. GET '/:teacherId' – get a teacher by ID
 *    – Teacher themself OR Admin may view.
 */
router.get(
  "/:teacherId",
  authenticate,
  canViewOrEditTeacher,
  teacherController.getTeacherById
);

/**
 * 4. PUT '/:teacherId' – update a teacher record
 *    – Teacher themself OR Admin may update.
 */
router.put(
  "/:teacherId",
  authenticate,
  canViewOrEditTeacher,
  teacherController.updateTeacher
);

/**
 * 5. DELETE '/:teacherId' – delete a teacher
 *    – Only Admin may delete.
 */
router.delete(
  "/:teacherId",
  authenticate,
  isAdmin,
  teacherController.deleteTeacher
);

///////////////////////////
// Assign a specific role to teacher
///////////////////////////

/**
 * 6. PUT '/:teacherId/assign-role' – assign role(s) to a teacher
 *    – Only Admin may assign roles.
 */
router.put(
  "/:teacherId/assign-role",
  authenticate,
  isAdmin,
  teacherController.assignRole
);

///////////////////////////
// Teacher performance metrics
///////////////////////////

/**
 * 7. GET '/:teacherId/performance' – get performance metrics for a teacher
 *    – Teacher themself OR Admin may view.
 */
router.get(
  "/:teacherId/performance",
  authenticate,
  canViewOrEditTeacher,
  teacherController.getPerformance
);

module.exports = router;