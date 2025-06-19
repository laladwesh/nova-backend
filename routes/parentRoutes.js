const express = require("express");
const router = express.Router();

// Middleware to verify authentication and admin role
const {
  authenticate,
  isAdmin,
  isSuperAdminAuth,
} = require("../middleware/authMiddleware");

router.get(
  "/:id",
  authenticate,
  isSuperAdminAuth,
  require("../controllers/parentController").getParentWithFullDetails
);
router.put(
  "/:id",
  authenticate,
  isSuperAdminAuth,
  require("../controllers/parentController").updateParent
);

module.exports = router;