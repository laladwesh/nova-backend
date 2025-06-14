const express = require("express");
const router  = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const gradeController  = require("../controllers/gradeController");

// Admin-only upsert
router.post(
  "/",
  authenticate,
  (req, res, next) => {
    if (req.user.role !== "school_admin") {
      return res.status(403).json({ success: false, message: "Admin role required." });
    }
    next();
  },
  gradeController.createOrUpdateGrades
);

// View by class+subject
router.get("/", authenticate, gradeController.listByClassSubject);

// View by student
router.get("/student/:studentId", authenticate, gradeController.listByStudent);

module.exports = router;
