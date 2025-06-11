// controllers/schoolController.js
const { School } = require("../models");

/**
 * POST /schools
 * Create a new School record.
 *
 * Body JSON:
 * {
 *   "name": "Eastside High School",
 *   "token": "EAST123TOKEN",   // optional
 *   "address": "123 Main St, City, State",
 *   "phone": "555-123-4567"
 * }
 *
 * Response (201 Created):
 * {
 *   "success": true,
 *   "message": "School created successfully",
 *   "data": {
 *     "school": {
 *       "_id": "...",
 *       "name": "Eastside High School",
 *       "token": "EAST123TOKEN",
 *       "address": "123 Main St, City, State",
 *       "phone": "555-123-4567",
 *       "createdAt": "...",
 *       "updatedAt": "..."
 *     }
 *   }
 * }
 */
exports.createSchool = async (req, res) => {
  try {
    const { name, token, address, phone , email } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "School name is required.",
      });
    }

    // If you want to enforce unique token:
    if (token) {
      const existing = await School.findOne({ token });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Token already in use by another school.",
        });
      }
    }

    // Build the new School document:
    const newSchoolData = { name };
    if (token) newSchoolData.token = token.trim();
    if (address) newSchoolData.address = address.trim();
    if (phone) newSchoolData.phone = phone.trim();
    if (email) {
      newSchoolData.email = email.trim();
      // Optional: Validate email format if needed
      // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // if (!emailRegex.test(newSchoolData.email)) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "Invalid email format.",
      //   });
      // }
    }

    const school = await School.create(newSchoolData);

    return res.status(201).json({
      success: true,
      message: "School created successfully",
      data: {
        school,
      },
    });
  } catch (err) {
    console.error("schoolController.createSchool error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

/**
 * GET /schools
 * (Optional) List all Schools—useful for an admin‐panel.
 *
 * Headers: Authorization: Bearer <accessToken>   (Admin only)
 * Query Params (optional): none
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "schools": [
 *       { "_id": "...", "name": "Eastside", "token": "...", ... },
 *       { "_id": "...", "name": "Westside", "token": "...", ... }
 *     ]
 *   }
 * }
 */
exports.listSchools = async (req, res) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: { schools },
    });
  } catch (err) {
    console.error("schoolController.listSchools error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
