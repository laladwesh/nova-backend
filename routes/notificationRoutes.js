// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();

const {
  authenticate,
  isAdmin,
  isTeacher,
  isParent,
} = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notificationController");

/**
 * Helper inline to allow Teacher OR Admin for listing school‐wide notifications
 */
function canViewSchoolNotifications(req, res, next) {
  const role = req.user.role;
  if (role === "teacher" || role === "school_admin") {
    return next();
  }
  return res
    .status(403)
    .json({ success: false, message: "Teacher or Admin role required." });
}

///////////////////////////
// School‐wide notifications
///////////////////////////

/**
 * 1. GET '/' – list all school‐wide notifications
 *    – Only Teacher or Admin can view.
 */
router.get(
  "/",
  authenticate,
  canViewSchoolNotifications,
  notificationController.listNotifications
);

/**
 * 2. POST '/' – create a school‐wide notification
 *    – Only Admin can create.
 */
router.post(
  "/",
  authenticate,
  isAdmin,
  notificationController.createNotification
);

/**
 * 3. DELETE '/:notificationId' – delete a school‐wide notification
 *    – Only Admin can delete.
 */
router.delete(
  "/:notificationId",
  authenticate,
  isAdmin,
  notificationController.deleteNotification
);

///////////////////////////
// Teacher‐specific notifications
///////////////////////////

/**
 * 4. GET '/teacher/:teacherId' – list notifications for a specific teacher
 *    – The teacher themself or an Admin may view.
 */
router.get(
  "/teacher/:teacherId",
  authenticate,
  (req, res, next) => {
    const { teacherId } = req.params;
    const { _id, role } = req.user;
    if (
      role === "school_admin" ||
      (_id.toString() === teacherId && role === "teacher")
    ) {
      return next();
    }
    return res
      .status(403)
      .json({
        success: false,
        message: "Only that teacher or Admin may view these notifications.",
      });
  },
  notificationController.listTeacherNotifications
);

/**
 * 5. POST '/teacher/:teacherId' – create a notification for a specific teacher
 *    – Only Admin can create teacher‐specific notifications.
 */
router.post(
  "/teacher/:teacherId",
  authenticate,
  isAdmin,
  notificationController.createTeacherNotification
);

///////////////////////////
// Parent‐specific notifications
///////////////////////////

/**
 * 6. GET '/parent/:parentId' – list notifications for a specific parent
 *    – The parent themself or an Admin may view.
 */
router.get(
  "/parent/:parentId",
  authenticate,
  (req, res, next) => {
    const { parentId } = req.params;
    const { _id, role } = req.user;
    if (
      role === "school_admin" ||
      (_id.toString() === parentId && role === "parent")
    ) {
      return next();
    }
    return res
      .status(403)
      .json({
        success: false,
        message: "Only that parent or Admin may view these notifications.",
      });
  },
  notificationController.listParentNotifications
);

/**
 * 7. PUT '/parent/:parentId/preferences' – update a parent’s notification preferences
 *    – Only the parent themself can update their own preferences.
 */
router.put(
  "/parent/:parentId/preferences",
  authenticate,
  (req, res, next) => {
    const { parentId } = req.params;
    const { _id, role } = req.user;
    if (_id.toString() === parentId && role === "parent") {
      return next();
    }
    return res
      .status(403)
      .json({
        success: false,
        message: "Only that parent may update preferences.",
      });
  },
  notificationController.updateParentPreferences
);

module.exports = router;
