// controllers/authController.js

/**
 * Production‐level Auth Controller using:
 *  - bcryptjs for password hashing
 *  - jsonwebtoken for JWT creation/verification
 *  - crypto for secure token generation
 *  - Mongoose models: User, RefreshToken, PasswordResetToken
 *  - nodemailer (or any email service) to send reset emails
 *
 * ENV VARIABLES REQUIRED:
 *  - JWT_SECRET: secret key for signing access tokens
 *  - JWT_EXPIRES_IN: e.g. "15m"
 *  - REFRESH_TOKEN_SECRET: (optional) if you choose to sign refresh tokens
 *  - REFRESH_TOKEN_EXPIRES_IN: e.g. "7d"
 *  - RESET_PASSWORD_TOKEN_EXPIRES_IN: number of minutes, e.g. 60
 *  - EMAIL_FROM: “no-reply@yourdomain.com”
 *  - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (for sending emails)
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  User,
  RefreshToken,
  PasswordResetToken,
  School,
  Student,
  Class,
  Teacher,
  Parent,
} = require("../models");
const sendEmail = require("../utils/sendEmail"); // implement a sendEmail utility with nodemailer or similar

// Helper: generate Access Token (short‐lived)
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET
  );
}

// Helper: generate & store Refresh Token (long‐lived)
async function generateRefreshToken(user) {
  // Create a strong random token
  const token = crypto.randomBytes(40).toString("hex");
  // Calculate expiry (e.g., 7 days from now)
  const expires = new Date(
    Date.now() +
      (parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN, 10) ||
        7 * 24 * 60 * 60 * 1000)
  );
  // Save to DB
  const rt = await RefreshToken.create({
    user: user._id,
    token,
    expires,
  });
  return rt.token;
}

// @route   POST /auth/signup
// @desc    Register a new user
// @access  Public
exports.signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      studentId,
      classId,
      schoolId,
      secretKey,
      parents: parentInputs = [],
    } = req.body;

    // 1) Required fields
    if (!name || !email || !password || !role || !schoolId) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, role, and schoolId are required.",
      });
    }

    // 2) School must exist
    const schoolRecord = await School.findById(schoolId);
    if (!schoolRecord) {
      return res.status(404).json({
        success: false,
        message: "Invalid schoolId. School not found.",
      });
    }

    // 3) If creating a school_admin, check secretKey now
    if (
      role === "school_admin" &&
      secretKey !== process.env.SUPER_ADMIN_SECRET_KEY
    ) {
      return res.status(403).json({
        success: false,
        message: "Super admin role required.",
      });
    }

    // 4) If student, ensure studentId + classId
    if (role === "student" && (!studentId || !classId)) {
      return res.status(400).json({
        success: false,
        message: 'studentId and classId are required when role is "student".',
      });
    }

    // 5) Email must be unique **before** we write anything
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already in use.",
      });
    }

    // 6) Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password.trim(), salt);

    // 7) Build and create the single User record
    const newUserData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      schoolId: schoolRecord._id,
    };
    if (role === "student") {
      newUserData.studentId = studentId.trim();
      newUserData.classId = classId;
    }

    const user = await User.create(newUserData);

    // ───────── Role-specific wiring ────────────────────────────────────
    if (role === "school_admin") {
      // just push the new User’s _id into School.admins
      await School.findByIdAndUpdate(
        schoolRecord._id,
        { $push: { admins: user._id } },
        { new: true }
      );
    }

// inside exports.signup, replace your existing `if (role === "student") { … }` with:

if (role === "student") {
  // 1) Create the Student
  const studentDoc = await Student.create({
    _id:       user._id,
    studentId: studentId.trim(),
    name:      name.trim(),
    classId,
    email:     user.email,
    schoolId:  schoolRecord._id,
  });

  // 2) Validate parentInputs items
  if (!Array.isArray(parentInputs) || parentInputs.length === 0) {
    return res.status(400).json({
      success: false,
      message: "You must supply a non-empty parents array.",
    });
  }
  for (const [i, p] of parentInputs.entries()) {
    if (!p.name || !p.email || !p.password) {
      return res.status(400).json({
        success: false,
        message: `Each parent must include name, email, and password (error in parent index ${i}).`,
      });
    }
  }

  // 3) Create Parent Users & Parent docs
  const createdParentIds = [];
  for (const p of parentInputs) {
    // 3a) Hash parent password
    const saltP = await bcrypt.genSalt(12);
    const hashedParentPwd = await bcrypt.hash(p.password.trim(), saltP);

    // 3b) Create User record for parent
    const parentUser = await User.create({
      name:     p.name.trim(),
      email:    p.email.toLowerCase().trim(),
      password: hashedParentPwd,
      role:     "parent",
      schoolId: schoolRecord._id,
    });

    // 3c) Create Parent doc with same _id
    const parentDoc = await Parent.create({
      _id:      parentUser._id,
      name:     p.name.trim(),
      email:    p.email.toLowerCase().trim(),
      phone:    p.phone?.trim(),
      schoolId: schoolRecord._id,
      students: [studentDoc._id],
    });

    // 3d) Push into School.parents
    await School.findByIdAndUpdate(
      schoolRecord._id,
      { $push: { parents: parentUser._id } },
      { new: true }
    );

    createdParentIds.push(parentUser._id);
  }

  // 4) Link Parents into Student.parents array
  studentDoc.parents = createdParentIds;
  await studentDoc.save();

  // 5) Link the Student into its Class
  await Class.findByIdAndUpdate(
    classId,
    { $push: { students: studentDoc._id } },
    { new: true }
  );
}




    if (role === "teacher") {
      const teacherDoc = await Teacher.create({
        _id:user._id, // Use the same _id as User
        teacherId: crypto.randomBytes(4).toString("hex"),
        name: name.trim(),
        email: user.email,
        schoolId: schoolRecord._id,
      });
      await School.findByIdAndUpdate(
        schoolRecord._id,
        { $push: { teachers: user._id } },
        { new: true }
      );
    }


    // 8) Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    // 9) Respond
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
          ...(user.role === "student" && {
            studentId: user.studentId,
            classId: user.classId,
          }),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (err) {
    console.error("AuthController.signup error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// @route   POST /auth/login
// @desc    Authenticate user and return tokens
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }
    console.log("Login attempt for email:", email.toLowerCase().trim());
    const user = await User.findOne({ email: email });
    // Check if user exists
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "email issue Invalid credentials." });
    }
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (err) {
    console.error("AuthController.login error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

// @route   POST /auth/logout
// @desc    Invalidate a refresh token (logout)
// @access  Public (token passed in body or cookie)
exports.logout = async (req, res) => {
  try {
    // Expecting refreshToken in body
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token is required." });
    }

    // Delete RefreshToken document
    const deleted = await RefreshToken.findOneAndDelete({
      token: refreshToken,
    });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Refresh token not found or already invalidated.",
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully." });
  } catch (err) {
    console.error("AuthController.logout error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

// @route   POST /auth/refresh
// @desc    Issue a new access token given a valid refresh token
// @access  Public (token passed in body)
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token is required." });
    }

    // Find token in DB
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token." });
    }

    // Check expiry
    if (storedToken.expires < Date.now()) {
      // Token expired → remove it
      await RefreshToken.findByIdAndDelete(storedToken._id);
      return res
        .status(401)
        .json({ success: false, message: "Refresh token expired." });
    }

    // Get user and issue new access token
    const user = await User.findById(storedToken.user);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const newAccessToken = generateAccessToken(user);
    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully.",
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    console.error("AuthController.refresh error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

// @route   POST /auth/forgot-password
// @desc    Generate a password reset token and email it to the user
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security, do not reveal that email does not exist
      return res.status(200).json({
        success: true,
        message: "If that email is registered, a reset link has been sent.",
      });
    }

    // Generate a one-time reset token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiresInMinutes =
      parseInt(process.env.RESET_PASSWORD_TOKEN_EXPIRES_IN, 10) || 60;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Save to PasswordResetToken collection (delete any existing token for that user first)
    await PasswordResetToken.findOneAndDelete({ user: user._id });
    await PasswordResetToken.create({
      user: user._id,
      tokenHash: hashedToken,
      expiresAt,
    });

    // Construct reset URL (e.g., FRONTEND_URL + '/reset-password/' + rawToken)
    const resetUrl = `${process.env.BACKEND_URL}/auth/reset-password/${rawToken}`;
    // Send email (implement sendEmail utility)
    const emailSubject = "Password Reset Request";
    const emailBody = `
      <p>Hello ${user.name},</p>
      <p>You requested a password reset. Click the link below to reset your password (expires in ${expiresInMinutes} minutes):</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you did not request this, please ignore.</p>
    `;
    await sendEmail({
      to: user.email,
      subject: emailSubject,
      html: emailBody,
      from: process.env.EMAIL_FROM,
    });

    return res.status(200).json({
      success: true,
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (err) {
    console.error("AuthController.forgotPassword error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

// @route   POST /auth/reset-password
// @desc    Reset a user’s password given a valid reset token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required.",
      });
    }

    // Hash incoming token and find matching record
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const resetRecord = await PasswordResetToken.findOne({
      tokenHash: hashedToken,
    });
    if (!resetRecord) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token." });
    }

    if (resetRecord.expiresAt < Date.now()) {
      // Token expired
      await PasswordResetToken.findByIdAndDelete(resetRecord._id);
      return res
        .status(400)
        .json({ success: false, message: "Reset token has expired." });
    }

    // Find user and update password
    const user = await User.findById(resetRecord.user);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Delete reset token record so it cannot be reused
    await PasswordResetToken.findByIdAndDelete(resetRecord._id);

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (err) {
    console.error("AuthController.resetPassword error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

exports.renderResetPasswordForm = (req, res) => {
  const rawToken = req.params.token;
  // You might optionally verify that a hashed version exists and isn't expired:
  // const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  // const resetRecord = await PasswordResetToken.findOne({ token: hashedToken });
  //
  // If invalid, show an error page.

  // Serve a simple HTML page with a form:
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Reset Your Password</title>
    </head>
    <body>
      <h1>Reset Your Password</h1>
      <form method="POST" action="/auth/reset-password">
        <input type="hidden" name="token" value="${rawToken}" />
        <div>
          <label>New Password:</label>
          <input type="password" name="newPassword" required />
        </div>
        <button type="submit">Reset Password</button>
      </form>
    </body>
    </html>
  `);
};
