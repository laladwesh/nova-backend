// routes/gradeRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const gradeController = require("../controllers/gradeController");

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
// Grade entries
///////////////////////////

/**
 * 1. POST '/' – create a new grade entry
 *    – Only Teacher or Admin can create grades.
 */
router.post("/", authenticate, isTeacherOrAdmin, gradeController.createGrade);

/**
 * 2. GET '/:gradeId' – fetch one grade by ID
 *    – Any authenticated user (student/teacher/admin) may view.
 */
router.get("/:gradeId", authenticate, gradeController.getGradeById);

/**
 * 3. PUT '/:gradeId' – update a grade entry
 *    – Only Teacher or Admin can update grades.
 */
router.put(
  "/:gradeId",
  authenticate,
  isTeacherOrAdmin,
  gradeController.updateGrade
);

/**
 * 4. DELETE '/:gradeId' – delete a grade entry
 *    – Only Teacher or Admin can delete grades.
 */
router.delete(
  "/:gradeId",
  authenticate,
  isTeacherOrAdmin,
  gradeController.deleteGrade
);

///////////////////////////
// Fetch grades by subject & class
///////////////////////////

/**
 * 5. GET '/subject/:subjectId/class/:classId' – fetch grades filtered by subject & class
 *    – Any authenticated user may view these aggregated grades.
 */
router.get(
  "/subject/:subjectId/class/:classId",
  authenticate,
  gradeController.getGradesBySubjectClass
);

module.exports = router;
