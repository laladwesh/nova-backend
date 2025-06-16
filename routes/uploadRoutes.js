// routes/uploadRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { authenticate } = require("../middleware/authMiddleware");
const uploadController = require("../controllers/uploadController");
const upload = multer(); // memory storage

// configure from env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
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

router.post("/", upload.single("file"), authenticate , isTeacherOrAdmin, uploadController.uploadResource);

module.exports = router;
