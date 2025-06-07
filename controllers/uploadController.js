// controllers/uploadController.js

/**
 * Upload Controller
 *  - uploadFile:   Handle single-file uploads (e.g., avatars, resources, attachments)
 *
 * Uses multer to store uploaded files under ./uploads/, and returns the accessible URL/path.
 * Expects multipart/form-data with field name "file".
 */

const path = require("path");
const multer = require("multer");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // e.g., "1598341234567-originalname.ext"
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}-${safeName}`);
  },
});

// Filter to accept common file types (images, PDFs, docs, etc.)
const fileFilter = (req, file, cb) => {
  // Accept any file; implement specific filters if needed
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB file size limit
  },
}).single("file");

module.exports = {
  uploadFile: (req, res) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        return res.status(400).json({ success: false, message: err.message });
      } else if (err) {
        // An unknown error occurred when uploading.
        console.error("uploadController.uploadFile error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }

      // No file received
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file provided." });
      }

      // Build a URL or path to return. Adjust base URL as needed.
      const fileUrl = `/uploads/${req.file.filename}`;
      return res.status(200).json({
        success: true,
        message: "File uploaded successfully.",
        data: {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          url: fileUrl,
        },
      });
    });
  },
};
