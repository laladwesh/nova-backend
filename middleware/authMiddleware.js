// middleware/authMiddleware.js

function isSuperAdminAuth(req, res, next) {
  if (req.user.role !== "super_admin") {
    return res
      .status(403)
      .json({ success: false, message: "Super admin role required." });
  }
  next();
}

const jwt = require("jsonwebtoken");
const { User, School } = require("../models"); // assumes models/index.js exports User
const { default: mongoose } = require("mongoose");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

/**
 * 1. authenticate
 *    - Checks for a Bearer token in Authorization header
 *    - Verifies it, looks up the user, and attaches `req.user = { _id, name, email, role }`
 *    - If anything fails, returns 401 Unauthorized
 */
async function authenticate(req, res, next) {
  try {
    // 1) Check for Bearer token
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Missing token." });
    }
    const token = auth.split(" ")[1];

    // 2) Verify JWT
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token." });
    }

    // 3) Load user
    const user = await User.findById(payload.userId).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found." });
    }

    // 4) Attach minimal user info
    req.user = {
      _id:      user._id.toString(),
      name:     user.name,
      email:    user.email,
      role:     user.role,
      schoolId: user.schoolId?.toString() || null
    };

    // 5) Super-admins bypass all school checks
    if (req.user.role === "super_admin") {
      return next();
    }

    // 6) See if the request actually supplied a schoolId
    const schoolId =
      req.params?.schoolId ||
      req.body?.schoolId  ||
      req.query?.schoolId;

    // 7) If no schoolId, skip school-activation logic entirely
    if (!schoolId) {
      return next();
    }

    // 8) Validate the provided schoolId
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid schoolId." });
    }

    // 9) Ensure the schoolId matches the user’s own school
    if (req.user.schoolId !== schoolId) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized school access." });
    }

    // 10) Load the School and check isActive
    const school = await School.findById(schoolId).select("isActive");
    if (!school) {
      return res
        .status(404)
        .json({ success: false, message: "School not found." });
    }
    if (!school.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "This school is inactive." });
    }

    // 11) All checks passed
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
}

/**
 * 2. isAdmin
 *    - Ensures req.user.role === 'school_admin'
 *    - Otherwise returns 403 Forbidden
 */
function isAdmin(req, res, next) {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }
  if (req.user.role !== "school_admin") {
    return res
      .status(403)
      .json({ success: false, message: "Admin role required." });
  }
  next();
}

/**
 * 3. isTeacher
 *    - Ensures req.user.role === 'teacher'
 */
function isTeacher(req, res, next) {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ success: false, message: "Teacher role required." });
  }
  next();
}

/**
 * 4. isStudent
 *    - Ensures req.user.role === 'student'
 */
function isStudent(req, res, next) {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }
  if (req.user.role !== "student") {
    return res
      .status(403)
      .json({ success: false, message: "Student role required." });
  }
  next();
}

/**
 * 5. isParent
 *    - Ensures req.user.role === 'parent'
 */
function isParent(req, res, next) {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }
  if (req.user.role !== "parent") {
    return res
      .status(403)
      .json({ success: false, message: "Parent role required." });
  }
  next();
}
/**
 * 6. superAdminAuth
 *    - Checks for a secret key in req.body.secretKey
 *    - If it doesn't match the environment variable, returns 403 Forbidden
 */
function superAdminAuth(req, res, next) {
  if (req.body.secretKey !== process.env.SUPER_ADMIN_SECRET_KEY) {
    return res
      .status(403)
      .json({ success: false, message: "Super admin role required." });
  }
  next();
}

module.exports = {
  authenticate,
  isAdmin,
  isTeacher,
  isStudent,
  isParent,
  superAdminAuth,
  isSuperAdminAuth,
};
