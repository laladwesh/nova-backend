// routes/userRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate, isAdmin } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

/**
 * 1. GET '/me' – get current user’s profile
 *    – Any authenticated user (student, teacher, parent, admin) may view their own profile.
 */
router.get("/me", authenticate, userController.getProfile);

/**
 * 2. PUT '/me' – update current user’s profile
 *    – Any authenticated user may update their own profile.
 */
router.put("/me", authenticate, userController.updateProfile);

/**
 * 3. PUT '/me/password' – change current user’s password
 *    – Any authenticated user may change their own password.
 */
router.put("/me/password", authenticate, userController.changePassword);

///////////////////////////
// Role management (admin-only)
///////////////////////////

/**
 * 4. GET '/roles' – list all available roles
 *    – Only Admin may list roles.
 */
router.get("/roles", authenticate, isAdmin, userController.listRoles);

/**
 * 5. GET '/:userId/role' – get a specific user’s role
 *    – Only Admin may view another user’s role.
 */
router.get("/:userId/role", authenticate, isAdmin, userController.getUserRole);

/**
 * 6. PUT '/:userId/role' – set a specific user’s role
 *    – Only Admin may update a user’s role.
 */
router.put("/:userId/role", authenticate, isAdmin, userController.setUserRole);

module.exports = router;
// /**
//  * 7. DELETE '/:userId/role' – remove a user’s role
//  *    – Only Admin may remove a user’s role.
//  */
// router.delete(
//   '/:userId/role',
//   authenticate,
//   isAdmin,
//   userController.removeUserRole
// );
