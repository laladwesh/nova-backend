const School = require("../models/School");

const createSchool = async (req, res) => {
  try {
    const { name, address = "", phone = "", email , secretKey } = req.body;

    // 1) Required fields
    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, message: "Both name and email are required" });
    }

    // 2) Uniqueness check
    const exists = await School.findOne({
      $or: [{ name: name.trim() }, { email: email.trim().toLowerCase() }],
    });
    if (exists) {
      return res
        .status(409)
        .json({
          success: false,
          message: "School name or email already in use",
        });
    }

    // 3) Create and save
    const newSchool = await School.create({
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      secretKey: secretKey ? secretKey.trim() : "",
    });

    // 4) Success response
    return res.status(201).json({
      success: true,
      data: { school: newSchool },
    });
  } catch (error) {
    console.error("Error creating school:", error);

    // Handle duplicate-key errors from MongoDB
    if (error.code === 11000) {
      const dupField = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${dupField} already exists.`,
      });
    }

    // Fallback for all other errors
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const listSchools = async (req, res) => {
  // Get schoolId from query params only (since route has no :schoolId param)
  const schoolId = req.query.schoolId;

  // If no schoolId is provided, proceed with listing all schools
  if (!schoolId) {
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
  } else {
    // If schoolId is provided, fetch that specific school
    try {
      const school = await School.findById(schoolId);

      if (!school) {
        return res.status(404).json({
          success: false,
          message: "School not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: { school },
      });
    } catch (err) {
      console.error("schoolController.listSchools error:", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
};

const getSchoolWithFullDetails = async (req, res) => {
  try {
    const school = await School.findById(req.params.id)
      // Admins (User model)
      .populate({
        path: "admins",
        select: "name email role",
      })
      // Teachers
      .populate({
        path: "teachers",
        select: "teacherId name email phone roles teachingSubs",
      })
      // Students
      .populate({
        path: "students",
        select: "studentId name email phone gender dob address feePaid",
      })
      // Classes
      .populate({
        path: "classes",
        select: "name grade section year subjects analytics",
      })
      // Parents
      .populate({
        path: "parents",
        select: "name email phone students",
      })
      .lean();

    if (!school) {
      return res
        .status(404)
        .json({ success: false, message: "School not found." });
    }

    return res.json({
      success: true,
      data: { school },
    });
  } catch (err) {
    console.error("getSchoolWithFullDetails error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  createSchool,
  listSchools,
  getSchoolWithFullDetails,
};
