// routes/assignmentRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const assignmentController = require("../controllers/assignmentController");

/**
 * Helper inline to allow Teacher OR Admin
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
 * Helper inline to allow any authenticated user (student/teacher/admin/parent)
 * (Here we simply call `authenticate`, so no extra check is needed.)
 */

///////////////////////////
// Assignment CRUD
///////////////////////////

/**
 * 1. GET '/' – list assignments.
 *    - Any authenticated user may list (e.g., students see their class’s assignments; teachers/admin see all or filtered).
 */
router.get("/", authenticate, assignmentController.listAssignments);

/**
 * 2. POST '/' – create a new assignment.
 *    - Only Teacher or Admin can create.
 */
router.post(
  "/",
  authenticate,
  isTeacherOrAdmin,
  assignmentController.createAssignment
);

/**
 * 3. GET '/:assignmentId' – get assignment by ID.
 *    - Any authenticated user may fetch details (front end will filter by class/student as needed).
 */
router.get(
  "/:assignmentId",
  authenticate,
  assignmentController.getAssignmentById
);

/**
 * 4. PUT '/:assignmentId' – update assignment.
 *    - Only Teacher or Admin can update.
 */
router.put(
  "/:assignmentId",
  authenticate,
  isTeacherOrAdmin,
  assignmentController.updateAssignment
);

/**
 * 5. DELETE '/:assignmentId' – delete assignment.
 *    - Only Teacher or Admin can delete.
 */
router.delete(
  "/:assignmentId",
  authenticate,
  isTeacherOrAdmin,
  assignmentController.deleteAssignment
);

///////////////////////////
// Submission viewing & feedback
///////////////////////////

/**
 * 6. GET '/:assignmentId/submissions' – list all submissions for an assignment.
 *    - Only Teacher or Admin may view submissions.
 */
router.get(
  "/:assignmentId/submissions",
  authenticate,
  isTeacherOrAdmin,
  assignmentController.listSubmissions
);

/**
 * 7. PUT '/:assignmentId/submissions/:submissionId/feedback'
 *    – provide feedback on a specific submission.
 *    - Only Teacher or Admin can provide feedback.
 */
router.put(
  "/:assignmentId/submissions/:submissionId/feedback",
  authenticate,
  isTeacherOrAdmin,
  assignmentController.provideFeedback
);

module.exports = router;
