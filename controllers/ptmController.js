// controllers/ptmController.js

/**
 * PTM (Parent-Teacher Meeting) Controller
 *  - getTeacherSlots:            List all PTM slots for a specific teacher
 *  - createTeacherSlots:         Create one or more PTM slots for a teacher
 *  - getParentAvailableSlots:    List all unbooked PTM slots (optionally filter by teacher or date)
 *  - bookSlot:                   Book a specific PTM slot for a parent/student
 *  - listParentBookings:         List all PTM bookings for a given parent
 *  - cancelBooking:              Cancel an existing PTM booking (frees the slot)
 *
 * Assumptions:
 *  - authMiddleware populates req.user = { userId, role }
 *  - Only teachers (or admins) can create slots; parents or admins can view and book
 *  - Models used:
 *      PTMSlot:     { teacherId, date, startTime, endTime, isBooked: Boolean, bookingId: ObjectId }
 *      PTMBooking:  { slotId, parentId, studentId, bookedAt: Date, status: String }
 *      Teacher:     { _id, name, ... }
 *      Student:     { _id, name, ... }
 */

const mongoose = require("mongoose");
const { PTMSlot, PTMBooking, Teacher, Student } = require("../models");

module.exports = {
  // GET /ptm/slots/teacher/:teacherId
  getTeacherSlots: async (req, res) => {
    try {
      const { teacherId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid teacherId." });
      }

      // Verify teacher exists
      const teacherExists = await Teacher.exists({ _id: teacherId });
      if (!teacherExists) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found." });
      }

      const slots = await PTMSlot.find({ teacherId })
        .sort({ date: 1, startTime: 1 })
        .lean();

      return res.status(200).json({ success: true, data: slots });
    } catch (err) {
      console.error("ptmController.getTeacherSlots error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /ptm/slots
  // Body: { teacherId, slots: [ { date, startTime, endTime } ] }
  createTeacherSlots: async (req, res) => {
    try {
      const { teacherId, slots } = req.body;
      if (!teacherId || !Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({
          success: false,
          message: "teacherId and a non-empty slots array are required.",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid teacherId." });
      }
      // Verify teacher exists
      const teacherExists = await Teacher.exists({ _id: teacherId });
      if (!teacherExists) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found." });
      }

      const toCreate = [];
      for (const s of slots) {
        const { date, startTime, endTime } = s;
        if (!date || !startTime || !endTime) {
          return res.status(400).json({
            success: false,
            message: "Each slot must include date, startTime, and endTime.",
          });
        }
        const slotDate = new Date(date);
        if (isNaN(slotDate.getTime())) {
          return res
            .status(400)
            .json({
              success: false,
              message: "Invalid date in one of the slots.",
            });
        }
        toCreate.push({
          teacherId,
          date: slotDate,
          startTime,
          endTime,
          isBooked: false,
          bookingId: null,
        });
      }

      const createdSlots = await PTMSlot.insertMany(toCreate);
      return res.status(201).json({
        success: true,
        message: "PTM slots created successfully.",
        data: createdSlots,
      });
    } catch (err) {
      console.error("ptmController.createTeacherSlots error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /ptm/slots/parent/:parentId?teacherId=&date=
  getParentAvailableSlots: async (req, res) => {
    try {
      const { parentId } = req.params;
      const { teacherId, date } = req.query;

      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid parentId." });
      }
      // (Optionally) verify parentId corresponds to a valid parent record
      // In this simplified implementation, we trust the parentId provided.

      const filter = { isBooked: false };
      if (teacherId) {
        if (!mongoose.Types.ObjectId.isValid(teacherId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid teacherId." });
        }
        filter.teacherId = teacherId;
      }
      if (date) {
        const slotDate = new Date(date);
        if (isNaN(slotDate.getTime())) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid date." });
        }
        const nextDay = new Date(slotDate);
        nextDay.setDate(slotDate.getDate() + 1);
        filter.date = { $gte: slotDate, $lt: nextDay };
      }

      const slots = await PTMSlot.find(filter)
        .sort({ date: 1, startTime: 1 })
        .populate("teacherId", "name teacherId")
        .lean();

      return res.status(200).json({ success: true, data: slots });
    } catch (err) {
      console.error("ptmController.getParentAvailableSlots error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /ptm/bookings
  // Body: { slotId, parentId, studentId }
  bookSlot: async (req, res) => {
    try {
      const { slotId, parentId, studentId } = req.body;
      if (!slotId || !parentId || !studentId) {
        return res.status(400).json({
          success: false,
          message: "slotId, parentId, and studentId are required.",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(slotId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid slotId." });
      }
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid parentId." });
      }
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }

      // Verify slot
      const slot = await PTMSlot.findById(slotId);
      if (!slot) {
        return res
          .status(404)
          .json({ success: false, message: "PTM slot not found." });
      }
      if (slot.isBooked) {
        return res
          .status(409)
          .json({ success: false, message: "PTM slot already booked." });
      }

      // Verify student exists
      const studentExists = await Student.exists({ _id: studentId });
      if (!studentExists) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      // Create booking
      const booking = await PTMBooking.create({
        slotId,
        parentId,
        studentId,
        bookedAt: new Date(),
        status: "confirmed",
      });

      // Mark slot as booked
      slot.isBooked = true;
      slot.bookingId = booking._id;
      await slot.save();

      return res.status(201).json({
        success: true,
        message: "PTM slot booked successfully.",
        data: booking,
      });
    } catch (err) {
      console.error("ptmController.bookSlot error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /ptm/bookings/parent/:parentId
  listParentBookings: async (req, res) => {
    try {
      const { parentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid parentId." });
      }

      // Authorization: only the parent themselves or an admin
      if (req.user.role === "parent" && req.user.userId !== parentId) {
        return res.status(403).json({ success: false, message: "Forbidden." });
      }

      const bookings = await PTMBooking.find({ parentId })
        .sort({ bookedAt: -1 })
        .populate({
          path: "slotId",
          populate: { path: "teacherId", select: "name teacherId" },
        })
        .populate("studentId", "name studentId")
        .lean();

      return res.status(200).json({ success: true, data: bookings });
    } catch (err) {
      console.error("ptmController.listParentBookings error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /ptm/bookings/:bookingId/cancel
  cancelBooking: async (req, res) => {
    try {
      const { bookingId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid bookingId." });
      }

      // Find booking
      const booking = await PTMBooking.findById(bookingId);
      if (!booking) {
        return res
          .status(404)
          .json({ success: false, message: "Booking not found." });
      }

      // Authorization: only parent who booked or admin can cancel
      if (
        req.user.role === "parent" &&
        booking.parentId.toString() !== req.user.userId
      ) {
        return res.status(403).json({ success: false, message: "Forbidden." });
      }

      if (booking.status === "canceled") {
        return res
          .status(400)
          .json({ success: false, message: "Booking is already canceled." });
      }

      // Update booking status
      booking.status = "canceled";
      await booking.save();

      // Free the slot
      const slot = await PTMSlot.findById(booking.slotId);
      if (slot) {
        slot.isBooked = false;
        slot.bookingId = null;
        await slot.save();
      }

      return res.status(200).json({
        success: true,
        message: "Booking canceled and slot freed successfully.",
      });
    } catch (err) {
      console.error("ptmController.cancelBooking error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
