// routes/eventRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const eventController = require("../controllers/eventController");

/**
 * Helper inline to allow Teacher OR Admin
 */
function isTeacherOrAdmin(req, res, next) {
  const role = req.user.role;
  if (role === "teacher" || role === "school_admin") {
    return next();
  }
  return res
    .status(403)
    .json({ success: false, message: "Teacher or Admin role required." });
}

///////////////////////////
// Event CRUD
///////////////////////////

/**
 * 1. GET '/' – list all events
 *    – Any authenticated user can view events.
 */
router.get("/", authenticate, eventController.listEvents);

/**
 * 2. POST '/' – create a new event
 *    – Only Teacher or Admin can create.
 */
router.post("/", authenticate, isTeacherOrAdmin, eventController.createEvent);

/**
 * 3. GET '/:eventId' – get an event by ID
 *    – Any authenticated user can view the details.
 */
router.get("/:eventId", authenticate, eventController.getEventById);

/**
 * 4. PUT '/:eventId' – update an event
 *    – Only Teacher or Admin can update.
 */
router.put(
  "/:eventId",
  authenticate,
  isTeacherOrAdmin,
  eventController.updateEvent
);

/**
 * 5. DELETE '/:eventId' – delete an event
 *    – Only Teacher or Admin can delete.
 */
router.delete(
  "/:eventId",
  authenticate,
  isTeacherOrAdmin,
  eventController.deleteEvent
);

///////////////////////////
// Send notifications for a specific event
///////////////////////////

/**
 * 6. POST '/:eventId/notifications' – send notifications for an event
 *    – Only Teacher or Admin can send notifications.
 */
router.post(
  "/:eventId/notifications",
  authenticate,
  isTeacherOrAdmin,
  eventController.sendEventNotifications
);

module.exports = router;
