// routes/storyRoutes.js
const express = require("express");
const router  = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const storyController = require("../controllers/storyController");

// 1. POST /api/stories – teacher/admin only
router.post(
  "/",
  authenticate,
  storyController.createStory
);

// 2. GET /api/stories – any authenticated user
router.get(
  "/",
  authenticate,
  storyController.getStories
);

module.exports = router;