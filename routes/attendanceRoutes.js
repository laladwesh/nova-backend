// routes/attendanceRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const attendanceController = require("../controllers/attendanceController");

/**
 * Helper inline to allow Teacher OR Admin
 */

function canViewOwnAttendance(req, res, next) {
  const { _id, role } = req.user;
  const { studentId } = req.params;
  if (role === "school_admin" || (role === "student" && _id.toString() === studentId)) {
    return next();
  }
  return res.status(403).json({ success: false, message: "Not authorized." });
}

function isTeacherOrAdmin(req, res, next) {
  const role = req.user.role;
  if (role === "teacher" || role === "school_admin") {
    return next();
  }
  return res
    .status(403)
    .json({ success: false, message: "Teacher or Admin role required." });
}

///////////////////////////
// Attendance records
///////////////////////////

/**
 * 1. GET '/' – list all attendance records (optionally filtered by query params)
 *    - Only Teacher or Admin can list attendance.
 */
router.get(
  "/",
  authenticate,
  isTeacherOrAdmin,
  attendanceController.listAttendance
);


router.get(
  "/student/:studentId",
  authenticate,
  canViewOwnAttendance,
  attendanceController.getAttendanceByStudent
);



/**
 * 2. POST '/' – mark attendance for a class on a given date
 *    - Only Teacher or Admin can mark attendance.
 */
router.post(
  "/",
  authenticate,
  isTeacherOrAdmin,
  attendanceController.markAttendance
);

/**
 * 3. PUT '/:attendanceId' – update a specific attendance record
 *    - Only Teacher or Admin can update attendance.
 */
router.put(
  "/:attendanceId",
  authenticate,
  isTeacherOrAdmin,
  attendanceController.updateAttendance
);

/**
 * 4. GET '/:attendanceId/report' – download a CSV report for one attendance record
 *    - Only Teacher or Admin can download attendance report.
 */
router.get(
  "/:attendanceId/report",
  authenticate,
  isTeacherOrAdmin,
  attendanceController.downloadAttendanceReport
);

///////////////////////////
// Class‐level attendance summary
///////////////////////////

/**
 * 5. GET '/class/:classId' – get aggregated attendance overview for a class
 *    - Only Teacher or Admin can view class‐level summary.
 */
router.get(
  "/class/:classId",
  authenticate,
  isTeacherOrAdmin,
  attendanceController.getClassAttendanceOverview
);

module.exports = router;
