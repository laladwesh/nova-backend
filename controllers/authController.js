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
      gender,
      dob,
      phone, // ← add this
      address,
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
    // Normalize gender to Title Case so it matches your schema
    let normalizedGender;
    if (gender) {
      const g = gender.trim().toLowerCase(); // "other"
      normalizedGender = g.charAt(0).toUpperCase() + g.slice(1); // "Other"
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
      gender: normalizedGender,
      dob: dob ? new Date(dob) : null, // Add dob
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
      // 1) Create the Student record
      const studentDoc = await Student.create({
        _id: user._id, // reuse the same _id
        studentId: studentId.trim(),
        name: name.trim(),
        classId,
        gender: normalizedGender,
        dob: dob ? new Date(dob) : null,
        email: user.email,
        phone: phone?.trim(),
        address: address?.trim(),
        schoolId: schoolRecord._id,
      });

      // 2) Ensure we got at least one parent
      if (!Array.isArray(parentInputs) || parentInputs.length === 0) {
        return res.status(400).json({
          success: false,
          message: "You must supply a non-empty parents array.",
        });
      }

      // 3) Validate each parent object
      for (const [i, p] of parentInputs.entries()) {
        if (!p.name || !p.email || !p.password) {
          return res.status(400).json({
            success: false,
            message: `Each parent must include name, email, and password (error at index ${i}).`,
          });
        }
      }

      // 4) Create Parent Users & Parent docs
      const createdParentIds = [];
      for (const p of parentInputs) {
        const emailNorm = p.email.toLowerCase().trim();

        // 3a) Try to find an existing parent User
        let parentUser = await User.findOne({
          email: emailNorm,
          role: "parent",
        });
        let parentDoc;

        if (parentUser) {
          // — parent user exists: fetch or create their Parent doc
          parentDoc = await Parent.findById(parentUser._id);
          if (!parentDoc) {
            // weird edge case: create missing Parent doc
            parentDoc = await Parent.create({
              _id: parentUser._id,
              name: p.name.trim(),
              email: emailNorm,
              phone: p.phone?.trim(),
              schoolId: schoolRecord._id,
              students: [studentDoc._id],
            });
          } else {
            // add student to their students array if not already present
            if (!parentDoc.students.includes(studentDoc._id)) {
              parentDoc.students.push(studentDoc._id);
              await parentDoc.save();
            }
          }
        } else {
          // 3b) No existing parent: create both User + Parent
          const saltP = await bcrypt.genSalt(12);
          const hashedParentPwd = await bcrypt.hash(p.password.trim(), saltP);

          parentUser = await User.create({
            name: p.name.trim(),
            email: emailNorm,
            password: hashedParentPwd,
            role: "parent",
            schoolId: schoolRecord._id,
          });

          parentDoc = await Parent.create({
            _id: parentUser._id,
            name: p.name.trim(),
            email: emailNorm,
            phone: p.phone?.trim(),
            schoolId: schoolRecord._id,
            students: [studentDoc._id],
          });
        }

        createdParentIds.push(parentUser._id);
      }

      // 5) Link this student into the School
      await School.findByIdAndUpdate(
        schoolRecord._id,
        {
          $addToSet: {
            students: studentDoc._id,
            parents: { $each: createdParentIds },
          },
        },
        { new: true }
      );

      // 6) Link Parents into the Student.parents array
      studentDoc.parents = createdParentIds;
      await studentDoc.save();

      // 7) Add student to its Class
      await Class.findByIdAndUpdate(
        classId,
        { $push: { students: studentDoc._id } },
        { new: true }
      );
    }

    if (role === "teacher") {
      const teacherDoc = await Teacher.create({
        _id: user._id, // Use the same _id as User
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
          classId: user.classId,
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
    const resetUrl = `${process.env.BACKEND_URL}api/auth/reset-password/${rawToken}`;
    // Send email (implement sendEmail utility)
    const emailSubject = "Password Reset Request";
    const emailBody = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Password Reset</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f7; font-family:Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <!--[if mso]>
          <table role="presentation" width="600"><tr><td>
          <![endif]-->
          <table
            role="presentation"
            width="100%"
            max-width="600"
            cellpadding="0"
            cellspacing="0"
            style="background-color:#ffffff; border-radius:8px; overflow:hidden; margin:40px 0; box-shadow:0 2px 8px rgba(0,0,0,0.1);"
          >
            <tr>
              <td align="center" style="background-color:#3869D4; padding:30px">
                <h1 style="margin:0; color:#ffffff; font-size:24px; letter-spacing:1px;">
                  Reset Your Password
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 40px; color:#51545E; font-size:16px; line-height:1.5;">
                <p style="margin-top:0;">Hello <strong>${
                  user.name
                }</strong>,</p>
                <p>
                  You requested a password reset. Click the button below to choose a new
                  password. This link will expire in <strong>${expiresInMinutes} minutes</strong>.
                </p>
                <p style="text-align:center; margin:30px 0;">
                  <a
                    href="${resetUrl}"
                    style="
                      background-color:#22BC66;
                      color:#ffffff;
                      text-decoration:none;
                      padding:12px 24px;
                      border-radius:4px;
                      font-size:16px;
                      font-weight:bold;
                      display:inline-block;
                    "
                  >
                    Reset Password
                  </a>
                </p>
                <p style="margin-bottom:0;">
                  If you didn’t request this, just ignore this email—no changes were made.
                </p>
                <p style="margin-top:24px; color:#6B6E76; font-size:14px;">
                  Cheers,<br />
                  <em>PixelGrad Team</em>
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="background-color:#f4f4f7; padding:20px; font-size:12px; color:#A8AAAF;">
                &copy; ${new Date().getFullYear()} PixelGrad@Novamatrixz. All rights reserved.
              </td>
            </tr>
          </table>
          <!--[if mso]>
          </td></tr></table>
          <![endif]-->
        </td>
      </tr>
    </table>
  </body>
</html>
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

// controllers/authController.js

exports.renderResetPasswordForm = (req, res) => {
  const rawToken = req.params.token;
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <title>Reset Your Password</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet"/>
      <style>
        body {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: linear-gradient(135deg,rgb(0, 0, 0) 0%, #rgb(255, 255, 255)00%);
          font-family: 'Poppins', sans-serif;
        }
        .container {
          background: #ffffff;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          max-width: 360px;
          width: 100%;
        }
        h1 {
          margin: 0 0 1.5rem;
          font-size: 1.5rem;
          text-align: center;
          color: #333333;
        }
        .form-group {
          margin-bottom: 1.25rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #555555;
          font-size: 0.9rem;
        }
        input[type="password"] {
          width: 92%;
          padding: 0.75rem;
          border: 1px solid #CCCCCC;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        input[type="password"]:focus {
          outline: none;
          border-color: #6B73FF;
          box-shadow: 0 0 0 3px rgba(107,115,255,0.2);
        }
        .btn {
          width: 100%;
          padding: 0.75rem;
          background-color: #6B73FF;
          color: #ffffff;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .btn:hover {
          background-color: #5A62E0;
        }
        .footer {
          margin-top: 1rem;
          text-align: center;
          font-size: 0.85rem;
        }
        .footer a {
          color: #6B73FF;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome PixelGrad User Reset Your Password</h1>
        <form method="POST" action="/api/auth/reset-password">
          <input type="hidden" name="token" value="${rawToken}" />
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input id="newPassword" type="password" name="newPassword" placeholder="••••••••" required />
          </div>
          <button type="submit" class="btn">Reset Password</button>
        </form>
      </div>
    </body>
    </html>
  `);
};

// PATCH /api/auth/school/:schoolId
exports.toggleSchoolActive = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const school = await School.findById(schoolId);
    if (!school) {
      return res
        .status(404)
        .json({ success: false, message: "School not found." });
    }
    school.isActive = !school.isActive;
    await school.save();
    return res.json({
      success: true,
      data: { school },
      message: `School is now ${school.isActive ? "active" : "inactive"}.`,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

/**
 * POST /auth/bulk-upload
 * Creates many teachers & students from an array of row-objects.
 * Each row must have at least: name, email, password, role.
 * If role === 'student', must also include studentId & classId.
 */
// controllers/authController.js

// controllers/authController.js

exports.bulkSignup = async (req, res) => {
  const { rows = [], schoolId } = req.body;
  let successCount = 0;
  const failures = [];

  // 1) Verify school exists
  const schoolRecord = await School.findById(schoolId);
  if (!schoolRecord) {
    return res.status(404).json({ success: false, message: "Invalid schoolId." });
  }

  // 2) Loop through each row
  for (const [idx, row] of rows.entries()) {
    try {
      const {
        name,
        email,
        password,
        role,
        gender,
        dob,
        phone,
        address,
        studentId,
        classId,
        parents,           // raw value from Excel
      } = row;

      // Basic validation
      if (!name || !email || !password || !role) {
        throw new Error("Missing name, email, password or role");
      }
      if (!["teacher", "student"].includes(role)) {
        throw new Error("Role must be 'teacher' or 'student'");
      }
      if (role === "student" && (!studentId || !classId)) {
        throw new Error("studentId and classId required for student");
      }

      // Unique email check
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        throw new Error("Email already in use");
      }

      // Hash password
      const salt   = await bcrypt.genSalt(12);
      const hashed = await bcrypt.hash(password.trim(), salt);

      // Create the User
      const newUser = await User.create({
        name:      name.trim(),
        email:     email.toLowerCase().trim(),
        password:  hashed,
        role,
        schoolId:  schoolRecord._id,
        gender:    gender?.trim(),
        dob:       dob ? new Date(dob) : undefined,
        phone:     phone?.trim(),
        address:   address?.trim(),
        ...(role === "student" && { studentId: studentId.trim(), classId })
      });

      // Teacher wiring
      if (role === "teacher") {
        await Teacher.create({
          _id:       newUser._id,
          teacherId: crypto.randomBytes(4).toString("hex"),
          name:      newUser.name,
          email:     newUser.email,
          schoolId:  schoolRecord._id,
        });
        await School.findByIdAndUpdate(schoolRecord._id, { $push: { teachers: newUser._id } });
      } else {
        // STUDENT wiring

        // 2a) parse parents JSON if needed
        let parentInputs = parents;
        if (typeof parentInputs === "string") {
          try {
            parentInputs = JSON.parse(parentInputs);
          } catch {
            parentInputs = [];
          }
        }

        // 2b) ensure at least one parent
        if (!Array.isArray(parentInputs) || parentInputs.length === 0) {
          throw new Error("Must supply parents array for student");
        }

        // 3) Create the Student record
        const studentDoc = await Student.create({
          _id:       newUser._id,
          studentId: studentId.trim(),
          name:      newUser.name,
          classId,
          gender:    gender?.trim(),
          dob:       dob ? new Date(dob) : undefined,
          email:     newUser.email,
          phone:     phone?.trim(),
          address:   address?.trim(),
          schoolId:  schoolRecord._id,
        });

        // 4) For each parent, either find-or-create User + Parent doc
        const createdParentIds = [];
        for (const p of parentInputs) {
          if (!p.name || !p.email || !p.password) {
            throw new Error("Each parent needs name, email, and password");
          }
          const parentEmail = p.email.toLowerCase().trim();
          let parentUser = await User.findOne({ email: parentEmail, role: "parent" });
          let parentDoc;

          if (parentUser) {
            parentDoc = await Parent.findById(parentUser._id);
            if (!parentDoc) {
              parentDoc = await Parent.create({
                _id:       parentUser._id,
                name:      p.name.trim(),
                email:     parentEmail,
                phone:     p.phone?.trim(),
                schoolId:  schoolRecord._id,
                students:  [studentDoc._id],
              });
            } else if (!parentDoc.students.includes(studentDoc._id)) {
              parentDoc.students.push(studentDoc._id);
              await parentDoc.save();
            }
          } else {
            const saltP       = await bcrypt.genSalt(12);
            const hashedP     = await bcrypt.hash(p.password.trim(), saltP);
            parentUser = await User.create({
              name:     p.name.trim(),
              email:    parentEmail,
              password: hashedP,
              role:     "parent",
              schoolId: schoolRecord._id,
            });
            parentDoc = await Parent.create({
              _id:       parentUser._id,
              name:      p.name.trim(),
              email:     parentEmail,
              phone:     p.phone?.trim(),
              schoolId:  schoolRecord._id,
              students:  [studentDoc._id],
            });
          }
          createdParentIds.push(parentUser._id);
        }

        // 5) Link student & parents into School
        await School.findByIdAndUpdate(schoolRecord._id, {
          $addToSet: {
            students: studentDoc._id,
            parents:  { $each: createdParentIds }
          }
        });

        // 6) Attach parents list to Student and save
        studentDoc.parents = createdParentIds;
        await studentDoc.save();

        // 7) Add student to Class
        await Class.findByIdAndUpdate(classId, { $push: { students: studentDoc._id } });
      }

      successCount++;
    } catch (err) {
      failures.push({ row: idx, error: err.message });
    }
  }

  // 3) Return final report
  return res.status(200).json({
    success:      true,
    successCount,
    failures
  });
};
