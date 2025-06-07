// routes/resourceRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const resourceController = require("../controllers/resourceController");

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
// Resource library
///////////////////////////

/**
 * 1. GET '/' – list all resources
 *    – Any authenticated user (student, parent, teacher, admin) may view resources.
 */
router.get("/", authenticate, resourceController.listResources);

/**
 * 2. GET '/:resourceId' – get a specific resource by ID
 *    – Any authenticated user may view.
 */
router.get("/:resourceId", authenticate, resourceController.getResourceById);

/**
 * 3. POST '/' – create a new resource
 *    – Only Teacher or Admin can upload/create.
 */
router.post(
  "/",
  authenticate,
  isTeacherOrAdmin,
  resourceController.createResource
);

/**
 * 4. DELETE '/:resourceId' – delete a resource
 *    – Only Teacher or Admin can delete.
 */
router.delete(
  "/:resourceId",
  authenticate,
  isTeacherOrAdmin,
  resourceController.deleteResource
);

module.exports = router;
