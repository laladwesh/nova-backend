// routes/schoolRoutes.js
const express = require("express");
const router = express.Router();

const schoolController = require("../controllers/schoolController");
const { authenticate, isAdmin , superAdminAuth, isSuperAdminAuth } = require("../middleware/authMiddleware");
// ← You’ll only need protect/authorize if you want to restrict who can create/list schools.
// For instance, maybe only a super‐admin can create a School.

router.get("/", authenticate ,schoolController.listSchools);
router.get('/:id',    authenticate, isSuperAdminAuth ,schoolController.getSchoolWithFullDetails);

router.post(
  "/",
   authenticate,
   isSuperAdminAuth,
  schoolController.createSchool
);

module.exports = router;