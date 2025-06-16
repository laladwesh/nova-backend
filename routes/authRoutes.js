// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const authController = require("../controllers/authController");

// Public auth routes
router.post("/signup", authController.signup);

router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Protected logout route (user must supply a valid access token)
router.post("/logout", authenticate, authController.logout);

module.exports = router;