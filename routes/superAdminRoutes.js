// routes/storyRoutes.js
const express = require("express");
const router  = express.Router();
const { isSuperAdminAuth, authenticate } = require("../middleware/authMiddleware");
const storyController = require("../controllers/storyController");
const sendEmail = require("../utils/sendEmail");
require("dotenv").config();
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
router.post('/', authenticate, isSuperAdminAuth, async (req, res) => {
  console.log('Super Admin Accessed', req.user.role);

  // 1) get the list of recipients from env (comma-separated)
 let recipients = [];
  try {
    recipients = JSON.parse(process.env.REACT_APP_SUPER_ADMIN_EMAILS);
    if (!Array.isArray(recipients)) {
      throw new Error('Not an array');
    }
  } catch (err) {
    // fallback to comma-split if parsing fails
    recipients = (process.env.REACT_APP_SUPER_ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, ''))
      .filter(Boolean);
  }

  // 2) build a subject + html body
  const subject = "🔔 Super Admin Route Accessed";
const html = `
  <div style="
    font-family: Arial, sans-serif;
    background: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    color: #333;
    max-width: 600px;
    margin: auto;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  ">
    <h2 style="
      color: #2A73CC;
      text-align: center;
      margin-bottom: 20px;
    ">
      🚨 Super Admin Route Accessed
    </h2>

    <p>Hello <strong>Super Admin</strong>,</p>

    <p style="margin-bottom: 10px;">
      The <code>/</code> endpoint was just hit by:
    </p>

    <ul style="
      list-style: none;
      padding: 0;
      margin: 0 0 20px;
    ">
      <li style="margin-bottom: 5px;">
        <strong>Email:</strong> ${req.user.email}
      </li>
      <li style="margin-bottom: 5px;">
        <strong>User ID:</strong> ${req.user._id}
      </li>
      <li style="margin-bottom: 5px;">
        <strong>Time:</strong> ${new Date().toLocaleString()}
      </li>
    </ul>

    <p style="
      font-size: 0.9em;
      color: #555;
      margin-bottom: 20px;
    ">
      If this wasn’t you, please investigate immediately.
    </p>

    <hr style="
      border: none;
      border-top: 1px solid #eee;
      margin: 20px 0;
    " />

    <p style="
      text-align: center;
      font-size: 0.8em;
      color: #999;
    ">
      &copy; ${new Date().getFullYear()} Novamatrixz, PixelGrid. All rights reserved.
    </p>
  </div>
`;


  // 3) send to all, in parallel
  try {
    await Promise.all(
      recipients.map((to) => sendEmail({ to, subject, html }))
    );
    return res.json({
      success: true,
      message: "Welcome, Super Admin! Notifications emailed.",
    });
  } catch (err) {
    console.error("Error sending super‐admin emails:", err);
    // still return 200, but let client know about email failure
    return res.json({
      success: true,
      message: "Welcome, Super Admin! (but failed to send notifications)",
    });
  }
});


router.get('/', (req, res) => {
  // school-admin logic here
  res.json({ success: true, message: 'Welcome, School Admin!' });
});

module.exports = router;