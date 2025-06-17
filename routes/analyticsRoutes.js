// routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();

const {
  authenticate,
  isAdmin,
  isTeacher
} = require("../middleware/authMiddleware");
const analyticsController = require("../controllers/analyticsController");

/**
 * 1. Attendance analytics
 *    - Only teachers or admins should fetch attendance analytics.
 */
router.get(
  "/attendance",
  authenticate,
  isTeacher,
  analyticsController.getAttendanceAnalytics
);
// If you also want admins to access /attendance, chain both:
router.get(
  "/attendance",
  authenticate,
  (req, res, next) => {
    if (req.user.role === "teacher" || req.user.role === "school_admin") {
      return next();
    }
    return res
      .status(403)
      .json({ success: false, message: "Teacher or Admin role required." });
  },
  analyticsController.getAttendanceAnalytics
);

/**
 * 2. Grades analytics
 *    - Only teachers or admins should fetch grades analytics.
 */
router.get(
  "/grades",
  authenticate,
  (req, res, next) => {
    if (req.user.role === "teacher" || req.user.role === "school_admin") {
      return next();
    }
    return res
      .status(403)
      .json({ success: false, message: "Teacher or Admin role required." });
  },
  analyticsController.getGradesAnalytics
);

/**
 * 3. Teacher‐performance analytics
 *    - A teacher can see their own performance; admins can see any.
 */
router.get(
  "/teacher-performance",
  authenticate,
  (req, res, next) => {
    if (req.user.role === "teacher" || req.user.role === "school_admin") {
      return next();
    }
    return res
      .status(403)
      .json({ success: false, message: "Teacher or Admin role required." });
  },
  analyticsController.getTeacherPerformance
);

/**
 * 4. School‐wide performance analytics
 *    - Only admins can fetch school‐wide performance.
 */
router.get(
  "/school-performance",
  authenticate,
  isAdmin,
  analyticsController.getSchoolPerformance
);

/**
 * 5. Class averages
 *    - Teachers or admins can fetch class averages.
 */
router.get(
  "/class-averages",
  authenticate,
  (req, res, next) => {
    if (req.user.role === "teacher" || req.user.role === "school_admin") {
      return next();
    }
    return res
      .status(403)
      .json({ success: false, message: "Teacher or Admin role required." });
  },
  analyticsController.getClassAverages
);

/**
 * 6. Student‐vs‐class comparison
 *    - Students can compare themselves against class; teachers and admins can also fetch.
 */
router.get(
  "/student-vs-class",
  authenticate,
  (req, res, next) => {
    const role = req.user.role;
    if (role === "student" || role === "teacher" || role === "school_admin") {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: "Student, Teacher, or Admin role required.",
    });
  },
  analyticsController.getStudentVsClass
);

module.exports = router;
