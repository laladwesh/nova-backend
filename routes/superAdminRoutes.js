// routes/storyRoutes.js
const express = require("express");
const router  = express.Router();
const { isSuperAdminAuth, authenticate } = require("../middleware/authMiddleware");
const storyController = require("../controllers/storyController");

// router.post(
//   "/",
//   authenticate,
//   storyController.createStory
// );

// router.get(
//   "/",
//   authenticate,
//   storyController.getStories
// );
router.post('/', authenticate, isSuperAdminAuth, (req, res) => {
  // super-admin–only logic here
  console.log('Super Admin Accessed'  , req.user.role);
  res.json({ success: true, message: 'Welcome, Super Admin!' });
});

router.get('/', (req, res) => {
  // school-admin logic here
  res.json({ success: true, message: 'Welcome, School Admin!' });
});

module.exports = router;