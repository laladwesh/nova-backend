/**
 * routes/userRoutes.js
 *
 * Defines HTTP endpoints related to user profile management and role administration.
 * Applies authentication and admin-only authorization where required.
 */
const express = require("express");
const router = express.Router();

// Middleware to verify authentication and admin role
const { authenticate, isAdmin } = require("../middleware/authMiddleware");
// Controller with business logic for user operations
const userController = require("../controllers/userController");

///////////////////////////
// Profile Endpoints
///////////////////////////

/**
 * GET '/me'
 *  - Fetch the profile of the currently authenticated user
 *  - Accessible by any logged-in user (student, teacher, parent, admin)
 */
router.get(
  "/me",
  authenticate,            // Ensure the request has a valid auth token
  userController.getProfile // Handler returns user profile from req.user
);

/**
 * PUT '/me'
 *  - Update the profile information of the current user
 *  - Accessible by any authenticated user
 */
router.put(
  "/me",
  authenticate,            // Only logged-in users
  userController.updateProfile // Handler updates profile fields in database
);

/**
 * PUT '/me/password'
 *  - Change the password for the current user
 *  - Accessible by any authenticated user
 */
router.put(
  "/me/password",
  authenticate,            // Only logged-in users
  userController.changePassword // Handler verifies old password and sets new one
);

///////////////////////////
// Role Management (Admin Only)
///////////////////////////

/**
 * GET '/roles'
 *  - List all user roles available in the system
 *  - Only Admin users may access
 */
router.get(
  "/roles",
  authenticate, // Must be logged in
  isAdmin,      // Must have admin privileges
  userController.listRoles // Handler returns list of roles
);

/**
 * GET '/:userId/role'
 *  - Fetch the current role of a specific user by ID
 *  - Only Admin users may access
 */
router.get(
  "/:userId/role",
  authenticate, // Must be logged in
  isAdmin,      // Must be admin
  userController.getUserRole // Handler retrieves role for given userId
);

/**
 * PUT '/:userId/role'
 *  - Update or assign a new role to a specific user by ID
 *  - Only Admin users may perform this action
 */
router.put(
  "/:userId/role",
  authenticate, // Must be logged in
  isAdmin,      // Must be admin
  userController.setUserRole // Handler sets the role in the database
);

// Export configured router to mount in main application
module.exports = router;
