// controllers/feeController.js

/**
 * Fee Controller
 *  - listFeeStructures:   Return all fee structures (with optional classId filter)
 *  - createFeeStructure:  Create a new fee structure
 *  - getFeeStructure:     Return a fee structure by ID
 *  - updateFeeStructure:  Update an existing fee structure
 *  - deleteFeeStructure:  Delete a fee structure
 *
 *  - listPayments:        Return all payments (with optional studentId or status filter)
 *  - createPayment:       Record a new payment
 *  - getPaymentById:      Return a payment by ID
 *  - updatePayment:       Update an existing payment
 *  - deletePayment:       Delete a payment record
 *
 *  - sendFeeReminders:    Create notifications as fee reminders for students
 *  - listReminders:       List all scheduled fee reminders (Notification documents of type 'Student' with 'Fee Reminder' in message)
 *  - getReceipt:          Return the receipt URL or payment details for a given payment
 *
 * Assumptions:
 *  - authMiddleware populates req.user with { userId, role }
 *  - Only "school_admin" (or privileged roles) can create/update/delete structures and payments
 *  - FeeStructure model has fields: classId, amount, dueDate, description
 *  - Payment model has fields: studentId, feeStructureId, amountPaid, paymentDate, method, transactionId, receiptUrl
 *  - Notification model is used to store fee reminders (type: 'Student', message, studentId, scheduleAt, issuedAt)
 *  - Student model exists to validate studentId
 */

const mongoose = require("mongoose");
const { FeeStructure, Payment, Student, Notification } = require("../models");

module.exports = {
  // ─────────── Fee Structures ───────────

  // GET /fees/structures
  listFeeStructures: async (req, res) => {
    try {
      const { classId } = req.query;
      const filter = {};
      if (classId) {
        if (!mongoose.Types.ObjectId.isValid(classId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid classId." });
        }
        filter.classId = classId;
      }
      const structures = await FeeStructure.find(filter).populate(
        "classId",
        "name grade section year"
      );
      return res.status(200).json({ success: true, data: structures });
    } catch (err) {
      console.error("feeController.listFeeStructures error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /fees/structures
  createFeeStructure: async (req, res) => {
    try {
      const { classId, amount, dueDate, description } = req.body;
      if (!classId || amount === undefined || !dueDate) {
        return res.status(400).json({
          success: false,
          message: "classId, amount, and dueDate are required.",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid classId." });
      }
      const newStructure = await FeeStructure.create({
        classId,
        amount,
        dueDate: new Date(dueDate),
        description,
      });
      const populated = await FeeStructure.findById(newStructure._id).populate(
        "classId",
        "name grade section year"
      );
      return res.status(201).json({
        success: true,
        message: "Fee structure created successfully.",
        data: populated,
      });
    } catch (err) {
      console.error("feeController.createFeeStructure error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /fees/structures/:structureId
  getFeeStructure: async (req, res) => {
    try {
      const { structureId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(structureId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid structureId." });
      }
      const structure = await FeeStructure.findById(structureId).populate(
        "classId",
        "name grade section year"
      );
      if (!structure) {
        return res
          .status(404)
          .json({ success: false, message: "Fee structure not found." });
      }
      return res.status(200).json({ success: true, data: structure });
    } catch (err) {
      console.error("feeController.getFeeStructure error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /fees/structures/:structureId
  updateFeeStructure: async (req, res) => {
    try {
      const { structureId } = req.params;
      const { classId, amount, dueDate, description } = req.body;
      if (!mongoose.Types.ObjectId.isValid(structureId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid structureId." });
      }
      const updates = {};
      if (classId) {
        if (!mongoose.Types.ObjectId.isValid(classId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid classId." });
        }
        updates.classId = classId;
      }
      if (amount !== undefined) updates.amount = amount;
      if (dueDate) updates.dueDate = new Date(dueDate);
      if (description) updates.description = description;

      const updated = await FeeStructure.findByIdAndUpdate(
        structureId,
        { $set: updates },
        { new: true, runValidators: true, context: "query" }
      ).populate("classId", "name grade section year");

      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: "Fee structure not found." });
      }
      return res.status(200).json({
        success: true,
        message: "Fee structure updated successfully.",
        data: updated,
      });
    } catch (err) {
      console.error("feeController.updateFeeStructure error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // DELETE /fees/structures/:structureId
  deleteFeeStructure: async (req, res) => {
    try {
      const { structureId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(structureId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid structureId." });
      }
      const deleted = await FeeStructure.findByIdAndDelete(structureId);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Fee structure not found." });
      }
      return res
        .status(200)
        .json({
          success: true,
          message: "Fee structure deleted successfully.",
        });
    } catch (err) {
      console.error("feeController.deleteFeeStructure error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // ─────────── Student Payments ───────────

  // GET /fees/payments
  listPayments: async (req, res) => {
    try {
      const { studentId } = req.query;
      const filter = {};
      if (studentId) {
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid studentId." });
        }
        filter.studentId = studentId;
      }
      const payments = await Payment.find(filter)
        .populate("studentId", "name studentId")
        .populate("feeStructureId", "classId amount dueDate");
      return res.status(200).json({ success: true, data: payments });
    } catch (err) {
      console.error("feeController.listPayments error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /fees/payments
  createPayment: async (req, res) => {
    try {
      const {
        studentId,
        feeStructureId,
        amountPaid,
        paymentDate,
        method = "other",
        transactionId,
        receiptUrl,
      } = req.body;

      if (!studentId || !feeStructureId || amountPaid === undefined) {
        return res.status(400).json({
          success: false,
          message: "studentId, feeStructureId, and amountPaid are required.",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }
      if (!mongoose.Types.ObjectId.isValid(feeStructureId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid feeStructureId." });
      }

      // Check that student exists
      const studentExists = await Student.exists({ _id: studentId });
      if (!studentExists) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      const payment = await Payment.create({
        studentId,
        feeStructureId,
        amountPaid,
        paymentDate: paymentDate ? new Date(paymentDate) : Date.now(),
        method,
        transactionId,
        receiptUrl,
      });

      const populated = await Payment.findById(payment._id)
        .populate("studentId", "name studentId")
        .populate("feeStructureId", "classId amount dueDate");

      return res.status(201).json({
        success: true,
        message: "Payment recorded successfully.",
        data: populated,
      });
    } catch (err) {
      console.error("feeController.createPayment error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /fees/payments/:paymentId
  getPaymentById: async (req, res) => {
    try {
      const { paymentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid paymentId." });
      }
      const payment = await Payment.findById(paymentId)
        .populate("studentId", "name studentId")
        .populate("feeStructureId", "classId amount dueDate");
      if (!payment) {
        return res
          .status(404)
          .json({ success: false, message: "Payment not found." });
      }
      return res.status(200).json({ success: true, data: payment });
    } catch (err) {
      console.error("feeController.getPaymentById error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /fees/payments/:paymentId
  updatePayment: async (req, res) => {
    try {
      const { paymentId } = req.params;
      const { amountPaid, paymentDate, method, transactionId, receiptUrl } =
        req.body;

      if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid paymentId." });
      }

      const updates = {};
      if (amountPaid !== undefined) updates.amountPaid = amountPaid;
      if (paymentDate) updates.paymentDate = new Date(paymentDate);
      if (method) updates.method = method;
      if (transactionId) updates.transactionId = transactionId;
      if (receiptUrl) updates.receiptUrl = receiptUrl;

      const updated = await Payment.findByIdAndUpdate(
        paymentId,
        { $set: updates },
        { new: true, runValidators: true, context: "query" }
      )
        .populate("studentId", "name studentId")
        .populate("feeStructureId", "classId amount dueDate");

      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: "Payment not found." });
      }
      return res.status(200).json({
        success: true,
        message: "Payment updated successfully.",
        data: updated,
      });
    } catch (err) {
      console.error("feeController.updatePayment error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // DELETE /fees/payments/:paymentId
  deletePayment: async (req, res) => {
    try {
      const { paymentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid paymentId." });
      }

      const deleted = await Payment.findByIdAndDelete(paymentId);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Payment not found." });
      }
      return res
        .status(200)
        .json({ success: true, message: "Payment deleted successfully." });
    } catch (err) {
      console.error("feeController.deletePayment error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // ─────────── Fee Reminders & Receipts ───────────

  // POST /fees/reminders
  sendFeeReminders: async (req, res) => {
    try {
      const { studentIds, message, scheduleAt } = req.body;
      if (!Array.isArray(studentIds) || studentIds.length === 0 || !message) {
        return res.status(400).json({
          success: false,
          message: "studentIds (array) and message are required.",
        });
      }

      const notifications = [];
      const now = new Date();

      for (const sid of studentIds) {
        if (!mongoose.Types.ObjectId.isValid(sid)) {
          continue; // skip invalid IDs
        }
        const studentExists = await Student.exists({ _id: sid });
        if (!studentExists) {
          continue;
        }
        notifications.push({
          type: "Student",
          message,
          studentId: sid,
          scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
          issuedAt: scheduleAt ? undefined : now,
        });
      }

      if (notifications.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid student IDs provided.",
        });
      }

      const created = await Notification.insertMany(notifications);
      return res.status(201).json({
        success: true,
        message: "Fee reminders scheduled successfully.",
        data: created,
      });
    } catch (err) {
      console.error("feeController.sendFeeReminders error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /fees/reminders
  listReminders: async (req, res) => {
    try {
      // List notifications of type 'Student' whose message contains "fee" or "Fee"
      const reminders = await Notification.find({
        type: "Student",
        message: { $regex: /fee/i },
      }).sort({ scheduleAt: 1, issuedAt: -1 });
      return res.status(200).json({ success: true, data: reminders });
    } catch (err) {
      console.error("feeController.listReminders error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /fees/receipts/:paymentId
  getReceipt: async (req, res) => {
    try {
      const { paymentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid paymentId." });
      }
      const payment = await Payment.findById(paymentId).select(
        "receiptUrl studentId amountPaid paymentDate method"
      );
      if (!payment) {
        return res
          .status(404)
          .json({ success: false, message: "Payment not found." });
      }

      if (payment.receiptUrl) {
        // If a receipt URL is stored, return it
        return res.status(200).json({
          success: true,
          data: {
            receiptUrl: payment.receiptUrl,
            studentId: payment.studentId,
            amountPaid: payment.amountPaid,
            paymentDate: payment.paymentDate,
            method: payment.method,
          },
        });
      }

      // Otherwise, return payment details (front-end can generate a receipt)
      return res.status(200).json({
        success: true,
        data: {
          studentId: payment.studentId,
          amountPaid: payment.amountPaid,
          paymentDate: payment.paymentDate,
          method: payment.method,
        },
      });
    } catch (err) {
      console.error("feeController.getReceipt error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
