// routes/calendarRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate, isAdmin } = require("../middleware/authMiddleware");
const calendarController = require("../controllers/calendarController");

/**
 * 1. GET '/' – list academic calendar items.
 *    - Any authenticated user (teacher or admin) can view the calendar.
 */
router.get("/", authenticate, calendarController.listCalendarItems);

/**
 * 2. POST '/' – create a new calendar item (holidays, exams, etc.).
 *    - Only Admin can create.
 */
router.post("/", authenticate, isAdmin, calendarController.createCalendarItem);

/**
 * 3. PUT '/:calendarId' – update an existing calendar item.
 *    - Only Admin can update.
 */
router.put(
  "/:calendarId",
  authenticate,
  isAdmin,
  calendarController.updateCalendarItem
);

/**
 * 4. DELETE '/:calendarId' – delete a calendar item.
 *    - Only Admin can delete.
 */
router.delete(
  "/:calendarId",
  authenticate,
  isAdmin,
  calendarController.deleteCalendarItem
);

module.exports = router;
