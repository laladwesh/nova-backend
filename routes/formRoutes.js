// routes/formRoutes.js
const express = require("express");
const router = express.Router();

const {
  authenticate,
  isTeacher,
  isStudent,
  isAdmin,
} = require("../middleware/authMiddleware");
const formController = require("../controllers/formController");

/**
 * Helper inline to allow Student OR Teacher OR Admin for listing/fetching
 */
function canViewForms(req, res, next) {
  const role = req.user.role;
  if (role === "student" || role === "teacher" || role === "school_admin") {
    return next();
  }
  return res
    .status(403)
    .json({
      success: false,
      message: "Student, Teacher, or Admin role required.",
    });
}

/**
 * Helper inline to allow only Teacher OR Admin for updating status
 */
function canUpdateStatus(req, res, next) {
  const role = req.user.role;
  if (role === "teacher" || role === "school_admin") {
    return next();
  }
  return res
    .status(403)
    .json({ success: false, message: "Teacher or Admin role required." });
}

///////////////////////////
// Available form types
///////////////////////////

/**
 * GET '/types' – list all form types
 *   – Any authenticated user may view form types.
 */
router.get("/types", authenticate, formController.listFormTypes);

///////////////////////////
// Student form submissions
///////////////////////////

/**
 * POST '/' – submit a new form
 *   – Only Students can submit forms.
 */
router.post("/", authenticate, isStudent, formController.submitForm);

/**
 * GET '/student/:studentId' – list forms submitted by a given student
 *   – The student themselves, or any Teacher/Admin, may view.
 */
router.get(
  "/student/:studentId",
  authenticate,
  canViewForms,
  formController.listStudentForms
);

/**
 * GET '/:formId' – get form details by ID
 *   – The student who owns it, or Teacher/Admin, may view.
 */
router.get("/:formId", authenticate, canViewForms, formController.getFormById);

/**
 * PUT '/:formId/status' – update a form’s status (approve/reject)
 *   – Only Teacher or Admin can update form status.
 */
router.put(
  "/:formId/status",
  authenticate,
  canUpdateStatus,
  formController.updateFormStatus
);
router.get(
  "/school/:schoolId",
  authenticate,
  canUpdateStatus,
  formController.getFormsBySchool
);
module.exports = router;
