const express = require("express");
const router = express.Router();

function superAdminoradminAuth(req, res, next) {
  const { role } = req.user;
  if (role === "super_admin" || role === "school_admin") {
    return next();
  }
  return res
    .status(403)
    .json({ success: false, message: "Not authorized to access this resource." });
}


// Middleware to verify authentication and admin role
const {
  authenticate,
} = require("../middleware/authMiddleware");

router.get(
  "/:id",
  authenticate,
  superAdminoradminAuth,
  require("../controllers/parentController").getParentWithFullDetails
);
router.put(
  "/:id",
  authenticate,
   superAdminoradminAuth,
  require("../controllers/parentController").updateParent
);

router.delete(
  "/:id",
  authenticate,
  superAdminoradminAuth,
  require("../controllers/parentController").deleteParent
);

module.exports = router;