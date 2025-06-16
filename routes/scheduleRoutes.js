// routes/scheduleRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const scheduleController = require("../controllers/scheduleController");

/**
 * Helper inline to allow only Teacher OR Admin
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
 * Helper inline to allow only Student OR Admin
 */
function isStudentOrAdmin(req, res, next) {
  const role = req.user.role;
  if (role === "student" || role === "school_admin") {
    return next();
  }
  return res
    .status(403)
    .json({ success: false, message: "Student or Admin role required." });
}

/**
 * Helper inline to allow a Teacher to view their own timetable or Admin to view any
 */
function canViewTeacherSchedule(req, res, next) {
  const { teacherId } = req.params;
  const { _id, role } = req.user;
  if (
    role === "school_admin" ||
    (role === "teacher" && _id.toString() === teacherId)
  ) {
    return next();
  }
  return res
    .status(403)
    .json({
      success: false,
      message: "Only that teacher or Admin may view this timetable.",
    });
}

/**
 * Helper inline to allow a Student to view their own timetable or Admin to view any
 */
function canViewStudentSchedule(req, res, next) {
  const { studentId } = req.params;
  const { _id, role } = req.user;
  if (
    role === "school_admin" ||
    (role === "student" && _id.toString() === studentId)
  ) {
    return next();
  }
  return res
    .status(403)
    .json({
      success: false,
      message: "Only that student or Admin may view this timetable.",
    });
}

///////////////////////////
// Class timetables
///////////////////////////

/**
 * 1. GET '/' – list all schedules (e.g., all class timetables)
 *    – Any authenticated user may view.
 */
router.get("/", authenticate, scheduleController.listSchedules);

/**
 * 2. POST '/' – create a new schedule (class timetable)
 *    – Only Teacher or Admin can create.
 */
router.post(
  "/",
  authenticate,
  isTeacherOrAdmin,
  scheduleController.createSchedule
);

/**
 * 3. GET '/:scheduleId' – get a specific schedule by ID
 *    – Any authenticated user may view.
 */
router.get("/:scheduleId", authenticate, scheduleController.getScheduleById);

/**
 * 4. PUT '/:scheduleId' – update a specific schedule
 *    – Only Teacher or Admin can update.
 */
router.put(
  "/:scheduleId",
  authenticate,
  isTeacherOrAdmin,
  scheduleController.updateSchedule
);

/**
 * 5. DELETE '/:scheduleId' – delete a specific schedule
 *    – Only Teacher or Admin can delete.
 */
router.delete(
  "/:scheduleId",
  authenticate,
  isTeacherOrAdmin,
  scheduleController.deleteSchedule
);

///////////////////////////
// Teacher‐specific timetable
///////////////////////////

/**
 * 6. GET '/teacher/:teacherId' – get timetable for a specific teacher
 *    – That Teacher themself or an Admin may view.
 */
router.get(
  "/teacher/:teacherId",
  authenticate,
  canViewTeacherSchedule,
  scheduleController.getTeacherSchedule
);

///////////////////////////
// Student‐specific timetable
///////////////////////////

/**
 * 7. GET '/student/:studentId' – get timetable for a specific student
 *    – That Student themself or an Admin may view.
 */
router.get(
  "/student/:studentId",
  authenticate,
  canViewStudentSchedule,
  scheduleController.getStudentSchedule
);

module.exports = router;