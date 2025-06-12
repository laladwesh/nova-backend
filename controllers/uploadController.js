
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinary");
const uploadResource = async (req, res) => {
  try {
    // multer has put the file buffer on req.file
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'courses' },
      (error, result) => {
        if (error) return res.status(500).json({ error });
        console.log(result.secure_url);
        res.json({ url: result.secure_url });
      }
    );
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (err) {
    console.error('uploadResource error:', err);
    res.status(500).json({ error: err.message });
  }
};
module.exports = {
  uploadResource
};
