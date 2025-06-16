// routes/storyRoutes.js
const express = require("express");
const router  = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const storyController = require("../controllers/storyController");

router.post(
  "/",
  authenticate,
  storyController.createStory
);

router.get(
  "/",
  authenticate,
  storyController.getStories
);

module.exports = router;