// routes/ptmRoutes.js
const express = require("express");
const router = express.Router();

const {
  authenticate,
  isAdmin,
  isTeacher,
  isParent,
} = require("../middleware/authMiddleware");
const ptmController = require("../controllers/ptmController");

/**
 * Helper inline to allow Teacher OR Admin when teacherId param is involved
 */
function canManageTeacherSlots(req, res, next) {
  const { teacherId } = req.params;
  const { _id, role } = req.user;
  if (
    role === "school_admin" ||
    (role === "teacher" && _id.toString() === teacherId)
  ) {
    return next();
  }
  return res
    .status(403)
    .json({
      success: false,
      message: "Only that teacher or Admin may manage these slots.",
    });
}

/**
 * Helper inline to allow only Parent OR Admin when parentId param is involved
 */
function canViewParentSlots(req, res, next) {
  const { parentId } = req.params;
  const { _id, role } = req.user;
  if (
    role === "school_admin" ||
    (role === "parent" && _id.toString() === parentId)
  ) {
    return next();
  }
  return res
    .status(403)
    .json({
      success: false,
      message: "Only that parent or Admin may view these slots.",
    });
}

/**
 * Helper inline to allow only Parent OR Admin for bookings (body contains parentId)
 */
function canCreateBooking(req, res, next) {
  const { parentId } = req.body;
  const { _id, role } = req.user;
  if (
    role === "school_admin" ||
    (role === "parent" && _id.toString() === parentId)
  ) {
    return next();
  }
  return res
    .status(403)
    .json({
      success: false,
      message: "Only that parent or Admin may create a booking.",
    });
}

/**
 * Helper inline to allow only Parent OR Admin when parentId param is used in listing bookings
 */
function canListParentBookings(req, res, next) {
  const { parentId } = req.params;
  const { _id, role } = req.user;
  if (
    role === "school_admin" ||
    (role === "parent" && _id.toString() === parentId)
  ) {
    return next();
  }
  return res
    .status(403)
    .json({
      success: false,
      message: "Only that parent or Admin may view bookings.",
    });
}

/**
 * Helper inline to allow only the booking’s parent OR Admin to cancel a booking.
 * We assume the controller will verify that req.user is parent of that booking.
 * At route level, we allow Admin or any authenticated user—controller should return 403 if not booking owner.
 */
router.get(
  "/slots/teacher/:teacherId",
  authenticate,
  canManageTeacherSlots,
  ptmController.getTeacherSlots
);

router.post(
  "/slots",
  authenticate,
  // Only a Teacher for their own slots or Admin:
  (req, res, next) => {
    const { teacherId } = req.body;
    const { _id, role } = req.user;
    if (
      role === "school_admin" ||
      (role === "teacher" && _id.toString() === teacherId)
    ) {
      return next();
    }
    return res
      .status(403)
      .json({
        success: false,
        message: "Only that teacher or Admin may create slots.",
      });
  },
  ptmController.createTeacherSlots
);

router.get(
  "/slots/parent/:parentId",
  authenticate,
  canViewParentSlots,
  ptmController.getParentAvailableSlots
);

router.post(
  "/bookings",
  authenticate,
  canCreateBooking,
  ptmController.bookSlot
);

router.get(
  "/bookings/parent/:parentId",
  authenticate,
  canListParentBookings,
  ptmController.listParentBookings
);

router.put(
  "/bookings/:bookingId/cancel",
  authenticate,
  // Controller should verify booking ownership; here allow Admin or any authenticated parent
  (req, res, next) => {
    const { role } = req.user;
    if (role === "school_admin" || role === "parent") {
      return next();
    }
    return res
      .status(403)
      .json({
        success: false,
        message: "Only Parent or Admin may cancel a booking.",
      });
  },
  ptmController.cancelBooking
);

module.exports = router;
