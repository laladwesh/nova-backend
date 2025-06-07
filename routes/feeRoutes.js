// routes/feeRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const feeController = require("../controllers/feeController");

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

/**
 * Helper inline to allow Admin only
 */
function isAdmin(req, res, next) {
  if (req.user.role === "school_admin") {
    return next();
  }
  return res
    .status(403)
    .json({ success: false, message: "Admin role required." });
}

///////////////////////////
// Fee Structures
///////////////////////////

/**
 * 1. GET '/structures' – list all fee structures
 *    – Only Admin can view fee structures.
 */
router.get(
  "/structures",
  authenticate,
  isAdmin,
  feeController.listFeeStructures
);

/**
 * 2. POST '/structures' – create a new fee structure
 *    – Only Admin can create.
 */
router.post(
  "/structures",
  authenticate,
  isAdmin,
  feeController.createFeeStructure
);

/**
 * 3. GET '/structures/:structureId' – get one fee structure
 *    – Only Admin can fetch.
 */
router.get(
  "/structures/:structureId",
  authenticate,
  isAdmin,
  feeController.getFeeStructure
);

/**
 * 4. PUT '/structures/:structureId' – update a fee structure
 *    – Only Admin can update.
 */
router.put(
  "/structures/:structureId",
  authenticate,
  isAdmin,
  feeController.updateFeeStructure
);

/**
 * 5. DELETE '/structures/:structureId' – delete a fee structure
 *    – Only Admin can delete.
 */
router.delete(
  "/structures/:structureId",
  authenticate,
  isAdmin,
  feeController.deleteFeeStructure
);

///////////////////////////
// Student Payments
///////////////////////////

/**
 * 6. GET '/payments' – list all payments
 *    – Only Teacher or Admin can view payment records.
 */
router.get(
  "/payments",
  authenticate,
  isTeacherOrAdmin,
  feeController.listPayments
);

/**
 * 7. POST '/payments' – record a new payment
 *    – Only Teacher or Admin can create a payment record.
 */
router.post(
  "/payments",
  authenticate,
  isTeacherOrAdmin,
  feeController.createPayment
);

/**
 * 8. GET '/payments/:paymentId' – get one payment by ID
 *    – Only Teacher or Admin can fetch a payment.
 */
router.get(
  "/payments/:paymentId",
  authenticate,
  isTeacherOrAdmin,
  feeController.getPaymentById
);

/**
 * 9. PUT '/payments/:paymentId' – update a payment
 *    – Only Teacher or Admin can update.
 */
router.put(
  "/payments/:paymentId",
  authenticate,
  isTeacherOrAdmin,
  feeController.updatePayment
);

/**
 * 10. DELETE '/payments/:paymentId' – delete a payment
 *     – Only Teacher or Admin can delete.
 */
router.delete(
  "/payments/:paymentId",
  authenticate,
  isTeacherOrAdmin,
  feeController.deletePayment
);

///////////////////////////
// Fee Reminders & Receipts
///////////////////////////

/**
 * 11. POST '/reminders' – send fee reminders to students
 *     – Only Teacher or Admin can send reminders.
 */
router.post(
  "/reminders",
  authenticate,
  isTeacherOrAdmin,
  feeController.sendFeeReminders
);

/**
 * 12. GET '/reminders' – list sent reminders
 *     – Only Teacher or Admin can view reminders.
 */
router.get(
  "/reminders",
  authenticate,
  isTeacherOrAdmin,
  feeController.listReminders
);

/**
 * 13. GET '/receipts/:paymentId' – fetch receipt for a payment
 *     – Only Teacher or Admin can fetch receipts.
 */
router.get(
  "/receipts/:paymentId",
  authenticate,
  isTeacherOrAdmin,
  feeController.getReceipt
);

module.exports = router;
