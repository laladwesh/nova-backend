/**
 * routes/authRoutes.js
 *
 * Defines public and protected authentication-related endpoints.
 * Handles signup, login, token refresh, password reset, and logout.
 */
const express = require("express");
const router = express.Router();

// Middleware to verify access token for protected routes
const {
  authenticate,
  isSuperAdminAuth,
} = require("../middleware/authMiddleware");
// Controller with business logic for authentication operations
const authController = require("../controllers/authController");

///////////////////////////
// Public Authentication Endpoints
///////////////////////////

/**
 * POST '/signup'
 *  - Register a new user account
 *  - Expects user details (e.g., name, email, password) in request body
 *  - Returns success message or validation errors
 */
router.post(
  "/signup",
  authController.signup // Handler creates user and sends confirmation
);

/**
 * POST '/login'
 *  - Authenticate a user and issue tokens
 *  - Expects credentials (email/username and password) in request body
 *  - Returns access token and refresh token on success
 */
router.post(
  "/login",
  authController.login // Handler verifies credentials and issues tokens
);

/**
 * POST '/refresh'
 *  - Refresh the access token using a valid refresh token
 *  - Expects refresh token in request body or cookies
 *  - Returns new access token
 */
router.post(
  "/refresh",
  authController.refresh // Handler validates refresh token and issues new access token
);

router.get(
  "/reset-password/:token",
  authController.renderResetPasswordForm // Handler verifies email using token from signup or reset
);

/**
 * POST '/forgot-password'
 *  - Initiate password reset flow for a user
 *  - Expects user email in request body
 *  - Sends password reset link or code to registered email
 */
router.post(
  "/forgot-password",
  authController.forgotPassword // Handler sends reset instructions via email
);

/**
 * POST '/reset-password'
 *  - Complete password reset using token/code
 *  - Expects reset token and new password in request body
 *  - Updates user password after validating token
 */
router.post(
  "/reset-password",
  authController.resetPassword // Handler verifies reset token and updates password
);

///////////////////////////
// Protected Authentication Endpoint
///////////////////////////

/**
 * POST '/logout'
 *  - Invalidate current user's access and/or refresh tokens
 *  - Protected route: requires valid access token
 *  - Clears tokens (e.g., via blacklist or cookie removal)
 */
router.post(
  "/logout",
  authenticate, // Require valid access token
  authController.logout // Handler invalidates tokens and ends session
);

router.patch(
  "/school/:schoolId",
  authenticate,
  isSuperAdminAuth,
  authController.toggleSchoolActive
);
// Export configured router to mount in main application
module.exports = router;
