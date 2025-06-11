// routes/schoolRoutes.js
const express = require("express");
const router = express.Router();

const schoolController = require("../controllers/schoolController");
const { authenticate, isAdmin , superAdminAuth } = require("../middleware/authMiddleware");
// ← You’ll only need protect/authorize if you want to restrict who can create/list schools.
// For instance, maybe only a super‐admin can create a School.

router.get("/", schoolController.listSchools);

router.post(
  "/",
  superAdminAuth,
  //  authenticate,
  //  isAdmin,
  schoolController.createSchool
);

// Optional: GET /schools to list them
// router.get('/', protect, authorize('super_admin'), schoolController.listSchools);

module.exports = router;
