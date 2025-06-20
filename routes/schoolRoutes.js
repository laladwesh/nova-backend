// routes/schoolRoutes.js
const express = require("express");
const router = express.Router();

const schoolController = require("../controllers/schoolController");
const {
  authenticate,
  isAdmin,
  superAdminAuth,
  isSuperAdminAuth,
} = require("../middleware/authMiddleware");
// ← You’ll only need protect/authorize if you want to restrict who can create/list schools.
// For instance, maybe only a super‐admin can create a School.

function isSchoolAdminorSuperAdmin(req, res, next) {
  const role = req.user.role;
  if (role === "school_admin" || role === "super_admin") {
    return next();
  }
  return res
    .status(403)
    .json({
      message: "Forbidden: You do not have permission to access this resource.",
    });
}

router.get("/", authenticate, schoolController.listSchools);
router.get(
  "/:id",
  authenticate,
  isSchoolAdminorSuperAdmin,
  schoolController.getSchoolWithFullDetails
);

router.post("/", authenticate, isSuperAdminAuth, schoolController.createSchool);

module.exports = router;
