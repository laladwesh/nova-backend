// routes/reportRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const reportController = require("../controllers/reportController");

/**
 * Inline helper to allow only Teacher OR Admin
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

///////////////////////////
// Downloadable reports (CSV/PDF)
///////////////////////////

/**
 * 1. GET '/attendance' – download attendance report
 *    – Only Teacher or Admin may download.
 */
// 1. Download attendance report (accepts ?format=csv|pdf via req.query)
router.get(
  "/attendance",
  authenticate,
  isTeacherOrAdmin,
  reportController.downloadAttendanceReport
);

// 2. Download grades report (accepts ?format=csv|pdf via req.query)
router.get(
  "/grades",
  authenticate,
  isTeacherOrAdmin,
  reportController.downloadGradesReport
);

// 3. Download fee-collection report (accepts ?format=csv|pdf via req.query)
router.get(
  "/fee-collection",
  authenticate,
  isTeacherOrAdmin,
  reportController.downloadFeeCollectionReport
);
module.exports = router;
