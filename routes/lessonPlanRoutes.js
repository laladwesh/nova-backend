// routes/lessonPlanRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const lessonPlanController = require("../controllers/lessonPlanController");

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
// Lesson Plan CRUD
///////////////////////////

/**
 * 1. GET '/' – list all lesson plans
 *    – Only Teacher or Admin can view lesson plans.
 */
router.get(
  "/",
  authenticate,
  isTeacherOrAdmin,
  lessonPlanController.listLessonPlans
);

/**
 * 2. POST '/' – create a new lesson plan
 *    – Only Teacher or Admin can create.
 */
router.post(
  "/",
  authenticate,
  isTeacherOrAdmin,
  lessonPlanController.createLessonPlan
);

/**
 * 3. GET '/:planId' – get a single lesson plan by ID
 *    – Only Teacher or Admin can view.
 */
router.get(
  "/:planId",
  authenticate,
  isTeacherOrAdmin,
  lessonPlanController.getLessonPlanById
);

/**
 * 4. PUT '/:planId' – update a lesson plan
 *    – Only Teacher or Admin can update.
 */
router.put(
  "/:planId",
  authenticate,
  isTeacherOrAdmin,
  lessonPlanController.updateLessonPlan
);

/**
 * 5. DELETE '/:planId' – delete a lesson plan
 *    – Only Teacher or Admin can delete.
 */
router.delete(
  "/:planId",
  authenticate,
  isTeacherOrAdmin,
  lessonPlanController.deleteLessonPlan
);

module.exports = router;
