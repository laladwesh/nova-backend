// middleware/authMiddleware.js


 function isSuperAdminAuth(req, res, next) {
  if (req.user.role !== 'super_admin') {
    return res
      .status(403)
      .json({ success: false, message: 'Super admin role required.' });
  }
  next();
}


const jwt = require("jsonwebtoken");
const { User } = require("../models"); // assumes models/index.js exports User
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

/**
 * 1. authenticate
 *    - Checks for a Bearer token in Authorization header
 *    - Verifies it, looks up the user, and attaches `req.user = { _id, name, email, role }`
 *    - If anything fails, returns 401 Unauthorized
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    // console.log("Auth Header:", authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Missing or invalid Authorization header.",
        });
    }

    const token = authHeader.split(" ")[1];
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token." });
    }

    // payload should contain at least { userId, iat, exp }
    const user = await User.findById(payload.userId).select("-password");
    
    // console.log("Authenticated User:", user);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found." });
    }
    
    // Check for schoolId in either body or query parameters
    const schoolIdToCheck = req.query.schoolId;
    
    // Only perform the school check if a schoolId was provided and user has schoolId
    if (schoolIdToCheck && user.schoolId) {
      try {
        // Using toString() for safer comparison
        const userSchoolId = user.schoolId.toString();
        const requestSchoolId = schoolIdToCheck.toString();
        
        if (userSchoolId !== requestSchoolId) {
          return res
            .status(401)
            .json({ success: false, message: "Unauthorized access to this school." });
        }
      } catch (err) {
        console.error("Error comparing school IDs:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error validating school access." });
      }
    }

    // Attach minimal user info to req.user
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    // console.log("Request User:", req.user);
    next();
  } catch (err) {
    console.error("Error in authenticate middleware:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
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
  isSuperAdminAuth
};