// routes/uploadRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const uploadController = require("../controllers/uploadController");

/**
 * Inline helper to allow only Teacher OR Admin for uploading files
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
// File upload (e.g., for avatars, resources, attachments)
///////////////////////////

/**
 * POST '/' – upload a file
 *   – Only Teacher or Admin may upload.
 */
router.post("/", authenticate, isTeacherOrAdmin, uploadController.uploadFile);

module.exports = router;
